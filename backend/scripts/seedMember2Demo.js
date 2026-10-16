require('dotenv').config();

const prisma = require('../config/prisma');

const demoProducts = [
    {
        name: 'Trang phục Nezuko Kamado', characterName: 'Nezuko Kamado', gender: 'FEMALE', size: 'M', seriesName: 'Kimetsu no Yaiba',
        description: 'Bộ kimono Nezuko đầy đủ, phù hợp chụp ảnh, lễ hội và các buổi gặp gỡ anime.',
        pricePerDay: 120000, depositAmount: 500000, quantity: 2, rentalCount: 38,
        accessories: [{ type: 'WIG', name: 'Tóc giả Nezuko', rentalPricePerDay: 30000, depositAmount: 100000 }]
    },
    {
        name: 'Trang phục Mitsuri Kanroji', characterName: 'Mitsuri Kanroji', gender: 'FEMALE', size: 'M', seriesName: 'Kimetsu no Yaiba',
        description: 'Đồng phục Thợ săn quỷ kèm áo khoác trắng và thắt lưng.',
        pricePerDay: 140000, depositAmount: 600000, quantity: 1, rentalCount: 31
    },
    {
        name: 'Trang phục Gojo Satoru', characterName: 'Gojo Satoru', gender: 'MALE', size: 'L', seriesName: 'Jujutsu Kaisen',
        description: 'Bộ đồng phục chú thuật sư với bịt mắt và áo cổ cao.',
        pricePerDay: 150000, depositAmount: 700000, quantity: 2, rentalCount: 46
    },
    {
        name: 'Trang phục Anya Forger', characterName: 'Anya Forger', gender: 'FEMALE', size: 'S', seriesName: 'Spy x Family',
        description: 'Váy Eden Academy tông đen vàng, phù hợp chụp ảnh theo nhóm.',
        pricePerDay: 100000, depositAmount: 400000, quantity: 3, rentalCount: 22
    }
];

async function findOrCreate(model, where, data) {
    const existing = await model.findFirst({ where });
    return existing || model.create({ data });
}

async function main() {
    const role = await findOrCreate(prisma.role, { name: 'DEMO_VENDOR' }, {
        name: 'DEMO_VENDOR', description: 'Tài khoản chủ shop dữ liệu mẫu của Thành viên 2.'
    });
    const owner = await findOrCreate(prisma.user, { email: 'member2-demo@clarity.local' }, {
        roleId: role.id, email: 'member2-demo@clarity.local', fullName: 'Clarity Demo Owner', emailVerified: true
    });
    const shop = await findOrCreate(prisma.shop, { name: 'Mochi Cosplay Demo' }, {
        ownerId: owner.id, name: 'Mochi Cosplay Demo', region: 'TP. Hồ Chí Minh',
        description: 'Gian hàng mẫu để kiểm tra luồng xem và thuê đồ.'
    });
    const category = await findOrCreate(prisma.category, { name: 'Anime' }, { name: 'Anime' });

    let created = 0;
    for (const product of demoProducts) {
        let seriesId = null;
        if (product.seriesName) {
            const series = await findOrCreate(prisma.series, { name: product.seriesName }, { name: product.seriesName });
            seriesId = series.id;
        }

        const existing = await prisma.product.findFirst({ where: { shopId: shop.id, name: product.name } });
        if (existing) {
            if (!existing.seriesId && seriesId) {
                await prisma.product.update({ where: { id: existing.id }, data: { seriesId } });
            }
            continue;
        }
        await prisma.product.create({
            data: {
                shopId: shop.id, categoryId: category.id, seriesId,
                name: product.name, characterName: product.characterName, gender: product.gender, size: product.size,
                description: product.description, pricePerDay: product.pricePerDay, depositAmount: product.depositAmount,
                quantity: product.quantity, rentalCount: product.rentalCount,
                accessories: product.accessories ? { create: product.accessories } : undefined
            }
        });
        created += 1;
    }

    console.log(`Đã tạo ${created} sản phẩm mẫu Member 2. Shop: ${shop.name}`);
}

main()
    .catch((error) => {
        console.error('Không thể seed dữ liệu mẫu Member 2:', error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
