import { ProductModel } from '../../models/Product.js'

// Lý do từ chối đơn hiển thị trong dropdown ở trang Yêu cầu thuê (O06)
export const REJECT_REASONS = [
  'Bộ đồ đang giặt / bảo trì',
  'Đã có người thuê trùng ngày',
  'Hết hàng hoặc đồ đang hư hỏng',
  'Không giao được tới khu vực của khách',
  'Lý do khác',
]

export const MetaController = {
  // GET /meta: dữ liệu cho dropdown ở form đăng/sửa sản phẩm (O03) và trang Yêu cầu thuê (O06)
  getMeta: async (req, res) => {
    const { categories, brands, series } = await ProductModel.formOptions()
    res.json({
      rejectReasons: REJECT_REASONS,
      productForm: {
        categories, brands, series,                       // [{ id, name }] lấy từ DB, chỉ mục ACTIVE
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        productTypes: [{ value: 'COSTUME', label: 'Trang phục' }, { value: 'ACCESSORY', label: 'Phụ kiện' }],
        genders: [{ value: 'FEMALE', label: 'Nữ' }, { value: 'MALE', label: 'Nam' }, { value: 'UNISEX', label: 'Unisex' }],
        difficulties: [{ value: 'EASY', label: 'Dễ' }, { value: 'MEDIUM', label: 'Vừa' }, { value: 'HARD', label: 'Khó' }],
        accessoryTypes: [{ value: 'WIG', label: 'Tóc và hóa trang' }, { value: 'SHOES', label: 'Giày dép và tất' }, { value: 'PROPS', label: 'Đạo cụ và vũ khí' }, { value: 'OTHER', label: 'Khác' }],
        conditions: [{ value: 'NEW', label: 'Mới 100%' }, { value: 'LIKE_NEW', label: 'Như mới' }, { value: 'GOOD', label: 'Tốt' }, { value: 'FAIR', label: 'Khá' }],
        deposit: { minRate: 0.5, fullDepositFrom: 5000000 },       // cho FE tính gợi ý cọc
      },
    })
  },

  // GET /shop: tên gian hàng để hiển thị "… của <shop>"
  getShop: async (req, res) => res.json({ id: req.shop.id, name: req.shop.name }),
}
