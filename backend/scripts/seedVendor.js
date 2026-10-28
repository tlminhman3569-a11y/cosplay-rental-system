import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { prisma } from '../config/prisma.js'

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) })

// Dữ liệu demo riêng; chạy lại không xóa hoặc ghi đè dữ liệu hiện có.
const email = process.argv[2] || 'vendor.demo@example.com'
async function seed() {
  const role = await prisma.role.upsert({ where: { name: 'VENDOR' }, update: {}, create: { name: 'VENDOR' } })
  const owner = await prisma.user.upsert({ where: { email }, update: {}, create: { email, fullName: 'Chủ shop cosplay demo', roleId: role.id } })
  const ownerRole = await prisma.role.findUnique({ where: { id: owner.roleId } })
  if (!['VENDOR', 'OWNER'].includes(ownerRole?.name)) throw new Error('Email đã thuộc vai trò khác; hãy dùng email demo riêng.')
  let shop = await prisma.shop.findFirst({ where: { ownerId: owner.id } })
  if (!shop) shop = await prisma.shop.create({ data: { ownerId: owner.id, name: 'Cosplay Demo Shop', region: 'TP. Hồ Chí Minh' } })
  const category = await prisma.category.upsert({ where: { name: 'Demo Vendor - Trang phục' }, update: {}, create: { name: 'Demo Vendor - Trang phục', status: 'ACTIVE' } })
  const brand = await prisma.brand.upsert({ where: { name: 'Demo Vendor - HoYoverse' }, update: {}, create: { name: 'Demo Vendor - HoYoverse', status: 'ACTIVE' } })
  const series = await prisma.series.upsert({ where: { name: 'Demo Vendor - Genshin Impact' }, update: {}, create: { name: 'Demo Vendor - Genshin Impact', status: 'ACTIVE' } })
  const products = []
  for (const [i, status] of ['ACTIVE', 'PENDING', 'REJECTED', 'HIDDEN'].entries()) {
    const name = `Demo Vendor - ${['Raiden Shogun', 'Furina', 'Nahida', 'Venti'][i]}`
    let product = await prisma.product.findFirst({ where: { shopId: shop.id, name } })
    if (!product) product = await prisma.product.create({ data: {
      shopId: shop.id, categoryId: category.id, brandId: brand.id, seriesId: series.id,
      name, characterName: name.replace('Demo Vendor - ', ''), status, size: 'M', gender: 'UNISEX',
      conditionLevel: 'LIKE_NEW', description: 'Trang phục mẫu phục vụ kiểm tra phần vendor.',
      pricePerDay: 150000, depositAmount: 400000, itemValue: 800000, quantity: 3,
      minRentalDays: 1, maxRentalDays: 7, cleaningDays: 1,
      rejectReason: status === 'REJECTED' ? 'Vui lòng bổ sung ảnh chi tiết.' : null,
      accessories: { create: [{ type: 'WIG', name: 'Tóc nhân vật', isRequired: false }] },
    } })
    products.push(product)
  }
  // Dùng tài khoản demo làm người thuê mẫu, không sửa tài khoản khách của nhóm.
  const now = new Date()
  const statuses = ['PENDING', 'PENDING', 'CONFIRMED', 'READY', 'SHIPPING', 'RENTING', 'RETURNED', 'CANCELLED', ...Array(6).fill('COMPLETED')]
  for (const [i, status] of statuses.entries()) {
    const note = `Demo Vendor seed #${i + 1}`
    if (await prisma.order.findFirst({ where: { shopId: shop.id, note } })) continue
    // Mốc tháng theo giờ Việt Nam; giờ 09:00 VN tương ứng 02:00 UTC.
    const vn = new Date(now.getTime() + 7 * 3600000)
    const createdAt = status === 'COMPLETED'
      ? new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth() - (i - 8), 5, 2))
      : new Date(now.getTime() - i * 600000)
    const startDate = new Date(createdAt.getTime() + 86400000)
    const endDate = new Date(startDate.getTime() + 2 * 86400000)
    await prisma.order.create({ data: {
      shopId: shop.id, renterId: owner.id, status, note, createdAt,
      receiverName: 'Khách demo', receiverPhone: '0900000000', shippingMethod: 'PICKUP',
      rentalTotal: 450000, platformFee: 45000, depositTotal: 400000, totalAmount: 850000,
      cancelReason: status === 'CANCELLED' ? 'Khách demo thay đổi lịch thuê.' : null,
      orderItems: { create: [{ productId: products[0].id, productName: products[0].name, unitPrice: 150000, deposit: 400000, quantity: 1, startDate, endDate }] },
      payments: { create: [{ type: 'PAY', method: 'BANK', amount: 850000, status: 'SUCCESS', paidAt: createdAt }] },
      statusHistory: { create: [{ toStatus: status, changedBy: owner.id, changedAt: createdAt }] },
    } })
  }
  console.log(JSON.stringify({ email, shop: shop.name, products: await prisma.product.count({ where: { shopId: shop.id } }), orders: await prisma.order.count({ where: { shopId: shop.id } }) }, null, 2))
}
try { await seed() } catch (error) { console.error('Không tạo được dữ liệu demo:', error.message); process.exitCode = 1 } finally { await prisma.$disconnect() }
