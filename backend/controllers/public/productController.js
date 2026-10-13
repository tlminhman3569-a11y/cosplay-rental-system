const { success, fail, asyncHandler } = require('../../utils/api');
const productService = require('../../services/productService');

exports.list = asyncHandler(async (req, res) => success(res, await productService.listProducts(req.query)));
exports.listByShop = asyncHandler(async (req, res) => success(res, await productService.listProducts(req.query, req.params.shopId)));
exports.detail = asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.id);
    return product ? success(res, product) : fail(res, 404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
});
exports.section = asyncHandler(async (req, res) => {
    const valid = ['bestsellers', 'newest', 'recommended'];
    if (!valid.includes(req.params.section)) return fail(res, 404, 'SECTION_NOT_FOUND', 'Nhóm sản phẩm không hợp lệ.');
    return success(res, await productService.listSection(req.params.section, req.query));
});
