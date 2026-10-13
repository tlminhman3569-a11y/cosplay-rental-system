const prisma = require('../config/prisma');

const productInclude = {
    shop: { select: { id: true, name: true, logoUrl: true, region: true } },
    category: { select: { id: true, name: true } },
    brand: { select: { id: true, name: true } },
    series: { select: { id: true, name: true } },
    images: true,
    accessories: true
};

function positiveInt(value, fallback, maximum = 100) {
    const number = Number.parseInt(value, 10);
    return Number.isInteger(number) && number > 0 ? Math.min(number, maximum) : fallback;
}

function buildWhere(query = {}, lockedShopId) {
    const where = { status: 'ACTIVE' };
    const equals = ['categoryId', 'brandId', 'seriesId', 'gender', 'size'];
    for (const field of equals) {
        if (query[field]) where[field] = query[field];
    }
    if (lockedShopId || query.shopId) where.shopId = lockedShopId || query.shopId;
    if (query.q?.trim()) {
        const text = query.q.trim();
        where.OR = [
            { name: { contains: text, mode: 'insensitive' } },
            { characterName: { contains: text, mode: 'insensitive' } }
        ];
    }
    const minPrice = Number(query.minPrice);
    const maxPrice = Number(query.maxPrice);
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
        where.pricePerDay = {};
        if (Number.isFinite(minPrice)) where.pricePerDay.gte = minPrice;
        if (Number.isFinite(maxPrice)) where.pricePerDay.lte = maxPrice;
    }
    return where;
}

function buildOrderBy(sort) {
    const map = {
        price_asc: { pricePerDay: 'asc' },
        price_desc: { pricePerDay: 'desc' },
        rental_count: { rentalCount: 'desc' },
        newest: { createdAt: 'desc' }
    };
    return [map[sort] || { createdAt: 'desc' }, { id: 'desc' }];
}

async function listProducts(query, lockedShopId) {
    const page = positiveInt(query.page, 1);
    const limit = positiveInt(query.limit, 12, 48);
    const where = buildWhere(query, lockedShopId);
    const [items, total] = await Promise.all([
        prisma.product.findMany({ where, include: productInclude, orderBy: buildOrderBy(query.sort), skip: (page - 1) * limit, take: limit }),
        prisma.product.count({ where })
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

function uniqueOptions(values) {
    const options = new Map();
    for (const value of values) {
        if (value?.id && value?.name) options.set(value.id, { id: value.id, name: value.name });
    }
    return [...options.values()].sort((left, right) => left.name.localeCompare(right.name, 'vi'));
}

async function getFilterOptions() {
    const where = { status: 'ACTIVE' };
    const [products, price] = await Promise.all([
        prisma.product.findMany({
            where,
            select: {
                category: { select: { id: true, name: true } },
                brand: { select: { id: true, name: true } },
                series: { select: { id: true, name: true } },
                gender: true,
                size: true
            }
        }),
        prisma.product.aggregate({ where, _min: { pricePerDay: true }, _max: { pricePerDay: true } })
    ]);
    return {
        categories: uniqueOptions(products.map((product) => product.category)),
        brands: uniqueOptions(products.map((product) => product.brand)),
        series: uniqueOptions(products.map((product) => product.series)),
        genders: [...new Set(products.map((product) => product.gender).filter(Boolean))].sort(),
        sizes: [...new Set(products.map((product) => product.size).filter(Boolean))].sort((left, right) => left.localeCompare(right, 'vi')),
        priceRange: { min: price._min.pricePerDay, max: price._max.pricePerDay }
    };
}

async function getProduct(id) {
    const product = await prisma.product.findFirst({
        where: { id, status: 'ACTIVE' },
        include: { ...productInclude, blockedDates: true }
    });
    if (!product) return null;

    const similarWhere = {
        id: { not: product.id },
        status: 'ACTIVE',
        OR: [
            ...(product.seriesId ? [{ seriesId: product.seriesId }] : []),
            { categoryId: product.categoryId }
        ]
    };
    const similarProducts = await prisma.product.findMany({
        where: similarWhere,
        include: productInclude,
        orderBy: [{ rentalCount: 'desc' }, { createdAt: 'desc' }],
        take: 8
    });
    return { ...product, similarProducts };
}

async function listSection(section, query) {
    const limit = positiveInt(query.limit, 8, 24);
    if (section === 'recommended' && query.productId) {
        const product = await prisma.product.findFirst({ where: { id: query.productId, status: 'ACTIVE' } });
        if (product) {
            const items = await prisma.product.findMany({
                where: {
                    id: { not: product.id }, status: 'ACTIVE',
                    OR: [...(product.seriesId ? [{ seriesId: product.seriesId }] : []), { categoryId: product.categoryId }]
                },
                include: productInclude,
                orderBy: [{ rentalCount: 'desc' }, { createdAt: 'desc' }], take: limit
            });
            return { items };
        }
    }
    const orderBy = section === 'bestsellers' ? [{ rentalCount: 'desc' }, { createdAt: 'desc' }] : [{ createdAt: 'desc' }];
    return { items: await prisma.product.findMany({ where: { status: 'ACTIVE' }, include: productInclude, orderBy, take: limit }) };
}

module.exports = { listProducts, getFilterOptions, getProduct, listSection, productInclude };
