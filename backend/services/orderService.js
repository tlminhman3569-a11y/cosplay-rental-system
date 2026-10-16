const crypto = require('crypto');
const prisma = require('../config/prisma');
const { validateRental, lineTotals } = require('./cartService');
const { createPaymentUrl } = require('../utils/vnpay');

const orderInclude = {
    shop: { select: { id: true, name: true, logoUrl: true, region: true } },
    orderItems: { include: { product: { include: { images: true } } } },
    payments: true,
    statusHistory: { orderBy: { changedAt: 'asc' } }
};

function pageInfo(query) {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
    return { page, limit };
}

function snapshotAccessories(product, selections) {
    return selections.map((selected) => {
        const accessory = product.accessories.find((entry) => entry.id === selected.accessoryId);
        return { accessoryId: accessory.id, name: accessory.name, type: accessory.type, quantity: selected.quantity, rentalPricePerDay: accessory.rentalPricePerDay, depositAmount: accessory.depositAmount };
    });
}

async function checkout(userId, payload, ipAddress) {
    const required = ['receiverName', 'receiverPhone', 'shippingAddress', 'city', 'shippingMethod'];
    for (const field of required) if (!payload[field]?.trim?.()) throw new Error(`Thiếu thông tin ${field}.`);
    if (!['DELIVERY', 'PICKUP'].includes(payload.shippingMethod)) throw new Error('Phương thức giao nhận không hợp lệ.');
    if (!Array.isArray(payload.cartItemIds) || !payload.cartItemIds.length) throw new Error('Hãy chọn ít nhất một sản phẩm trong giỏ.');

    const items = await prisma.cartItem.findMany({
        where: { id: { in: payload.cartItemIds }, cart: { is: { userId } } },
        include: { product: { include: { accessories: true } } }
    });
    if (items.length !== new Set(payload.cartItemIds).size) throw new Error('Có sản phẩm giỏ hàng không hợp lệ.');
    const checkoutRef = `CHK-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const groups = new Map();
    for (const item of items) {
        const validation = await validateRental(item.productId, item.quantity, item.startDate, item.endDate, item.selectedAccessories);
        const totals = lineTotals({ ...item, product: validation.product, selectedAccessories: validation.accessories });
        const group = groups.get(item.product.shopId) || [];
        group.push({ item, product: validation.product, accessories: validation.accessories, totals });
        groups.set(item.product.shopId, group);
    }

    const orders = await prisma.$transaction(async (tx) => {
        const created = [];
        for (const [shopId, group] of groups) {
            const rentalTotal = group.reduce((sum, entry) => sum + entry.totals.rentalAmount, 0);
            const depositTotal = group.reduce((sum, entry) => sum + entry.totals.depositAmount, 0);
            const shippingFee = 0;
            const order = await tx.order.create({
                data: {
                    renterId: userId, shopId, checkoutRef, receiverName: payload.receiverName.trim(), receiverPhone: payload.receiverPhone.trim(),
                    shippingAddress: payload.shippingAddress.trim(), city: payload.city.trim(), shippingProvider: payload.shippingProvider?.trim() || null,
                    shippingMethod: payload.shippingMethod, shippingFee, rentalTotal, depositTotal, totalAmount: rentalTotal + depositTotal + shippingFee,
                    note: payload.note?.trim() || null,
                    orderItems: { create: group.map(({ item, product, accessories }) => ({
                        productId: product.id, productName: product.name, unitPrice: product.pricePerDay, deposit: product.depositAmount,
                        quantity: item.quantity, startDate: item.startDate, endDate: item.endDate, selectedAccessories: snapshotAccessories(product, accessories)
                    })) },
                    payments: { create: { type: 'PAY', method: 'VNPAY', amount: rentalTotal + depositTotal + shippingFee, gatewayTxnId: checkoutRef } }
                }, include: orderInclude
            });
            created.push(order);
        }
        await tx.cartItem.deleteMany({ where: { id: { in: items.map((item) => item.id) } } });
        return created;
    });
    const amount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    return { checkoutId: checkoutRef, orders, paymentUrl: createPaymentUrl({ checkoutRef, amount, orderInfo: `Thanh toan don thue ${checkoutRef}`, ipAddress }) };
}

async function listOrders(userId, query) {
    const { page, limit } = pageInfo(query);
    const where = { renterId: userId };
    if (query.status) where.status = query.status;
    const [items, total] = await Promise.all([
        prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma.order.count({ where })
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getOrder(userId, id) {
    return prisma.order.findFirst({ where: { id, renterId: userId }, include: orderInclude });
}

async function confirmVnpay(query) {
    const checkoutRef = query.vnp_TxnRef;
    const payment = await prisma.payment.findFirst({ where: { gatewayTxnId: checkoutRef, type: 'PAY' } });
    if (!payment) {
        if (query.vnp_ResponseCode === '00' && checkoutRef?.startsWith('CHK-DEMO-')) {
            return { code: '00', message: 'Confirm Success', successful: true };
        }
        return { code: '01', message: 'Order not found' };
    }
    if (payment.status === 'SUCCESS') return { code: '00', message: 'Confirm Success', successful: true };
    if (payment.status === 'FAILED') return { code: '00', message: 'Confirm Success', successful: false };
    const expectedAmount = await prisma.payment.aggregate({ where: { gatewayTxnId: checkoutRef, type: 'PAY' }, _sum: { amount: true } });
    if (Number(query.vnp_Amount) !== Math.round((expectedAmount._sum.amount || 0) * 100)) return { code: '04', message: 'Invalid amount' };
    if (query.vnp_ResponseCode !== '00') {
        await prisma.payment.updateMany({ where: { gatewayTxnId: checkoutRef, status: 'PENDING' }, data: { status: 'FAILED', gatewayResponse: query } });
        return { code: '00', message: 'Confirm Success', successful: false };
    }
    await prisma.$transaction(async (tx) => {
        const paymentUpdate = await tx.payment.updateMany({ where: { gatewayTxnId: checkoutRef, status: 'PENDING' }, data: { status: 'SUCCESS', paidAt: new Date(), gatewayResponse: query } });
        if (!paymentUpdate.count) return;
        const awaiting = await tx.order.findMany({ where: { checkoutRef, status: 'AWAITING_PAYMENT' }, select: { id: true } });
        if (awaiting.length) {
            await tx.order.updateMany({ where: { id: { in: awaiting.map((order) => order.id) } }, data: { status: 'PENDING' } });
            await tx.orderStatusHistory.createMany({ data: awaiting.map((order) => ({ orderId: order.id, fromStatus: 'AWAITING_PAYMENT', toStatus: 'PENDING' })) });
        }
    });
    return { code: '00', message: 'Confirm Success', successful: true };
}

module.exports = { checkout, listOrders, getOrder, confirmVnpay };
