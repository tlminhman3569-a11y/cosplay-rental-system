import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

// Chụp và so sánh trang ngoài vendor khi stylesheet vendor đã được tải.
const stage = process.argv[2] || 'after'
const root = resolve(import.meta.dirname, '../..')
const out = resolve(root, '.tmp/vendor-css')
await mkdir(out, { recursive: true })
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9225', '--user-data-dir=' + resolve(root, '.tmp/vendor-browser/css-profile'), 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const pause = ms => new Promise(r => setTimeout(r, ms))
let socket
try {
  let targets
  for (let i = 0; i < 60; i++) { try { targets = await (await fetch('http://127.0.0.1:9225/json')).json(); break } catch { await pause(200) } }
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise(r => { socket.onopen = r })
  let id = 0
  const pending = new Map()
  socket.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result) } }
  const call = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })) })
  const evaluate = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value }
  await call('Page.enable'); await call('Network.enable'); await call('Network.setCacheDisabled', { cacheDisabled: true })
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  const results = []
  for (const [name, path] of [['home', '/'], ['admin', '/admin']]) {
    await call('Page.navigate', { url: 'http://127.0.0.1:5173' + path })
    for (let i = 0; i < 100; i++) { await pause(100); if (await evaluate(`location.pathname === ${JSON.stringify(path)} && !!document.querySelector('header')`)) break }
    // Tải qua đúng layout, không thêm CSS vào main.js hoặc stylesheet global.
    await evaluate(`import('/src/layouts/BoLayout.vue').then(() => document.fonts.ready).then(() => true)`)
    await pause(600)
    const snapshot = await evaluate(`(() => {
      const properties = ['color','backgroundColor','fontFamily','fontSize','lineHeight','display','padding','margin','borderRadius','width','height','--bs-primary','--bs-body-font-family','--bs-body-bg'];
      return { text:document.body.innerText, elements:[...document.querySelectorAll('html,body,header,main,aside,.btn,.card')].map(el => {const css=getComputedStyle(el); return {tag:el.tagName,classes:el.className,style:Object.fromEntries(properties.map(p=>[p,css.getPropertyValue(p.startsWith('--')?p:p.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()))]))}}) }
    })()`)
    const shot = await call('Page.captureScreenshot', { format: 'png' })
    const png = Buffer.from(shot.data, 'base64')
    const hash = createHash('sha256').update(png).digest('hex')
    await writeFile(resolve(out, `${name}-${stage}.png`), png)
    results.push({ name, path, snapshot, hash })
  }
  await writeFile(resolve(out, stage + '.json'), JSON.stringify(results, null, 2))
  if (stage === 'after') {
    const baseline = JSON.parse(await readFile(resolve(out, 'before.json'), 'utf8'))
    for (const result of results) {
      const before = baseline.find(r => r.name === result.name)
      const stylesMatch = JSON.stringify(before.snapshot) === JSON.stringify(result.snapshot)
      const pixelsMatch = before.hash === result.hash
      console.log(JSON.stringify({ page: result.path, stylesMatch, pixelsMatch }))
      if (!stylesMatch || !pixelsMatch) process.exitCode = 1
    }
  } else console.log('Đã lưu baseline trang chủ và admin')
  await call('Browser.close')
} finally { socket?.close(); browser.kill() }
