import dotenv from 'dotenv'
import { prisma } from './config/db.js'
import app from './app.js'

dotenv.config()
const PORT = process.env.PORT || 3000

async function start() {
    try {
        await prisma.$connect()
        console.log('✅ Đã kết nối MongoDB qua Prisma')

        app.listen(PORT, () => {
            console.log(`🚀 Server chạy tại http://localhost:${PORT}/api`)
        })
    } catch (error) {
        console.error('❌ Lỗi khởi động:', error)
        process.exit(1)
    }
}

start()