import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { prisma } from './config/prisma.js'
import app from './app.js'

// Luôn đọc cấu hình của backend, kể cả khi chạy từ thư mục gốc repo.
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) })
const PORT = process.env.PORT || 3000

async function start() {
    try {
        console.log('Đang kết nối MongoDB trước khi mở cổng HTTP...')
        await prisma.$connect()
        console.log('✅ Đã kết nối MongoDB qua Prisma')

        const server = app.listen(PORT, () => {
            console.log(`🚀 Server chạy tại http://localhost:${PORT}/api`)
        })
        server.on('error', async (error) => {
            console.error(error.code === 'EADDRINUSE'
                ? `Cổng ${PORT} đang được tiến trình khác sử dụng.`
                : 'Không mở được cổng HTTP:', error.message)
            await prisma.$disconnect()
            process.exitCode = 1
        })
    } catch (error) {
        console.error('❌ Lỗi khởi động:', error)
        process.exit(1)
    }
}

start()
