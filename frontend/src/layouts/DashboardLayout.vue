<template>
  <div class="d-flex min-vh-100 bg-light-bg">

    <!-- SIDEBAR -->
    <aside class="bg-white border-end d-flex flex-column" style="width: 260px; position: sticky; top: 0; height: 100vh;">
      <div class="p-4 d-flex align-items-center gap-2 mb-2">
        <div class="d-flex justify-content-center align-items-center text-white bg-primary rounded"
             style="width: 38px; height: 38px; font-weight: bold; font-size: 20px;">
          C
        </div>
        <div class="d-flex flex-column lh-1">
          <span class="fw-bold text-primary" style="font-size: 1.2rem; letter-spacing: 0.5px;">Clarity</span>
          <span class="text-accent" style="font-size: 10px; letter-spacing: 1px; font-weight: 700; margin-top: 2px;">BACK OFFICE</span>
        </div>
      </div>

      <div class="flex-grow-1 overflow-auto px-3 pb-4 custom-scrollbar">
        <ul class="nav flex-column gap-1">
          <li class="nav-item">
            <a href="#" class="nav-link d-flex align-items-center gap-3 menu-item">
              <div class="icon-box border rounded"></div>
              <span>Tổng quan</span>
            </a>
          </li>

          <!-- Active Menu Item -->
          <li class="nav-item">
            <a href="#" class="nav-link d-flex align-items-center gap-3 menu-item active bg-menu-active text-primary">
              <div class="icon-box rounded bg-primary"></div>
              <span class="fw-bold">Sản phẩm của tôi</span>
            </a>
          </li>

          <li class="nav-item"><a href="#" class="nav-link d-flex align-items-center gap-3 menu-item"><div class="icon-box border rounded"></div><span>Kho hàng</span></a></li>

          <li class="nav-item">
            <a href="#" class="nav-link d-flex align-items-center justify-content-between menu-item">
              <div class="d-flex align-items-center gap-3">
                <div class="icon-box border rounded"></div>
                <span>Yêu cầu thuê</span>
              </div>
              <span class="badge rounded-pill bg-danger">2</span>
            </a>
          </li>

          <li class="nav-item"><a href="#" class="nav-link d-flex align-items-center gap-3 menu-item"><div class="icon-box border rounded"></div><span>Đơn thuê</span></a></li>
          <li class="nav-item"><a href="#" class="nav-link d-flex align-items-center gap-3 menu-item"><div class="icon-box border rounded"></div><span>Hồ sơ shop</span></a></li>
        </ul>
      </div>
    </aside>

    <!-- MAIN AREA -->
    <div class="flex-grow-1 d-flex flex-column">
      <header class="bg-white border-bottom px-4 d-flex justify-content-between align-items-center" style="height: 72px;">
        <h4 class="fw-bold mb-0 text-primary">Tổng quan</h4>

        <div class="d-flex align-items-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <!-- User Avatar -->
            <div class="d-flex justify-content-center align-items-center text-white bg-secondary rounded-circle"
                 style="width: 36px; height: 36px; font-weight: bold;">
              TM
            </div>
            <div class="d-flex flex-column lh-1">
              <span class="fw-bold mb-1 text-primary" style="font-size: 14px;">Trần Thị Mai</span>
              <span class="badge bg-badge-bg text-accent" style="font-size: 10px;">CHỦ CHO THUÊ</span>
            </div>
          </div>
          <div class="border-start ms-2 ps-3 h-50"></div>
          <a href="#" class="text-decoration-none text-muted" style="font-size: 14px;">Đăng xuất</a>
        </div>
      </header>

      <main class="p-4 flex-grow-1">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.menu-item {
  color: #6c757d;
  border-radius: 8px;
  padding: 10px 15px;
  transition: all 0.2s ease-in-out;
}
.menu-item:hover {
  background-color: #f8f9fa;
  color: var(--bs-primary);
}
.icon-box {
  width: 18px;
  height: 18px;
  border-color: #ced4da !important;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #E2DCD0;
}
</style>