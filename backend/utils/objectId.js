import { httpError } from '../middlewares/error.js'

const RE = /^[0-9a-fA-F]{24}$/
export const isObjectId = (v) => typeof v === 'string' && RE.test(v)

// Prisma + MongoDB ném lỗi 500 nếu id sai định dạng => chặn sớm bằng 400
export function assertObjectId(v, label = 'id') {
  if (!isObjectId(v)) throw httpError(400, 'invalid_id', `${label} không hợp lệ`)
  return v
}
