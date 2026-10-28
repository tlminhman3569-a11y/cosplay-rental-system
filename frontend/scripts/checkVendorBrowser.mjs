import { spawn, execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Kiểm tra trình duyệt thật qua Chrome DevTools, không cần thêm dependency.
const root = resolve(import.meta.dirname, '../..')
const out = resolve(root, '.tmp/vendor-browser')
await mkdir(out, { recursive: true })
const tokenOutput = execFileSync(process.execPath, ['scripts/makeToken.js', 'vendor.demo@example.com'], { cwd: resolve(root, 'backend'), encoding: 'utf8' })
const token = tokenOutput.split('TOKEN:')[1]?.trim()
if (!token) throw new Error('Không lấy được token demo')
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9223',
  '--remote-debugging-address=127.0.0.1', '--user-data-dir=' + resolve(out, 'profile'), 'about:blank',
], { windowsHide: true, stdio: 'ignore' })
const pause = ms => new Promise(r => setTimeout(r, ms))
let socket
try {
  let targets
  for (let i = 0; i < 60; i++) {
    try { targets = await (await fetch('http://127.0.0.1:9223/json')).json(); break } catch { await pause(250) }
  }
  if (!targets) throw new Error('Không mở được Chrome headless')
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((ok, fail) => { socket.onopen = ok; socket.onerror = fail })
  let id = 0, active = null
  const pending = new Map(), results = [], errors = [], requests = [], actions = []
  socket.onmessage = e => {
    const message = JSON.parse(e.data)
    if (message.id) { const p = pending.get(message.id); if (p) { pending.delete(message.id); message.error ? p.reject(new Error(message.error.message)) : p.resolve(message.result) } }
    if (message.method === 'Runtime.exceptionThrown') errors.push({ page: active, message: message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text })
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) errors.push({ page: active, message: message.params.args.map(x => x.value || x.description).join(' ') })
    if (message.method === 'Network.responseReceived' && message.params.response.url.includes('/api/')) requests.push({ page: active, status: message.params.response.status, url: message.params.response.url })
  }
  const call = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); socket.send(JSON.stringify({ id: n, method, params })) })
  const evaluate = async expression => {
    const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
    return r.result.value
  }
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable')
  await call('Network.setCacheDisabled', { cacheDisabled: true })
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `if (location.origin === 'http://127.0.0.1:5173') localStorage.setItem('accessToken', ${JSON.stringify(token)})` })
  const paths = ['yeu-cau-thue', 'tong-quan', 'san-pham', 'don-thue', 'thong-ke', 'don-thue/chi-tiet', 'san-pham/dang', 'kho-hang', 'lich-thue', 'tra-do', 'rut-tien', 'tin-nhan', 'tranh-chap', 'danh-gia', 'ho-so', 'dang-ky']
  for (const path of paths) {
    active = path
    await call('Page.navigate', { url: 'http://127.0.0.1:5173/vendor/' + path })
    let body
    for (let i = 0; i < 100; i++) {
      await pause(200)
      body = await evaluate(`({path:location.pathname, text:document.body.innerText, title:document.querySelector('h1')?.textContent})`)
      if (body.path === '/vendor/' + path && body.title && !/Đang tải|Đang kết nối/.test(body.text)) break
    }
    await pause(250)
    body = await evaluate(`({path:location.pathname, text:document.body.innerText, title:document.querySelector('h1')?.textContent})`)
    const ok = body.path === '/vendor/' + path && !!body.title && !errors.some(e => e.page === path) && !requests.some(r => r.page === path && r.status >= 400)
    results.push({ page: path, ok, title: body.title, text: body.text.slice(-1200) })
    console.log(`${ok ? 'PASS' : 'FAIL'} ${path}`)
    const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    await writeFile(resolve(out, path.replaceAll('/', '-') + '.png'), Buffer.from(screenshot.data, 'base64'))
  }
  const waitFor = async expression => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await pause(200) }
    throw new Error('Hết thời gian chờ: ' + expression.slice(0, 100))
  }
  const navigate = async path => {
    await call('Page.navigate', { url: 'http://127.0.0.1:5173' + path })
    await waitFor(`location.pathname === ${JSON.stringify(path.split('?')[0])} && !!document.querySelector('h1') && !document.body.innerText.includes('Đang tải')`)
  }
  const api = async (path, method = 'GET', body) => {
    const r = await fetch('http://localhost:3000/api/vendor' + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    const data = await r.json()
    if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${data.message}`)
    return data
  }
  const input = async (label, value) => evaluate(`(() => {const field = [...document.querySelectorAll('.field')].find(f => f.querySelector('label')?.textContent === ${JSON.stringify(label)}); const el = field?.querySelector('input,textarea,select'); if (!el) throw Error('Không có trường '+${JSON.stringify(label)}); el.value = ${JSON.stringify(String(value))}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true})()`)
  const click = text => evaluate(`(() => {const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if(!button || button.disabled) throw Error('Nút không sẵn sàng: '+${JSON.stringify(text)}); button.click(); return true})()`)
  active = 'product-crud'
  let qaProductId
  try {
    const name = 'QA Vendor FE ' + Date.now()
    await navigate('/vendor/san-pham/dang')
    await waitFor(`!!document.querySelector('textarea')`)
    await input('Tên sản phẩm', name)
    await input('Đường dẫn ảnh (mỗi dòng một ảnh, dòng đầu là ảnh bìa)', '/favicon.svg')
    await input('Giá thuê / ngày', 150000)
    await input('Giá trị đồ', 800000)
    await input('Tiền cọc', 400000)
    await click('Gửi kiểm duyệt')
    await waitFor(`location.pathname === '/vendor/san-pham' && document.body.innerText.includes(${JSON.stringify(name)})`)
    qaProductId = (await api('/products')).find(p => p.name === name)?.id
    if (!qaProductId) throw new Error('Không tìm thấy sản phẩm vừa tạo')
    await navigate('/vendor/san-pham/dang?id=' + qaProductId)
    await waitFor(`document.querySelector('input')?.value === ${JSON.stringify(name)}`)
    await input('Tên sản phẩm', name + ' edited')
    await click('Gửi kiểm duyệt')
    await waitFor(`location.pathname === '/vendor/san-pham' && document.body.innerText.includes(${JSON.stringify(name + ' edited')})`)
    if ((await api('/products/' + qaProductId)).name !== name + ' edited') throw new Error('Tên mới chưa lưu vào DB')
    await evaluate(`window.confirm = () => true; [...document.querySelectorAll('tbody tr')].find(r => r.innerText.includes(${JSON.stringify(name)})).querySelector('button.ro').click()`)
    await waitFor(`!document.querySelector('tbody')?.innerText.includes(${JSON.stringify(name)})`)
    if ((await api('/products')).some(p => p.id === qaProductId)) throw new Error('Sản phẩm vẫn tồn tại sau khi xóa')
    actions.push({ name: 'Thêm/sửa/xóa sản phẩm qua UI và đọc lại DB qua API', ok: true })
    console.log('PASS product CRUD via browser')
    qaProductId = null
  } catch (error) { actions.push({ name: 'Product CRUD', ok: false, error: error.message }); console.log('FAIL product CRUD: ' + error.message) }
  finally { if (qaProductId) await api('/products/' + qaProductId, 'DELETE').catch(() => {}) }

  // Tạo hai đơn QA riêng trong shop demo, thử nút O06 rồi xóa đúng các ID QA.
  active = 'request-decisions'
  let prisma, qaOrders = []
  try {
    const dotenv = await import('../../backend/node_modules/dotenv/lib/main.js')
    dotenv.default.config({ path: resolve(root, 'backend/.env') })
    ;({ prisma } = await import('../../backend/config/prisma.js'))
    const owner = await prisma.user.findUnique({ where: { email: 'vendor.demo@example.com' } })
    const shop = await prisma.shop.findFirst({ where: { ownerId: owner.id } })
    for (let i = 0; i < 2; i++) {
      qaOrders.push(await prisma.order.create({ data: {
        shopId: shop.id, renterId: owner.id, receiverName: 'QA Vendor FE', receiverPhone: '0900000000', shippingMethod: 'PICKUP',
        note: 'QA Browser decision ' + Date.now(), rentalTotal: 150000, platformFee: 15000, depositTotal: 400000, totalAmount: 550000,
        payments: { create: [{ type: 'PAY', method: 'BANK', amount: 550000, status: 'SUCCESS' }] },
      } }))
    }
    await navigate('/vendor/yeu-cau-thue')
    await waitFor(`document.body.innerText.includes(${JSON.stringify(qaOrders[1].id)})`)
    await evaluate(`(() => {const card=[...document.querySelectorAll('.card')].find(c=>c.innerText.includes('${qaOrders[0].id}')); [...card.querySelectorAll('button')].find(b=>b.textContent.trim()==='Xác nhận đơn').click()})()`)
    await waitFor(`[...document.querySelectorAll('.card')].some(c=>c.innerText.includes('${qaOrders[0].id}') && c.innerText.includes('Đã xác nhận'))`)
    await evaluate(`(() => {const card=[...document.querySelectorAll('.card')].find(c=>c.innerText.includes('${qaOrders[1].id}')); const select=card.querySelector('select'); select.value=select.options[1].value; select.dispatchEvent(new Event('change',{bubbles:true}));})()`)
    await evaluate(`(() => {const card=[...document.querySelectorAll('.card')].find(c=>c.innerText.includes('${qaOrders[1].id}')); [...card.querySelectorAll('button')].find(b=>b.textContent.trim()==='Từ chối').click()})()`)
    await waitFor(`[...document.querySelectorAll('.card')].some(c=>c.innerText.includes('${qaOrders[1].id}') && c.innerText.includes('Đã từ chối'))`)
    const states = await prisma.order.findMany({ where: { id: { in: qaOrders.map(o => o.id) }, shopId: shop.id } })
    if (states.find(o => o.id === qaOrders[0].id)?.status !== 'CONFIRMED' || states.find(o => o.id === qaOrders[1].id)?.status !== 'CANCELLED') throw new Error('Trạng thái DB không đúng')
    const refunds = await prisma.payment.count({ where: { orderId: qaOrders[1].id, type: 'REFUND', status: 'PENDING' } })
    if (refunds !== 1) throw new Error('Chưa có khoản hoàn tiền chờ xử lý')
    actions.push({ name: 'Xác nhận/từ chối qua O06, kiểm tra DB và REFUND PENDING', ok: true })
    console.log('PASS O06 confirm/reject via browser; REFUND PENDING verified')
  } catch (error) { actions.push({ name: 'O06 confirm/reject', ok: false, error: error.message }); console.log('FAIL O06: ' + error.message) }
  finally {
    if (prisma) {
      const ids = qaOrders.map(o => o.id)
      await prisma.payment.deleteMany({ where: { orderId: { in: ids } } })
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: ids } } })
      await prisma.order.deleteMany({ where: { id: { in: ids } } })
      await prisma.$disconnect()
    }
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await navigate('/vendor/tong-quan')
  await waitFor(`document.body.textContent.includes('Doanh thu tháng')`)
  const mobile = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  await writeFile(resolve(out, 'mobile-tong-quan.png'), Buffer.from(mobile.data, 'base64'))
  active = 'guard-no-token'
  await evaluate(`localStorage.removeItem('accessToken')`)
  await evaluate(`document.querySelector('a[href="/vendor/san-pham"]').click()`)
  await waitFor(`location.pathname === '/vendor/access'`)
  actions.push({ name: 'Guard chặn khi không có token', ok: true })
  console.log('PASS guard without token')
  await writeFile(resolve(out, 'report.json'), JSON.stringify({ results, actions, errors, requests }, null, 2))
  console.log(`${results.filter(r => r.ok).length}/${results.length} pages; errors=${errors.length}; failedRequests=${requests.filter(r => r.status >= 400).length}`)
  if (errors.length) console.log(JSON.stringify(errors))
  if (results.some(r => !r.ok) || actions.some(r => !r.ok) || errors.length) process.exitCode = 1
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' }))
  await pause(1000)
  socket?.close(); browser.kill()
}
