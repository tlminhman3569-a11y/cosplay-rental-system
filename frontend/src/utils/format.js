export const vnd = (n) => (n == null ? '' : Number(n).toLocaleString('vi-VN') + 'đ')
const dateParts = d => {
  if (!d) return null
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return null
  const shifted = new Date(date.getTime() + 7 * 3600000)
  return [shifted.getUTCFullYear(), String(shifted.getUTCMonth() + 1).padStart(2, '0'), String(shifted.getUTCDate()).padStart(2, '0')]
}
export const dmy = d => { const p = dateParts(d); return p ? `${p[2]}/${p[1]}/${p[0]}` : '—' }
export const dm = d => { const p = dateParts(d); return p ? `${p[2]}/${p[1]}` : '—' }
export const iso = d => { const p = dateParts(d); return p ? p.join('-') : '' }
// Khớp backend: số ngày thuê tính cả ngày đầu và ngày cuối.
export const rentalDays = (start, end) => start && end ? Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1) : 0
export const PLATFORM_FEE_RATE = 0.07
export const calcOrder = ({ pricePerDay, days, deposit, shippingFee = 0 }) => {
  const rentalTotal = pricePerDay * days
  const platformFee = Math.round(rentalTotal * PLATFORM_FEE_RATE)
  return { rentalTotal, deposit, shippingFee, platformFee, totalAmount: rentalTotal + deposit + shippingFee, ownerPayout: rentalTotal - platformFee }
}
// Mốc "hôm nay" giả lập cho màn hình có SLA
export const MOCK_TODAY = '2026-10-25'
export const MOCK_NOW = '2026-10-25T15:00:00'
