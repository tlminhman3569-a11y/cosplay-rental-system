const orderService = require('../../services/orderService');
const { success, fail, asyncHandler } = require('../../utils/api');

exports.checkout = asyncHandler(async (req, res) => {
    try { return success(res, await orderService.checkout(req.user.id, req.body, req.ip), 201); }
    catch (error) { return fail(res, 422, 'CHECKOUT_INVALID', error.message); }
});
exports.list = asyncHandler(async (req, res) => success(res, await orderService.listOrders(req.user.id, req.query)));
exports.detail = asyncHandler(async (req, res) => {
    const order = await orderService.getOrder(req.user.id, req.params.id);
    return order ? success(res, order) : fail(res, 404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn thuê.');
});
