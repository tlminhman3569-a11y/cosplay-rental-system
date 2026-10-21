// Mọi mốc "ngày/tháng" tính theo giờ Việt Nam (UTC+7), không phụ thuộc múi giờ máy chủ.
export const DAY_MS = 86400000
const VN_MS = 7 * 3600 * 1000
const pad = (n) => String(n).padStart(2, '0')

// Date đã dịch +7h: đọc năm/tháng/ngày bằng getUTC*() sẽ ra giờ VN
const shift = (d) => new Date(new Date(d).getTime() + VN_MS)

export const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY_MS)

export function vnStartOfDay(d) {
  const s = shift(d)
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()) - VN_MS)
}
export function vnStartOfMonth(d, addMonths = 0) {
  const s = shift(d)
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + addMonths, 1) - VN_MS)
}
export function vnStartOfQuarter(d) {
  const s = shift(d)
  return new Date(Date.UTC(s.getUTCFullYear(), Math.floor(s.getUTCMonth() / 3) * 3, 1) - VN_MS)
}
export const vnMonth = (d) => shift(d).getUTCMonth() + 1

// 'YYYY-MM-DD' -> 00:00 giờ VN của ngày đó; sai định dạng / ngày không tồn tại (31/02) -> null
export function parseVnDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ''))
  if (!m) return null
  const y = +m[1], mo = +m[2] - 1, da = +m[3]
  const d = new Date(Date.UTC(y, mo, da) - VN_MS)
  const s = shift(d)
  return s.getUTCFullYear() === y && s.getUTCMonth() === mo && s.getUTCDate() === da ? d : null
}

export const fmtDMY = (d) => { const s = shift(d); return `${pad(s.getUTCDate())}/${pad(s.getUTCMonth() + 1)}/${s.getUTCFullYear()}` }
export const fmtDM = (d) => { const s = shift(d); return `${pad(s.getUTCDate())}/${pad(s.getUTCMonth() + 1)}` }
export const fmtISO = (d) => { const s = shift(d); return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}` }
export const weekdayVN = (d) => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][shift(d).getUTCDay()]

// Số ngày thuê (tính cả ngày đầu và ngày cuối). Nếu cart/checkout của Huy tính khác thì sửa DUY NHẤT ở đây.
export const rentalDays = (start, end) => Math.max(1, Math.round((new Date(end) - new Date(start)) / DAY_MS) + 1)
