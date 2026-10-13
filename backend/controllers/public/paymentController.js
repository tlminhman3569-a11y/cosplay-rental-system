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
        res.redirect(`${frontend}/checkout/result?status=${result.successful ? 'success' : 'failed'}&code=${result.code}`);
    } catch (error) { next(error); }
};
