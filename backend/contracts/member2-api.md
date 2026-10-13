# Hợp đồng API — Thành viên 2

Base URL: `/api`. Tất cả phản hồi thành công có dạng `{ "data": ... }`; lỗi có dạng
`{ "error": { "message": "...", "code": "..." } }`.

## Quy ước tích hợp

- API công khai sản phẩm không cần đăng nhập. API dưới `/customer` cần middleware xác thực của Thành viên 1 gắn người dùng đã xác thực vào `req.user.id`. Controller không nhận `userId` trong body.
- Đơn được tạo với `status: "AWAITING_PAYMENT"`. Sau IPN VNPay hợp lệ, đơn chuyển thành `PENDING` và ghi `OrderStatusHistory`; chỉ từ trạng thái `PENDING` thì API yêu cầu thuê của Thành viên 3 hiển thị đơn.
- Thành viên 3 cập nhật `Order.status` và thêm `OrderStatusHistory`. Thành viên 2 đọc đúng các trường này cho màn khách.
- Một checkout có thể tạo nhiều Order, một Order cho mỗi shop. Mọi Order cùng checkout có `checkoutRef`; Payment có một bản ghi cho mỗi Order.

## Sản phẩm công khai

| API | Query/response chính |
| --- | --- |
| `GET /products` | `q`, `categoryId`, `brandId`, `seriesId`, `shopId`, `gender`, `size`, `minPrice`, `maxPrice`, `sort` (`price_asc`, `price_desc`, `rental_count`, `newest`), `page`, `limit`. Trả `{items, pagination}`. |
| `GET /products/:id` | Trả product, `shop`, `images`, `accessories`, `blockedDates`, `similarProducts`. |
| `GET /products/sections/bestsellers` | Trả `{items}` theo `rentalCount` giảm dần. |
| `GET /products/sections/newest` | Trả `{items}` theo `createdAt` giảm dần. |
| `GET /products/sections/recommended` | Query tùy chọn `productId`; ưu tiên cùng `seriesId`, sau đó `categoryId`. |
| `GET /shops/:shopId/products` | Dùng cùng lọc/phân trang `GET /products`, khóa theo shop. |

## Giỏ, checkout và đơn khách

`selectedAccessories` là mảng JSON `{ accessoryId, quantity }`; server chụp giá và cọc phụ kiện tại thời điểm checkout.

| API | Body/response chính |
| --- | --- |
| `GET /customer/cart/items` | Trả `{items, totals}`. |
| `POST /customer/cart/items` | `{productId, quantity, startDate, endDate, selectedAccessories}`. |
| `PATCH /customer/cart/items/:itemId` | Cùng các trường có thể đổi của POST. |
| `DELETE /customer/cart/items/:itemId` | Xóa item của chính người dùng. |
| `POST /customer/checkouts` | `{cartItemIds, receiverName, receiverPhone, shippingAddress, city, shippingProvider, shippingMethod, note}`. Trả `{checkoutId, orders, paymentUrl}`. |
| `GET /customer/orders` | Query `status`, `page`, `limit`; trả `{items, pagination}`. |
| `GET /customer/orders/:id` | Trả đơn, `orderItems`, `payments`, `statusHistory`, `shop`. |

## Thanh toán VNPay sandbox

| API | Trách nhiệm |
| --- | --- |
| `GET /payments/vnpay/return` | Kiểm chữ ký rồi chuyển hướng về frontend với trạng thái thanh toán. |
| `GET /payments/vnpay/ipn` | Kiểm `vnp_SecureHash`, `vnp_TxnRef`, số tiền; xử lý lặp an toàn và chỉ chuyển đơn sang `PENDING` một lần. |

Biến môi trường cần dùng: `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL`, `FRONTEND_URL`. Không ghi credential vào repository.
