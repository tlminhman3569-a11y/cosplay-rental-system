const prisma = require('../config/prisma');

async function requireAuthenticatedUser(req, res, next) {
    if (req.user?.id) return next();

    // Fallback cho môi trường test khi Thành viên 1 chưa xong module Auth
    try {
        const demoUser = await prisma.user.findFirst({
            where: { email: 'member2-demo@clarity.local' }
        });
        if (demoUser) {
            req.user = demoUser;
            return next();
        }
    } catch {
        // bỏ qua nếu lỗi DB
    }

    return res.status(401).json({
        error: {
            code: 'UNAUTHENTICATED',
            message: 'Bạn cần đăng nhập để thực hiện thao tác này.'
        }
    });
}

module.exports = requireAuthenticatedUser;

