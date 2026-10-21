import jwt from 'jsonwebtoken'
import { prisma } from '../config/db.js'
import { httpError } from './error.js'

export const authRequired = async (req, res, next) => {
    try {
        const header = req.headers.authorization
        if (!header || !header.startsWith('Bearer ')) {
            throw httpError(401, 'unauthorized', 'Vui lòng đăng nhập')
        }

        const token = header.split(' ')[1]
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret')

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { role: true }
        })

        if (!user || user.status === 'LOCKED') {
            throw httpError(401, 'unauthorized', 'Tài khoản không hợp lệ hoặc bị khóa')
        }

        req.user = user
        next()
    } catch (error) {
        if (error.status) return next(error)
        next(httpError(401, 'invalid_token', 'Token không hợp lệ hoặc hết hạn'))
    }
}

export const requireRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role.name)) {
        return next(httpError(403, 'forbidden', 'Bạn không có quyền truy cập'))
    }
    next()
}