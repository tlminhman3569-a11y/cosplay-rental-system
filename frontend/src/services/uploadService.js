import { http, unwrap } from './http'

// Giới hạn khớp backend (routes/uploads.js)
export const UPLOAD_MAX_MB = 5
export const UPLOAD_MAX_FILES = 8
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
export const EVIDENCE_ACCEPT = IMAGE_ACCEPT + ',application/pdf'
const OK_EXT = /\.(jpe?g|png|webp|gif)$/i

export const isImageUrl = (u) => /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(String(u || ''))

// Kiểm tra phía trình duyệt trước khi gửi; trả chuỗi lỗi hoặc ''
export function checkFile(f, { pdf = false } = {}) {
  const isPdf = /\.pdf$/i.test(f.name)
  if (!(OK_EXT.test(f.name) || (pdf && isPdf))) return `"${f.name}": chỉ nhận ảnh JPG, PNG, WEBP, GIF${pdf ? ' hoặc PDF' : ''}`
  if (f.size > UPLOAD_MAX_MB * 1024 * 1024) return `"${f.name}": vượt quá ${UPLOAD_MAX_MB}MB`
  return ''
}

// Mở hộp chọn tệp của trình duyệt (gọi trực tiếp trong handler click). Trả mảng File (rỗng nếu hủy).
export function pickFiles({ accept = IMAGE_ACCEPT, multiple = false } = {}) {
  return new Promise((resolve) => {
    const el = document.createElement('input')
    el.type = 'file'; el.accept = accept; el.multiple = multiple
    el.style.display = 'none'
    el.addEventListener('change', () => { resolve(Array.from(el.files || [])); el.remove() })
    el.addEventListener('cancel', () => { resolve([]); el.remove() })
    document.body.appendChild(el)
    el.click()
  })
}

export const uploadService = {
  // files: File | File[]. opts: { private, evidence, onProgress(percent 0-100) } -> mảng { url, name, size, mime }
  async upload(files, opts = {}) {
    const list = Array.isArray(files) ? files : Array.from(files?.length != null ? files : [files])
    const fd = new FormData()
    for (const f of list) fd.append('files', f)
    const params = {}
    if (opts.private) params.private = 'true'
    if (opts.evidence) params.kind = 'evidence'
    const r = await unwrap(http.post('/uploads', fd, {
      params,
      timeout: 120000,
      onUploadProgress: (e) => { if (opts.onProgress && e.total) opts.onProgress(Math.round((e.loaded / e.total) * 100)) },
    }))
    return r.files || []
  },
  // Chọn 1 ảnh, kiểm tra, tải lên; trả URL hoặc '' nếu hủy. Ném Error(message) khi sai định dạng/dung lượng.
  async pickAndUpload(opts = {}) {
    const [f] = await pickFiles({ accept: opts.accept || IMAGE_ACCEPT })
    if (!f) return ''
    const msg = checkFile(f, { pdf: !!opts.pdf })
    if (msg) throw new Error(msg)
    const r = await this.upload([f], opts)
    return r[0] ? r[0].url : ''
  },
  // Ảnh riêng tư (CCCD/selfie): tải qua axios kèm token, trả về blob: URL để gán vào <img>. Gọi URL.revokeObjectURL khi bỏ.
  async privateBlobUrl(url) {
    const path = String(url || '').replace(/^\/api/, '')
    const res = await http.get(path, { responseType: 'blob' })
    // HTTP client của nhóm đã trả trực tiếp Blob.
    return URL.createObjectURL(res)
  },
}
