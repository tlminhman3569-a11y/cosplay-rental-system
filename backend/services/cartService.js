const prisma = require('../config/prisma');
const { productInclude } = require('./productService');

const blockingStatuses = ['PENDING', 'CONFIRMED', 'READY', 'SHIPPING', 'RENTING', 'RETURNED'];

function rentalDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const milliseconds = end.getTime() - start.getTime();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || milliseconds < 0) return 0;
    return Math.floor(milliseconds / 86400000) + 1;
}

function normalizeAccessories(value) {
    if (value == null) return [];
    if (!Array.isArray(value)) throw new Error('Phụ kiện phải là một mảng.');
    return value.map((item) => ({ accessoryId: String(item.accessoryId || ''), quantity: Number(item.quantity || 1) }))
        .filter((item) => item.accessoryId && Number.isInteger(item.quantity) && item.quantity > 0);
}

async function validateRental(productId, quantity, startDate, endDate, selectedAccessories) {
    const product = await prisma.product.findFirst({ where: { id: productId, status: 'ACTIVE' }, include: { accessories: true } });
    if (!product) throw new Error('Sản phẩm không còn khả dụng.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.quantity) throw new Error('Số lượng thuê không hợp lệ.');
    const days = rentalDays(startDate, endDate);
    if (days < product.minRentalDays || days > product.maxRentalDays) throw new Error(`Thời gian thuê phải từ ${product.minRentalDays} đến ${product.maxRentalDays} ngày.`);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const cleaningStart = new Date(start.getTime() - product.cleaningDays * 86400000);
    const blocked = await prisma.productBlockedDate.findFirst({ where: { productId, startDate: { lte: end }, endDate: { gte: start } } });
    if (blocked) throw new Error('Sản phẩm đã bị khóa trong khoảng ngày đã chọn.');
    const reservations = await prisma.orderItem.findMany({
        where: { productId, startDate: { lte: end }, endDate: { gte: cleaningStart }, order: { is: { status: { in: blockingStatuses } } } },
        select: { quantity: true }
    });
    if (reservations.reduce((sum, item) => sum + item.quantity, 0) + quantity > product.quantity) throw new Error('Sản phẩm không đủ số lượng trong khoảng ngày đã chọn.');

    const accessories = normalizeAccessories(selectedAccessories);
    for (const selected of accessories) {
        if (!product.accessories.some((accessory) => accessory.id === selected.accessoryId)) throw new Error('Có phụ kiện không thuộc sản phẩm này.');
    }
    return { product, days, accessories };
}

function lineTotals(item) {
    const days = rentalDays(item.startDate, item.endDate);
    const accessories = item.product.accessories || [];
    const selections = Array.isArray(item.selectedAccessories) ? item.selectedAccessories : [];
    const accessoryRental = selections.reduce((sum, selected) => {
        const accessory = accessories.find((entry) => entry.id === selected.accessoryId);
        return sum + (accessory ? accessory.rentalPricePerDay * days * selected.quantity : 0);
    }, 0);
    const accessoryDeposit = selections.reduce((sum, selected) => {
        const accessory = accessories.find((entry) => entry.id === selected.accessoryId);
        return sum + (accessory ? accessory.depositAmount * selected.quantity : 0);
    }, 0);
    return {
        rentalDays: days,
        rentalAmount: (item.product.pricePerDay * days + accessoryRental) * item.quantity,
        depositAmount: (item.product.depositAmount + accessoryDeposit) * item.quantity
    };
}

async function getCart(userId) {
    const cart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: { include: productInclude } } } } });
    const items = (cart?.items || []).map((item) => ({ ...item, totals: lineTotals(item) }));
    const totals = items.reduce((result, item) => ({
        rentalTotal: result.rentalTotal + item.totals.rentalAmount,
        depositTotal: result.depositTotal + item.totals.depositAmount,
        totalAmount: result.totalAmount + item.totals.rentalAmount + item.totals.depositAmount
    }), { rentalTotal: 0, depositTotal: 0, totalAmount: 0 });
    return { items, totals };
}

async function createItem(userId, payload) {
    const quantity = Number(payload.quantity || 1);
    const validation = await validateRental(payload.productId, quantity, payload.startDate, payload.endDate, payload.selectedAccessories);
    const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: validation.product.id, quantity, startDate: new Date(payload.startDate), endDate: new Date(payload.endDate), selectedAccessories: validation.accessories } });
    return getCart(userId);
}

async function updateItem(userId, itemId, payload) {
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cart: { is: { userId } } } });
    if (!item) return null;
    const next = { quantity: payload.quantity == null ? item.quantity : Number(payload.quantity), startDate: payload.startDate || item.startDate, endDate: payload.endDate || item.endDate, selectedAccessories: payload.selectedAccessories == null ? item.selectedAccessories : payload.selectedAccessories };
    const validation = await validateRental(item.productId, next.quantity, next.startDate, next.endDate, next.selectedAccessories);
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: next.quantity, startDate: new Date(next.startDate), endDate: new Date(next.endDate), selectedAccessories: validation.accessories } });
    return getCart(userId);
}

async function removeItem(userId, itemId) {
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cart: { is: { userId } } } });
    if (!item) return false;
    await prisma.cartItem.delete({ where: { id: item.id } });
    return true;
}

module.exports = { rentalDays, validateRental, lineTotals, getCart, createItem, updateItem, removeItem };
