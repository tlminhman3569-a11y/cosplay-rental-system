const { verifyResponse } = require('../../utils/vnpay');
const { confirmVnpay } = require('../../services/orderService');

async function handle(query) {
    if (!verifyResponse(query)) return { code: '97', message: 'Invalid signature' };
    return confirmVnpay(query);
}

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
        res.redirect(`${frontend}/customer/checkout/result?status=${result.successful ? 'success' : 'failed'}&code=${result.code}&amount=${amountVnd}&vnp_TxnRef=${encodeURIComponent(req.query.vnp_TxnRef || '')}`);
    } catch (error) { next(error); }
};
