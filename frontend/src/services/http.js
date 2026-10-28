// Dùng HTTP client của nhóm; client này đã trả response.data.
export { default as http } from './axious'
export const unwrap = promise => promise
export const errCode = e => e?.response?.data?.error || ''
export const errMsg = (e, fallback = 'Có lỗi xảy ra, vui lòng thử lại') => {
  if (e?.response?.data?.message) return e.response.data.message
  if (['ERR_NETWORK', 'ECONNABORTED'].includes(e?.code)) return 'Không kết nối được máy chủ, vui lòng thử lại'
  return fallback
}
