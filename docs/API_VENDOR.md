# API Vendor (Thành viên 3 – Thắng)

Mount trong server: `app.use('/api/vendor', vendorRoutes)` (import từ `routes/vendor/index.js`).
Mọi endpoint cần header `Authorization: Bearer <JWT>`, user có role `VENDOR` hoặc `OWNER` và đã có Shop.
Lỗi luôn dạng `{ success:false, error:'<code>', message:'<tiếng Việt>' }`. Thành công trả JSON thô (không bọc `data`).

## Bắt buộc
| Method | Path | Mô tả | Trang |
|---|---|---|---|
| GET | `/products?status=ALL\|PENDING\|ACTIVE\|REJECTED\|HIDDEN` | Danh sách sản phẩm của shop | O02 |
| GET | `/products/:id` | Chi tiết để đổ vào form sửa | O03 |
| POST | `/products` | Thêm (luôn vào `PENDING`) → 201 | O03 |
| PUT | `/products/:id` | Sửa (ghi đè ảnh + phụ kiện). ACTIVE/REJECTED → PENDING | O03 |
| POST | `/products/:id/hide` · `/show` | Ẩn (ACTIVE→HIDDEN) / hiện lại (HIDDEN→ACTIVE) | O02 |
| DELETE | `/products/:id` | Xóa. 409 nếu đã có đơn thuê (dùng Ẩn) | O02 |
| GET | `/orders?group=all\|pending\|ship\|rent\|check\|done\|cancel&limit=100` | Lịch sử đơn khách đặt | O07 |
| GET | `/orders/:id` | Chi tiết đơn (SĐT/địa chỉ chỉ hiện sau khi đã xác nhận) | O08 |
| GET | `/revenue` | `{ totalRevenue, grossRental, platformFee, completedOrders, pendingPayout, pendingOrders }` | O10/O01 |
| GET | `/meta` | Dropdown cho form sản phẩm (`productForm.categories/brands/series` lấy từ DB, chỉ mục ACTIVE; `sizes`, `genders`…) + `rejectReasons` | O03, O06 |
| GET | `/shop` | `{ id, name }` của gian hàng | O01, O02, O07 |
| GET | `/dashboard` | KPI, yêu cầu chờ, đơn đang xử lý, doanh thu 6 tháng | O01 |
| GET | `/stats?range=d7\|d30\|month\|quarter\|custom&from=YYYY-MM-DD&to=YYYY-MM-DD` | Biểu đồ cột (`bars`) + 2 biểu đồ tròn (`products`, `orderStatus`) + `top` | O16 |

## Tự chọn 2 – xác nhận / từ chối đơn
| Method | Path | Body |
|---|---|---|
| GET | `/requests` | – (đơn `PENDING`, cũ nhất trước) |
| POST | `/requests/:id/confirm` | – |
| POST | `/requests/:id/reject` | `{ "reason": "Bộ đồ đang giặt" }` (3–300 ký tự) |
| PATCH | `/orders/:id/status` | `{ "status": "CONFIRMED" \| "CANCELLED", "reason"? }` (route cũ, cùng logic) |

Chỉ cho phép `PENDING → CONFIRMED` hoặc `PENDING → CANCELLED`. Sai trạng thái → 409. Mỗi lần đổi ghi 1 dòng `OrderStatusHistory`; từ chối đơn đã thanh toán tạo thêm 1 `Payment` loại `REFUND` (status `PENDING`).

## Body tạo / sửa sản phẩm
```json
{
  "name": "Raiden Shogun", "characterName": "Raiden Shogun", "description": "…",
  "categoryId": "<ObjectId>", "brandId": "<ObjectId|null>", "seriesId": "<ObjectId|null>",
  "productType": "COSTUME", "gender": "FEMALE", "size": "M", "difficulty": "MEDIUM",
  "conditionLevel": "LIKE_NEW", "itemValue": 800000, "careGuide": "Giặt tay, không sấy",
  "pricePerDay": 150000, "depositAmount": 400000, "quantity": 1,
  "minRentalDays": 1, "maxRentalDays": 7, "cleaningDays": 1,
  "images": ["/uploads/a.jpg", "/uploads/b.jpg"],
  "accessories": [{ "type": "WIG", "name": "Tóc tím", "isRequired": false }]
}
```
`images[0]` là ảnh bìa. `accessories[].type` ∈ `WIG | SHOES | PROPS | OTHER`. `conditionLevel` ∈ `NEW | LIKE_NEW | GOOD | FAIR`. `itemValue` (tùy chọn): nếu có thì `depositAmount` ≥ 50% `itemValue` (đồ từ 5.000.000đ phải cọc 100%). PUT là ghi đè nên trường tùy chọn bỏ trống sẽ bị xóa. Các trường khác (shopId, status, rentalCount…) bị bỏ qua.

## Dữ liệu MOCK (schema chưa có model)
Điểm đánh giá, số đánh giá, tỷ lệ tranh chấp, `disputeAlert`, `verified` (CCCD) → trả giá trị cố định, nằm trong `utils/vendorConstants.js` (`MOCK`).
