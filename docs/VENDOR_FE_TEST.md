# Kiểm tra frontend Vendor

Nhánh làm việc: `feature/vendor-fe`. Không sửa schema, package, cấu hình môi trường hoặc phần auth/customer/staff/admin.

## Chạy ứng dụng

Từ thư mục gốc repo, mở hai terminal:

```powershell
node backend/server.js
```

```powershell
cd frontend
npm.cmd run dev
```

Khi dùng PowerShell có chặn `npm.ps1`, gọi `npm.cmd`; không cần đổi execution policy.

## Tài khoản demo và token

`vendor.demo@example.com` có role VENDOR và shop. Tài khoản seed chưa có `passwordHash`.
Repo hiện chưa có route đăng nhập: kiểm tra `POST /api/auth/login` trả HTTP 404. Không thể đăng nhập bằng mật khẩu seed và không thay đổi phần auth của nhóm.

Từ thư mục `backend`:

```powershell
node scripts/makeToken.js vendor.demo@example.com
```

Mở `http://127.0.0.1:5173/vendor/access`, mở DevTools → Console, dán JWT vừa nhận:

```javascript
localStorage.setItem('accessToken', 'DAN_JWT_VAO_DAY')
location.href = '/vendor/tong-quan'
```

Phải dùng khóa **accessToken**, theo `services/axious.js` của nhóm. localStorage của `localhost` và `127.0.0.1` là hai nơi khác nhau; hãy giữ cùng một địa chỉ khi test.
Token hết hạn sau một ngày: tạo lại bằng lệnh trên. Không đưa JWT vào Git.

Guard vendor gọi `/api/vendor/shop`: backend kiểm tra JWT, role VENDOR/OWNER và quyền sở hữu shop. Chưa có guard auth dùng chung trong repo nên guard này nằm riêng ở `router/vendorRoutes.js`.
O15 đăng ký là trang công khai có dữ liệu minh họa; các trang quản lý yêu cầu quyền vendor.

## Phạm vi file

| Nhóm | File |
| --- | --- |
| API | `frontend/src/services/vendorService.js`, dùng lại `axious.js` và cơ chế trả JSON sẵn có |
| Router | Thêm `router/vendorRoutes.js`, `router/vendorMenu.js`; chỉ thay khối route vendor trong `router/index.js` |
| Component | Thêm các component tham khảo vào `components/`; thành phần riêng tại `components/owner/` |
| Layout và giao diện | Thêm `layouts/BoLayout.vue`, `layouts/PublicLayout.vue`, `assets/css/vendor.scss` |
| Tiện ích | Thêm `store/ui.js` (không tạo `stores/`), `services/http.js`, `services/uploadService.js`, `utils/format.js`, `config/ownerUi.js` |
| Trang | Chỉnh 16 file trong `views/vendor/` |
| Mock | `frontend/mock/vendor.js`; các thao tác minh họa không ghi MongoDB |

Không thêm auth store hay sao chép các store staff/admin/cart từ reference. `PublicLayout` mới chỉ dùng các route hiện có; không sửa Header của nhóm.

## Kiểm tra tự động

Build chạy thành công sau tích hợp đủ 16 trang, sau từng trang động O06 → O01 → O02 → O07 → O16 → O08 → O03 và sau từng trang mock.

```powershell
npm.cmd --prefix frontend run build
node frontend/scripts/checkVendorBrowser.mjs
```

Script trình duyệt yêu cầu backend cổng 3000, Vite tại `127.0.0.1:5173`, Chrome tại vị trí mặc định trên Windows. Không cần cài thêm package.

Script kiểm tra 16 trang bằng Chrome headless, thu console/API errors, chụp ảnh desktop và mobile, thử CRUD sản phẩm qua UI, xác nhận/từ chối hai đơn QA riêng, kiểm tra DB và `REFUND/PENDING`, và guard khi thiếu token.
Sản phẩm và hai đơn QA được xóa sau khi kiểm tra. 14 đơn demo ban đầu được giữ nguyên.
Kết quả và ảnh nằm trong `.tmp/vendor-browser/`; profile trình duyệt là file tạm, không commit.

Kết quả ngày 28/10/2026: **16/16 trang PASS**, không có lỗi console hoặc API request thất bại; CRUD sản phẩm, xác nhận/từ chối O06 và guard thiếu token đều PASS. Kiểm tra riêng modal kho hiển thị đúng với hai trường nhập. API kiểm tra lại đạt **18/18**. Đã xem ảnh dashboard desktop/mobile, lịch, chat và đăng ký; cần chủ đồ đối chiếu thêm với Figma gốc.

Kiểm tra API riêng:

```powershell
cd backend
node scripts/checkVendor.js vendor.demo@example.com
```

## Những điểm cần xem bằng mắt

- O06: thông báo xác nhận/từ chối, lý do từ chối, trạng thái khi tải lại. Hoàn tiền là khoản chờ xử lý, không thông báo đã hoàn tiền.
- O01/O16: doanh thu chỉ gồm đơn COMPLETED và trừ phí; các chỉ số đánh giá/tranh chấp từ backend vẫn là mock.
- O02: tab trạng thái, sửa, ẩn/hiện, xóa sản phẩm chưa có đơn; sản phẩm có đơn trả lỗi 409 khi xóa.
- O07/O08: bảng đơn, thông tin liên hệ được ẩn trước khi xác nhận; O08 chỉ đọc, không có nút giao hàng/hoàn tất giả.
- O03: danh mục/thương hiệu/series từ DB, size chuỗi, phụ kiện WIG/SHOES/PROPS/OTHER, ngày thuê, cọc tối thiểu và chỉnh sửa sản phẩm hiện có.
- O04/O05/O09–O15: bố cục và nội dung minh họa; O10 hiển thị tổng doanh thu thật ở đầu trang, ví/rút tiền và biểu đồ phía dưới là mock.
- Bảng có thể cuộn ngang trên màn hình nhỏ; kiểm tra sidebar, lịch, chat, modal và các form ở kích thước màn hình bạn dùng thuyết trình.

## Giới hạn hiện tại

- Backend chưa có `/api/uploads`. O03 nhập đường dẫn ảnh (mỗi dòng một ảnh) để thao tác CRUD được; chưa hỗ trợ tải file ảnh từ máy lên server. Các ô bằng chứng/CCCD mock không tải file thật.
- Chưa có Figma hoặc bộ ảnh Figma trong repo để đối chiếu từng pixel; đã giữ khung của các trang tham khảo, bổ sung CSS vendor và kiểm tra ảnh render trong Chrome.
- Sass/Bootstrap có cảnh báo deprecation sẵn có; build vẫn thành công. Không sửa SCSS dùng chung hoặc package của nhóm để xử lý cảnh báo này.
