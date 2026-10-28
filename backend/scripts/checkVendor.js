import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import vm from 'node:vm'

// Dùng nguyên bộ 18 kiểm tra của vendor-test.html để kết quả CLI khớp trang test.
const email = process.argv[2]
if (!email) throw new Error('Cách chạy: node scripts/checkVendor.js <email vendor>')
const output = execFileSync(process.execPath, ['scripts/makeToken.js', email], { cwd: fileURLToBackend(), encoding: 'utf8' })
const token = output.split('TOKEN:')[1]?.trim()
if (!token) throw new Error('Không lấy được token cho vendor.')
const html = await readFile(new URL('../public/vendor-test.html', import.meta.url), 'utf8')
const source = html.slice(html.indexOf('const ZERO ='), html.indexOf("$('#btn-smoke').onclick"))
const checks = vm.runInNewContext(source + '\nSMOKE')
let passed = 0
for (const check of checks) {
  try {
    const response = await fetch('http://localhost:3000/api/vendor' + check.path, {
      method: check.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(!check.noAuth && { Authorization: `Bearer ${token}` }) },
      body: check.body === undefined ? undefined : JSON.stringify(check.body),
      signal: AbortSignal.timeout(30000),
    })
    const body = await response.json().catch(() => null)
    const ok = (check.expect || [200]).includes(response.status) && (!check.check || response.status >= 400 || !!check.check(body))
    if (ok) passed++
    console.log(`${ok ? 'ĐẠT' : 'LỖI'} | ${check.name} | HTTP ${response.status}${!ok ? ' | ' + JSON.stringify(body) : ''}`)
  } catch (error) { console.log(`LỖI | ${check.name} | ${error.message}`) }
}
console.log(`${passed}/${checks.length} đạt`)
if (passed !== checks.length) process.exitCode = 1
function fileURLToBackend() { return new URL('../', import.meta.url) }
