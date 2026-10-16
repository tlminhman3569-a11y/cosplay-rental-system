const crypto = require('crypto');

function sortParams(params) {
    return Object.keys(params).sort().reduce((result, key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') result[key] = params[key];
        return result;
    }, {});
}

function sign(params) {
    const secret = process.env.VNP_HASH_SECRET;
    if (!secret) throw new Error('Chưa cấu hình VNP_HASH_SECRET.');
    const payload = new URLSearchParams(sortParams(params)).toString();
    return crypto.createHmac('sha512', secret).update(payload, 'utf8').digest('hex');
}

function createPaymentUrl({ checkoutRef, amount, orderInfo, ipAddress }) {
    const baseUrl = process.env.VNP_URL;
    const tmnCode = process.env.VNP_TMN_CODE;
    const returnUrl = process.env.VNP_RETURN_URL;
    if (!baseUrl || !tmnCode || !returnUrl) throw new Error('Chưa cấu hình đầy đủ VNPay sandbox.');
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const params = {
        vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: tmnCode,
        vnp_Amount: Math.round(amount * 100), vnp_CurrCode: 'VND',
        vnp_TxnRef: checkoutRef, vnp_OrderInfo: orderInfo, vnp_OrderType: 'other',
        vnp_Locale: 'vn', vnp_ReturnUrl: returnUrl, vnp_IpAddr: ipAddress || '127.0.0.1',
        vnp_CreateDate: stamp
    };
    return `${baseUrl}?${new URLSearchParams({ ...sortParams(params), vnp_SecureHash: sign(params) }).toString()}`;
}

function verifyResponse(query) {
    const { vnp_SecureHash: signature, vnp_SecureHashType, ...params } = query;
    const expected = sign(params);
    if (!signature || signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

module.exports = { createPaymentUrl, verifyResponse };
