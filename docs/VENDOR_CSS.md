# CSS khu vực vendor

Nguồn thực tế: `docs/assets/css/`. Sao chép `_tokens.scss`, `_components.scss`, `_app.scss` vào `frontend/src/assets/css/vendor-reference/`; không nạp `main.scss` vì file này nhập Bootstrap lần nữa.

`frontend/src/assets/css/vendor.scss` bọc CSS tham khảo trong `.vendor-area`. Các selector html/body/#app được chuyển về gốc này. Token tham khảo là biến Sass, không có biến CSS `:root`. Chỉ `frontend/src/layouts/BoLayout.vue` import stylesheet. Không sửa main.js hoặc stylesheet global.

`BoLayout.vue` đặt class gốc; `PublicLayout.vue` dùng nhánh public của BoLayout để trang đăng ký cũng có phạm vi CSS. `ModalBox.vue` bọc nội dung Teleport bằng `.vendor-area`. Các reset Bootstrap chỉ nằm trong phạm vi vendor, giữ padding của component tham khảo.

## Kiểm tra ngày 28/10/2026

- `npm.cmd --prefix frontend run build`: PASS.
- Chrome headless thật, `node frontend/scripts/checkVendorBrowser.mjs`: 16/16 trang; không lỗi console hoặc API. Thêm/sửa/xóa sản phẩm, xác nhận/từ chối đơn, REFUND PENDING và guard thiếu token đều PASS.
- Bước chờ dashboard trong script dùng textContent vì CSS tham khảo chuyển nhãn KPI thành chữ hoa khi đọc innerText.
- `node frontend/scripts/checkVendorCss.mjs after`: trang chủ `/` và admin `/admin` có ảnh chụp và các thuộc tính CSS được kiểm tra khớp baseline trước thay đổi. Đã chủ động tải module BoLayout trên cả hai trang để kiểm tra ảnh hưởng stylesheet. Repo hiện chưa có route đăng nhập để so sánh.
- Báo cáo/ảnh: `.tmp/vendor-css/`, `.tmp/vendor-browser/`. Đã xem ảnh dashboard desktop; cần người dùng đối chiếu trực tiếp các trang với Figma và kiểm tra kích thước màn hình sử dụng thực tế.

## Class chưa có trong CSS tham khảo

| Class trang đang dùng | File | Rule tương tự có trong nguồn |
| --- | --- | --- |
| `.bubble.other` | `frontend/src/views/vendor/TinNhan.vue` | `.bubble.th` |
| `.bubble.system` | `frontend/src/views/vendor/TinNhan.vue` | `.bubble.sys` |

Chưa thêm rule hoặc tự đổi tên hai class này. `.bubble` chung vẫn áp dụng. `.vendor-area` là wrapper phục vụ phạm vi CSS, được khai báo trong stylesheet mới.
