<template>
  <footer class="mt-5">
    <!-- Dải cam kết của sàn -->
    <div class="container mb-4">
      <div class="d-flex flex-wrap justify-content-around align-items-center p-3 text-white bg-primary"
           style="border-radius: 12px;">
        <span class="fw-semibold">Cọc do sàn giữ</span>
        <span class="fw-semibold">Đồng kiểm ảnh + QR</span>
        <span class="fw-semibold">Hoàn cọc 1-3 ngày làm việc</span>
        <span class="fw-semibold">Hủy miễn phí trước 48 giờ</span>
      </div>
    </div>

    <!-- Khối kêu gọi Trở thành chủ đồ -->
    <div class="container mb-5">
      <div class="p-4 d-flex justify-content-between align-items-center bg-light-bg"
           style="border: 1px solid #E6DED5; border-radius: 12px;">
        <div>
          <h5 class="fw-bold mb-2 text-primary">Có tủ đồ cosplay đang nằm không?</h5>
          <p class="mb-0 text-muted" style="font-size: 14.5px;">
            Đăng cho thuê, Clarity giữ tiền an toàn và giải quyết tranh chấp.
            Phí nền tảng chỉ 7% tiền thuê, trừ vào tiền chủ đồ nhận.
          </p>
        </div>
        <!-- Thêm flexbox và set cứng chiều cao để ép chữ nút bấm nằm giữa -->
        <button class="btn btn-secondary text-white fw-semibold px-4 d-inline-flex align-items-center justify-content-center"
                style="height: 40px; border-radius: 8px; white-space: nowrap;">
          Trở thành chủ đồ
        </button>
      </div>
    </div>

    <!-- Chân trang tối màu -->
    <div class="py-4 bg-primary">
      <div class="container d-flex flex-wrap justify-content-between align-items-center text-white">

        <!-- Logo Footer -->
        <div class="d-flex align-items-center gap-2">
          <div class="d-flex justify-content-center align-items-center text-white bg-accent rounded"
               style="width: 32px; height: 32px; font-weight: bold;">
            C
          </div>
          <div class="d-flex flex-column lh-1">
            <span class="fw-bold" style="font-size: 1.1rem; letter-spacing: 0.5px;">Clarity</span>
            <span style="font-size: 9px; color: #D3C4B7; letter-spacing: 1px; font-weight: 600; margin-top: 2px;">CHO THUÊ COSPLAY</span>
          </div>
        </div>

        <!-- Footer Links -->
        <div class="d-flex gap-3" style="font-size: 14px; color: #D3C4B7;">
          <a href="#" class="text-decoration-none text-light hover-opacity">Hướng dẫn thuê</a>
          <span>·</span>
          <a href="#" class="text-decoration-none text-light hover-opacity">Chính sách</a>
          <span>·</span>
          <a href="#" class="text-decoration-none text-light hover-opacity">Liên hệ hỗ trợ</a>
        </div>

        <!-- Copyright (Cập nhật năm hiện tại) -->
        <div style="font-size: 14px; color: #D3C4B7;">
          © 2026 Clarity
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.hover-opacity:hover {
  opacity: 0.8;
}
</style>