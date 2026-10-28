import { vendorService } from '@/services/vendorService'
// Chưa có guard của nhóm. Backend kiểm tra JWT, vai trò VENDOR/OWNER và shop.
async function requireVendor() {
 if (!localStorage.getItem('accessToken')) return { name: 'VendorAccess', query: { reason: 'login' } }
 try { await vendorService.shop(); return true } catch { return { name: 'VendorAccess', query: { reason: 'denied' } } }
}
const views = import.meta.glob('../views/vendor/*.vue')
const pages = [["tong-quan","ChuTongQuan","TongQuan"],["san-pham","ChuSanPham","SanPham"],["san-pham/dang","ChuDangSP","DangSP"],["kho-hang","ChuKho","Kho"],["lich-thue","ChuLich","Lich"],["yeu-cau-thue","ChuYeuCau","YeuCau"],["don-thue","ChuDon","Don"],["don-thue/chi-tiet","ChuDonChiTiet","DonChiTiet"],["tra-do","ChuTraDo","TraDo"],["rut-tien","ChuRutTien","RutTien"],["tin-nhan","ChuTinNhan","TinNhan"],["tranh-chap","ChuTranhChap","TranhChap"],["danh-gia","ChuDanhGia","DanhGia"],["ho-so","ChuHoSo","HoSo"],["thong-ke","ChuThongKe","ThongKe"]]
export default [
{ path: '/vendor/access', name: 'VendorAccess', component: () => import('@/components/owner/VendorAccess.vue') },
{ path: '/vendor', redirect: '/vendor/tong-quan' },
{ path: '/vendor/dang-ky', name: 'ChuDangKy', component: views['../views/vendor/DangKy.vue'] },
...pages.map(([path, name, file]) => ({ path: '/vendor/' + path, name, component: views['../views/vendor/' + file + '.vue'], beforeEnter: requireVendor, meta: { roles: ['VENDOR', 'OWNER'] } }))
]
