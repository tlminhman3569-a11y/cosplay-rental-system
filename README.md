# cosplay-rental-system
cosplay rental system model c2c

## Các Actor trong hệ thống
1. **Khách thuê (Customer):** Tìm kiếm, thuê đồ, thanh toán, đánh giá.
2. **Chủ cho thuê (Vendor):** Đăng sản phẩm, quản lý kho đồ, duyệt đơn, xem doanh thu.
3. **Nhân viên (Staff):** Duyệt bài đăng, giải quyết khiếu nại (đồ hư, trả muộn).
4. **Quản trị viên (Admin):** Quản lý người dùng, cấu hình phí sàn, xem thống kê tổng.

## Tính năng
**Bắt buộc:**
- Đăng ký (Gửi email xác nhận), Đăng nhập, Đăng xuất, Lấy lại mật khẩu.
- Xem chi tiết sản phẩm, Quản lý giỏ hàng, Đặt hàng, Thanh toán trực tuyến.
- Xem lịch sử mua/thuê hàng.
- Thống kê biểu đồ cột (theo thời gian tùy chọn) và biểu đồ tròn.
- Admin quản lý người dùng, sản phẩm, đơn hàng.
- Vendor quản lý sản phẩm, doanh thu, đơn hàng.

**Mở rộng (Tự chọn):**
1. Đăng nhập bằng Google
2. Cập nhật trạng thái đơn hàng
3. Lọc sản phẩm (thương hiệu, loại...)
4. Hiển thị sản phẩm bán chạy trên trang chủ
5. Hiển thị sản phẩm mới nhất trên trang chủ
6. Hiển thị sản phẩm gợi ý (Trang chủ, sản phẩm tương tự)
7. Sắp xếp thứ tự hiển thị (giá tăng/giảm, số lượng đã bán...)
8. Cập nhật thông tin cá nhân
9. Tìm kiếm gian hàng
10. Xem sản phẩm thuộc gian hàng

## Cấu trúc thư mục dự án

```text
├── frontend/
│   ├── general/            # File tĩnh hệ thống
│   ├── mock/               # Chứa dữ liệu tĩnh phục vụ việc hiện giao diện nhanh
│   └── src/
│       ├── assets/         # Tài nguyên dùng chung
│       │   ├── css/        # Stylesheet (Global, Variables)
│       │   └── images/     # Logo, Banner, Icon
│       ├── components/     # UI Components dùng chung (Button, Card, Input)
│       ├── router/         # Cấu hình định tuyến & Chặn quyền truy cập
│       ├── services/       # Nơi gọi API (Axios) lên Backend
│       ├── store/          # Quản lý trạng thái (Auth, Giỏ hàng)
│       ├── layouts/        # Chứa bộ khung giao diện
│       └── views/          # Giao diện chính phân theo Phân hệ/Actor
│           ├── public/     # Khách vãng lai (Trang chủ, Chi tiết đồ, Tìm kiếm)
│           ├── auth/       # Xác thực (Đăng nhập, Đăng ký)
│           ├── customer/   # ACTOR 1: Khách thuê (Lịch sử thuê, Profile)
│           ├── vendor/     # ACTOR 2: Chủ cho thuê (Quản lý kho đồ, Đơn hàng được thuê)
│           ├── staff/      # ACTOR 3: Nhân viên (Duyệt bài đăng, Xử lý khiếu nại đồ hư/trả muộn)
│           └── admin/      # ACTOR 4: Quản trị viên (Quản lý User, Cấu hình phí sàn, Thống kê tổng)
│
└── backend/
    ├── config/             # Cấu hình hệ thống (Kết nối DB, cấu hình Cloudinary/S3)
    ├── models/             # Định nghĩa các Schema MongoDB (User, Product, Order, Dispute...)
    ├── middlewares/        # Bộ lọc bảo mật (Xác thực JWT, kiểm tra quyền Admin/Staff/Vendor)
    ├── utils/              # Các hàm tiện ích dùng chung (Gửi email, format dữ liệu)
    ├── uploads/            # Thư mục tạm chứa ảnh (nếu không dùng cloud)
    │
    ├── routes/             # ĐỊNH TUYẾN API (Chia theo nhóm quyền lực)
    │   ├── public/         # API không cần đăng nhập (Xem danh sách đồ, tìm kiếm, xem chi tiết)
    │   ├── auth/           # API xác thực (Đăng ký, đăng nhập, đổi mật khẩu)
    │   ├── customer/       # API dành cho Khách thuê (Tạo đơn thuê, xem lịch sử thuê, review)
    │   ├── vendor/         # API dành cho Chủ đồ (Đăng đồ mới, sửa đồ, duyệt đơn khách thuê)
    │   ├── staff/          # API dành cho Nhân viên (Duyệt bài đăng cosplay, xử lý tranh chấp)
    │   └── admin/          # API dành cho Admin (Quản lý user, cấu hình doanh thu sàn, báo cáo)
    │
    └── controllers/        # LOGIC XỬ LÝ API (Chia thư mục tương ứng 1:1 với Routes)
        ├── auth/           # Xử lý đăng ký, đăng nhập, phân quyền ban đầu
        ├── customer/       # Xử lý đặt hàng, quản lý giỏ hàng, cập nhật profile khách
        ├── vendor/         # Xử lý thêm/sửa/xóa trang phục cosplay, thống kê tiền kiếm được
        ├── staff/          # Xử lý logic duyệt bài, kích hoạt/ẩn đồ cosplay, trung gian hòa giải
        └── admin/          # Xử lý khóa tài khoản, phân quyền staff, xem biểu đồ doanh thu tổng
