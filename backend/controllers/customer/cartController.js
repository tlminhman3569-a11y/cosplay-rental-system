const cartService = require('../../services/cartService');
const { success, fail, asyncHandler } = require('../../utils/api');

exports.get = asyncHandler(async (req, res) => success(res, await cartService.getCart(req.user.id)));
exports.create = asyncHandler(async (req, res) => {
    try { return success(res, await cartService.createItem(req.user.id, req.body), 201); }
    catch (error) { return fail(res, 422, 'CART_ITEM_INVALID', error.message); }
});
exports.update = asyncHandler(async (req, res) => {
    try {
        const cart = await cartService.updateItem(req.user.id, req.params.itemId, req.body);
        return cart ? success(res, cart) : fail(res, 404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy sản phẩm trong giỏ.');
    } catch (error) { return fail(res, 422, 'CART_ITEM_INVALID', error.message); }
});
exports.remove = asyncHandler(async (req, res) => (await cartService.removeItem(req.user.id, req.params.itemId)) ? res.status(204).send() : fail(res, 404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy sản phẩm trong giỏ.'));
