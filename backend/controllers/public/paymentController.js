const crypto = require('crypto');
const { createPaymentUrl, verifyResponse } = require('../../utils/vnpay');
const { confirmVnpay } = require('../../services/orderService');

async function handle(query) {
    if (!verifyResponse(query)) return { code: '97', message: 'Invalid signature' };
    return confirmVnpay(query);
}

exports.createUrl = async (req, res, next) => {
    try {
        const amount = Number(req.body.amount) || 100000;
        const checkoutRef = req.body.checkoutRef || `CHK-DEMO-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
        const orderInfo = req.body.orderInfo || `Thanh toan don thue ${checkoutRef}`;
        const paymentUrl = createPaymentUrl({
            checkoutRef,
            amount,
            orderInfo,
            ipAddress: req.ip || '127.0.0.1'
        });
        res.json({ paymentUrl, checkoutRef });
    } catch (error) {
        next(error);
    }
};

exports.ipn = async (req, res, next) => {
    try { const result = await handle(req.query); res.json({ RspCode: result.code, Message: result.message }); }
    catch (error) { next(error); }
};
exports.returnUrl = async (req, res, next) => {
    try {
        const result = await handle(req.query);
        const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
        const amount = Number(req.query.vnp_Amount);
        const amountVnd = Number.isFinite(amount) ? amount / 100 : 0;
        const isDemo = req.query.vnp_TxnRef?.startsWith('CHK-DEMO-') ? '&demo=1' : '';
        res.redirect(`${frontend}/customer/checkout/result?status=${result.successful ? 'success' : 'failed'}&code=${result.code}&amount=${amountVnd}&vnp_TxnRef=${encodeURIComponent(req.query.vnp_TxnRef || '')}${isDemo}`);
    } catch (error) { next(error); }
};

