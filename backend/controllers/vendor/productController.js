import { ProductModel } from '../../models/Product.js'
import { httpError } from '../../middlewares/error.js'
import { assertObjectId, isObjectId } from '../../utils/objectId.js'
import { productRow, productDetail } from '../../utils/vendorMappers.js'
import { PRODUCT_STATUSES } from '../../utils/vendorConstants.js'

const MAX_IMAGES = 20
const MAX_ACCESSORIES = 20
const ENUMS = {
  productType: ['COSTUME', 'ACCESSORY'],
  gender: ['MALE', 'FEMALE', 'UNISEX'],
  difficulty: ['EASY', 'MEDIUM', 'HARD'],
}
const CONDITION_LEVELS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']
const ACCESSORY_TYPES = ['WIG', 'SHOES', 'PROPS', 'OTHER']
// Quy tắc cọc (khớp form O03): cọc tối thiểu 50% giá trị đồ; đồ từ 5.000.000đ phải cọc 100%
const MIN_DEPOSIT_RATE = 0.5
const FULL_DEPOSIT_FROM = 5_000_000
const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'

const bad = (msg) => httpError(400, 'validation', msg)
const blank = (v) => v === undefined || v === null || v === ''
const toNum = (v) => (typeof v === 'string' && v.trim() === '' ? NaN : Number(v))
const str = (v) => (blank(v) ? null : String(v).trim())

