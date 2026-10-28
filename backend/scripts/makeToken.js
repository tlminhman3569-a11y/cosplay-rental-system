import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma.js'

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) })
const email = process.argv[2]?.trim()
if (!email) {
    console.error('Cách chạy: node scripts/makeToken.js <email vendor>')
    process.exit(1)
}
const user = await prisma.user.findFirst({ where: { email }, include: { role: true } })
if (!user) { console.log('Không tìm thấy user có email này'); process.exit(1) }

const shop = await prisma.shop.findFirst({ where: { ownerId: user.id } })
console.log('Role:', user.role?.name)
console.log(shop ? 'Có gian hàng: ' + shop.name : 'CHƯA CÓ gian hàng')

console.log('\nTOKEN:\n' + jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' }))
await prisma.$disconnect()
