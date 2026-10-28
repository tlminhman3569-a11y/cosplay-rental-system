import { prisma } from '../config/prisma.js'

const WITH_IMAGES = { images: true }
const WITH_ALL = { images: true, accessories: true, category: true, brand: true, series: true }

export const ProductModel = {
  // Danh mục dùng chung cho form vendor; chỉ hiển thị mục đang hoạt động.
  formOptions: async () => {
    const options = { where: { status: 'ACTIVE' }, select: { id: true, name: true }, orderBy: { name: 'asc' } }
    const [categories, brands, series] = await Promise.all([
      prisma.category.findMany(options), prisma.brand.findMany(options), prisma.series.findMany(options),
    ])
    return { categories, brands, series }
  },
  list: (shopId, status) =>
    prisma.product.findMany({
      where: { shopId, ...(status ? { status } : {}) },
      include: WITH_IMAGES, orderBy: { createdAt: 'desc' },
    }),
  findOwned: (id, shopId, full = false) =>
    prisma.product.findFirst({ where: { id, shopId }, include: full ? WITH_ALL : WITH_IMAGES }),

  create: (data) => prisma.product.create({ data, include: WITH_IMAGES }),
  update: (id, data) => prisma.product.update({ where: { id }, data, include: WITH_IMAGES }),

  // Đổi trạng thái có điều kiện (compare-and-set), trả về true nếu đổi được
  setStatusIf: async (id, shopId, from, to) =>
    (await prisma.product.updateMany({ where: { id, shopId, status: from }, data: { status: to } })).count === 1,

  countOrderItems: (productId) => prisma.orderItem.count({ where: { productId } }),
  // Prisma + Mongo không tự xóa bản ghi con => xóa thủ công, cùng 1 transaction
  remove: (id) =>
    prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productAccessory.deleteMany({ where: { productId: id } }),
      prisma.productBlockedDate.deleteMany({ where: { productId: id } }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]),

  categoryExists: async (id) => !!(await prisma.category.findUnique({ where: { id }, select: { id: true } })),
  brandExists: async (id) => !!(await prisma.brand.findUnique({ where: { id }, select: { id: true } })),
  seriesExists: async (id) => !!(await prisma.series.findUnique({ where: { id }, select: { id: true } })),
}