function intIn(v, label, { min, max, def }) {
  if (blank(v)) { if (def !== undefined) return def; throw bad(`${label} là bắt buộc`) }
  const n = toNum(v)
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${label} phải là số nguyên từ ${min} đến ${max}`)
  return n
}

// Chỉ nhận các trường được phép (KHÔNG spread req.body: client không được tự đặt shopId/status/rentalCount...)
async function parseInput(body = {}) {
  const name = str(body.name)
  if (!name || name.length < 3 || name.length > 150) throw bad('Tên sản phẩm phải từ 3 đến 150 ký tự')

  const price = toNum(body.pricePerDay)
  if (!(price > 0)) throw bad('Giá thuê / ngày phải lớn hơn 0')
  const deposit = toNum(body.depositAmount)
  if (!(deposit >= 0)) throw bad('Tiền cọc không hợp lệ')

  const minRentalDays = intIn(body.minRentalDays, 'Số ngày thuê tối thiểu', { min: 1, max: 30, def: 1 })
  const maxRentalDays = intIn(body.maxRentalDays, 'Số ngày thuê tối đa', { min: 1, max: 30, def: 30 })
  if (maxRentalDays < minRentalDays) throw bad('Số ngày thuê tối đa phải ≥ tối thiểu')

  const description = str(body.description)
  if (description && description.length > 5000) throw bad('Mô tả tối đa 5000 ký tự')
  const careGuide = str(body.careGuide)
  if (careGuide && careGuide.length > 2000) throw bad('Hướng dẫn giặt / bảo quản tối đa 2000 ký tự')

  // Giá trị đồ (tùy chọn). Nếu có thì tiền cọc phải đạt mức tối thiểu
  const itemValue = blank(body.itemValue) ? null : toNum(body.itemValue)
  if (itemValue !== null) {
    if (!(itemValue > 0)) throw bad('Giá trị đồ phải lớn hơn 0')
    const minDeposit = itemValue >= FULL_DEPOSIT_FROM ? itemValue : Math.round(itemValue * MIN_DEPOSIT_RATE)
    if (deposit < minDeposit) throw bad(`Tiền cọc tối thiểu ${money(minDeposit)} (${itemValue >= FULL_DEPOSIT_FROM ? '100' : '50'}% giá trị đồ)`)
  }
  if (!blank(body.conditionLevel) && !CONDITION_LEVELS.includes(body.conditionLevel)) throw bad(`Tình trạng không hợp lệ (${CONDITION_LEVELS.join(' / ')})`)

  const data = {
    name, description, careGuide, itemValue,
    conditionLevel: blank(body.conditionLevel) ? null : body.conditionLevel,   // PUT = ghi đè: bỏ trống thì xóa giá trị cũ

    characterName: str(body.characterName), size: str(body.size),
    pricePerDay: price, depositAmount: deposit,
    quantity: intIn(body.quantity, 'Số lượng', { min: 1, max: 999, def: 1 }),
    minRentalDays, maxRentalDays,
    cleaningDays: intIn(body.cleaningDays, 'Số ngày giặt/bảo trì', { min: 0, max: 14, def: 1 }),
  }
  for (const [key, allowed] of Object.entries(ENUMS)) {
    if (blank(body[key])) continue
    if (!allowed.includes(body[key])) throw bad(`${key} không hợp lệ (${allowed.join(' / ')})`)
    data[key] = body[key]
  }

  // Danh mục bắt buộc; thương hiệu / series tùy chọn nhưng nếu gửi lên thì phải tồn tại
  if (!isObjectId(body.categoryId) || !(await ProductModel.categoryExists(body.categoryId))) throw bad('Danh mục không tồn tại')
  data.categoryId = body.categoryId
  if (!blank(body.brandId)) {
    if (!isObjectId(body.brandId) || !(await ProductModel.brandExists(body.brandId))) throw bad('Thương hiệu không tồn tại')
    data.brandId = body.brandId
  }
  if (!blank(body.seriesId)) {
    if (!isObjectId(body.seriesId) || !(await ProductModel.seriesExists(body.seriesId))) throw bad('Series không tồn tại')
    data.seriesId = body.seriesId
  }

  const images = Array.isArray(body.images) ? body.images.filter((u) => typeof u === 'string' && u.trim()) : []
  if (!images.length) throw bad('Cần ít nhất 1 ảnh sản phẩm')
  if (images.length > MAX_IMAGES) throw bad(`Tối đa ${MAX_IMAGES} ảnh`)

  const accessories = (Array.isArray(body.accessories) ? body.accessories : []).filter((a) => a && str(a.name))
  if (accessories.length > MAX_ACCESSORIES) throw bad(`Tối đa ${MAX_ACCESSORIES} phụ kiện`)
  for (const a of accessories) if (!ACCESSORY_TYPES.includes(a.type)) throw bad(`Loại phụ kiện không hợp lệ (${ACCESSORY_TYPES.join(' / ')})`)

  return {
    data,
    images: images.map((url, i) => ({ url: url.trim(), isPrimary: i === 0 })),   // ảnh đầu tiên là ảnh bìa
    accessories: accessories.map((a) => ({ type: a.type, name: String(a.name).trim(), isRequired: a.isRequired === true })),
  }
}

async function loadOwned(req, full = false) {
  assertObjectId(req.params.id, 'Mã sản phẩm')
  const p = await ProductModel.findOwned(req.params.id, req.shop.id, full)
  if (!p) throw httpError(404, 'not_found', 'Không tìm thấy sản phẩm trong gian hàng của bạn')
  return p
}

export const ProductController = {
  // GET /products?status=ALL|PENDING|ACTIVE|REJECTED|HIDDEN
  getProducts: async (req, res) => {
    const status = req.query.status && req.query.status !== 'ALL' ? String(req.query.status) : null
    if (status && !PRODUCT_STATUSES.includes(status)) throw bad('Trạng thái lọc không hợp lệ')
    const products = await ProductModel.list(req.shop.id, status)
    res.json(products.map(productRow))
  },

  getProduct: async (req, res) => res.json(productDetail(await loadOwned(req, true))),

  // Sản phẩm mới luôn ở PENDING, chờ Staff duyệt
  createProduct: async (req, res) => {
    const { data, images, accessories } = await parseInput(req.body)
    const created = await ProductModel.create({
      ...data, shopId: req.shop.id, status: 'PENDING',
      images: { create: images }, accessories: { create: accessories },
    })
    res.status(201).json(productRow(created))
  },

  // Sửa sản phẩm: ghi đè toàn bộ ảnh + phụ kiện. ACTIVE/REJECTED sửa xong quay về PENDING để Staff duyệt lại.
  updateProduct: async (req, res) => {
    const current = await loadOwned(req)
    const { data, images, accessories } = await parseInput(req.body)
    const status = ['ACTIVE', 'REJECTED'].includes(current.status) ? 'PENDING' : current.status
    const updated = await ProductModel.update(current.id, {
      ...data, status, rejectReason: null,
      images: { deleteMany: {}, create: images },
      accessories: { deleteMany: {}, create: accessories },
    })
    res.json(productRow(updated))
  },

  hideProduct: async (req, res) => {
    const p = await loadOwned(req)
    if (!(await ProductModel.setStatusIf(p.id, req.shop.id, 'ACTIVE', 'HIDDEN'))) throw httpError(409, 'bad_state', 'Chỉ ẩn được sản phẩm đang hoạt động')
    res.json({ ok: true, id: p.id, status: 'HIDDEN' })
  },
  showProduct: async (req, res) => {
    const p = await loadOwned(req)
    if (!(await ProductModel.setStatusIf(p.id, req.shop.id, 'HIDDEN', 'ACTIVE'))) throw httpError(409, 'bad_state', 'Chỉ hiện lại được sản phẩm đang ẩn')
    res.json({ ok: true, id: p.id, status: 'ACTIVE' })
  },

  // Đã từng có đơn thuê thì KHÔNG xóa (mất lịch sử/doanh thu) => bắt dùng "Ẩn"
  deleteProduct: async (req, res) => {
    const p = await loadOwned(req)
    if ((await ProductModel.countOrderItems(p.id)) > 0) throw httpError(409, 'has_orders', 'Sản phẩm đã có đơn thuê nên không thể xóa, hãy dùng "Ẩn"')
    await ProductModel.remove(p.id)
    res.json({ ok: true })
  },
}
