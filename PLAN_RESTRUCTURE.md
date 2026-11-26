> **Lưu ý:** Tài liệu lịch sử từ giai đoạn tái cấu trúc ban đầu. Bản đồ thư mục và hướng dẫn điều phối subagent cập nhật mới nhất xem tại [AGENTS.md](AGENTS.md) và [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).

# Kế Hoạch Chính Thức: Tái Cấu Trúc Thư Mục & Mở Rộng 3 Cổng Giao Diện (Chuẩn CNPM)

> **Dự án:** TripBuilder (`Project1_demo`)  
> **Mô hình chuẩn:** Đồng bộ với `CNPM (ViVuViet)` — 1 Backend + 3 Frontend độc lập theo vai trò (`Client`, `Tour Guide`, `Admin Tổng`)  
> **Trạng thái:** Đã chốt toàn bộ 6 quyết định kiến trúc & UX. Sẵn sàng cho các Subagent triển khai.

---

## 1. Các Quyết Định Thiết Kế Đã Chốt

1. **Đặt tên thư mục theo chuẩn CNPM:**
   - `TripBuilder-backend` (Spring Boot REST API · `:8080`)
   - `TripBuilder-frontend-client` (Cổng Khách hàng · `:5173`)
   - `TripBuilder-frontend-guide` (Cổng Hướng dẫn viên · `:5174` — chuyển từ `web-admin` cũ sang)
   - `TripBuilder-frontend-admin` (Cổng Admin Tổng · `:5175` — xây mới hoàn toàn)
2. **Quy hoạch thư mục gốc (`Project1_demo/`):**
   - Gom toàn bộ `DESIGN.md`, `PRODUCT.md`, `Project_1.pdf`, và `specs/` vào thư mục `docs/`.
   - File `run-all.bat` tại root sẽ khởi chạy đồng thời Backend (`:8080`) và cả 3 Frontend (`:5173`, `:5174`, `:5175`).
3. **Kiến trúc Backend (`TripBuilder-backend`):**
   - Chuyển toàn bộ sang **Layered Architecture** chuẩn Java Convention giống `ViVuViet-backend`: `config`, `security`, `controller`, `service`, `repository`, `entity`, `dto` (`request`, `response`), `exception`, `util`.
   - Mở rộng `Role` thành 3 vai trò: `CUSTOMER`, `GUIDE`, `ADMIN`.
   - Thêm API Đăng ký tài khoản Khách hàng (`POST /api/auth/register`) và bộ API Quản trị hệ thống (`/api/admin/...`).
4. **Thiết kế 3 Màn hình Login chuẩn thực tế:**
   - Cả 3 cổng (`Client`, `Tour Guide`, `Admin Tổng`) đều có màn Login riêng với **Chọn nhanh tài khoản mẫu 1-chạm** + **Form nhập Email/Mật khẩu** (kiểm tra đúng `expectedRole` cho từng cổng).
   - Riêng cổng **Client (`:5173`)** có thêm chế độ/tab **Đăng ký tài khoản khách hàng mới**.
5. **Loại bỏ thanh `DemoSwitcherBar` bên trong ứng dụng:**
   - Ẩn hoàn toàn `DemoSwitcherBar` sau khi đăng nhập để giao diện sạch sẽ như sản phẩm thực tế 100%.
   - Người dùng chuyển tài khoản bằng nút **Đăng xuất** trên Header để quay về màn Login chuẩn.
6. **Phạm vi chức năng Cổng Admin Tổng (`:5175`):**
   - Đầy đủ 4 phân hệ quản trị:
     1. **Tổng quan KPI toàn sàn** (Doanh thu đã chốt, thống kê đơn theo trạng thái, tổng số Tour, Guide, Khách hàng).
     2. **Quản lý Người dùng** (Danh sách Khách hàng & Tour Guide theo vùng, tìm kiếm, lọc theo vai trò, tạo tài khoản Guide mới).
     3. **Giám sát tất cả Tour & Booking toàn hệ thống** (Xem chi tiết mọi Tour mẫu thuộc 6 vùng và toàn bộ đơn đặt tour trên sàn).
     4. **Quản lý Vùng miền & Kho dịch vụ chuẩn (`PresetOption`)** (Xem danh sách 6 vùng, thêm/sửa/xóa dịch vụ chuẩn trong kho vùng để Guide & Khách sử dụng).

---

## 2. Cấu Trúc Cây Thư Mục Chi Tiết

### 2.1. Thư mục gốc (`d:\2026.1\Project1_demo`)

```text
Project1_demo/
├── .gitignore
├── README.md                              # Hướng dẫn kiến trúc 3 cổng & tài khoản demo
├── PLAN_RESTRUCTURE.md                    # File kế hoạch điều phối Subagents
├── run-all.bat                            # Script khởi chạy Backend (:8080) + 3 Frontend (:5173, :5174, :5175)
│
├── docs/                                  # Toàn bộ tài liệu dự án
│   ├── Project_1.pdf
│   ├── PRODUCT.md
│   ├── DESIGN.md
│   └── specs/
│       └── 001-tripbuilder-upgrade/
│           └── tasks.md
│
├── TripBuilder-backend/                   # Backend Spring Boot (:8080)
├── TripBuilder-frontend-client/           # Cổng Khách hàng (:5173)
├── TripBuilder-frontend-guide/            # Cổng Tour Guide (:5174)
└── TripBuilder-frontend-admin/            # Cổng Admin Tổng (:5175)
```

---

### 2.2. Cây thư mục `TripBuilder-backend` (Layered Architecture)

```text
TripBuilder-backend/
├── pom.xml
├── mvnw / mvnw.cmd
└── src/
    ├── main/
    │   ├── resources/
    │   │   └── application.properties
    │   └── java/com/tripbuilder/
    │       ├── BackendApplication.java
    │       ├── config/
    │       │   ├── CorsConfig.java                # Cho phép :5173, :5174, :5175
    │       │   ├── WebConfig.java
    │       │   └── DataSeeder.java                # Seed 6 vùng, Tours, Bookings, Khách, Guide & Admin Tổng
    │       ├── security/
    │       │   └── AuthInterceptor.java           # Xác thực Bearer Token & kiểm tra quyền (requireRole)
    │       ├── controller/
    │       │   ├── auth/
    │       │   │   └── AuthController.java        # POST /api/auth/login, POST /api/auth/register, GET /me, GET /demo-accounts
    │       │   ├── tour/
    │       │   │   └── TourController.java
    │       │   ├── booking/
    │       │   │   └── BookingController.java
    │       │   ├── region/
    │       │   │   ├── RegionController.java
    │       │   │   └── PresetOptionController.java
    │       │   ├── favorite/
    │       │   │   └── FavoriteController.java
    │       │   ├── user/
    │       │   │   └── UserController.java
    │       │   ├── admin/
    │       │   │   └── AdminController.java       # GET /api/admin/overview, /users, POST /users, POST/DELETE /preset-options...
    │       │   └── system/
    │       │       └── HelloController.java
    │       ├── service/
    │       │   ├── auth/
    │       │   │   └── AuthService.java
    │       │   ├── tour/
    │       │   │   └── TourService.java
    │       │   ├── booking/
    │       │   │   └── BookingService.java
    │       │   ├── favorite/
    │       │   │   └── FavoriteService.java
    │       │   └── admin/
    │       │       └── AdminService.java
    │       ├── repository/
    │       │   ├── UserRepository.java
    │       │   ├── TourRepository.java
    │       │   ├── BookingRepository.java
    │       │   ├── RegionRepository.java
    │       │   ├── RegionPhotoRepository.java
    │       │   ├── PresetOptionRepository.java
    │       │   └── SavedTourRepository.java
    │       ├── entity/
    │       │   ├── user/
    │       │   │   ├── AppUser.java
    │       │   │   └── Role.java                  # CUSTOMER, GUIDE, ADMIN
    │       │   ├── tour/
    │       │   │   ├── Tour.java
    │       │   │   └── TourStep.java
    │       │   ├── booking/
    │       │   │   ├── Booking.java
    │       │   │   ├── BookingStep.java
    │       │   │   ├── BookingRevision.java
    │       │   │   └── BookingStatus.java
    │       │   ├── region/
    │       │   │   ├── Region.java
    │       │   │   └── RegionPhoto.java
    │       │   ├── catalog/
    │       │   │   └── PresetOption.java
    │       │   └── favorite/
    │       │       └── SavedTour.java
    │       ├── dto/
    │       │   ├── request/                       # LoginRequest, RegisterRequest, AdminUserRequest, PresetOptionRequest...
    │       │   └── response/                      # ApiResponse, UserDto, RegionDto, PhotoItemDto, AdminOverviewDto...
    │       ├── exception/
    │       │   ├── GlobalExceptionHandler.java
    │       │   ├── BadRequestException.java
    │       │   ├── UnauthorizedException.java
    │       │   └── ForbiddenException.java
    │       └── util/
    │           └── Money.java
    └── test/
        └── java/com/tripbuilder/
            └── AuthAndFlowTests.java
```

---

### 2.3. Cây thư mục chuẩn cho cả 3 Frontend (`TripBuilder-frontend-{client,guide,admin}`)

```text
TripBuilder-frontend-<role>/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts                                 # Port riêng: client=5173, guide=5174, admin=5175
└── src/
    ├── assets/
    ├── api/                                       # Tầng gọi API tách theo module
    │   ├── client/
    │   │   └── http.ts                            # Fetch wrapper, Bearer token, 401 handler
    │   ├── auth/
    │   │   └── index.ts                           # authLogin, authRegister (client), authMe, getDemoAccounts
    │   ├── tour/
    │   │   └── index.ts
    │   ├── booking/
    │   │   └── index.ts
    │   ├── region/
    │   │   └── index.ts
    │   ├── admin/                                 # (Riêng cổng Admin Tổng)
    │   │   └── index.ts
    │   ├── types.ts                               # Toàn bộ interface/type dùng chung
    │   └── index.ts                               # Barrel export để import gọn từ '@/api' hoặc './api'
    ├── components/
    │   ├── icons/
    │   │   └── Icon.tsx
    │   └── ui/
    │       ├── SafeImage.tsx
    │       └── TravelPhotoLightbox.tsx            # (hoặc RegionPhotoPicker.tsx ở cổng Guide)
    ├── views/                                     # Tách riêng các màn hình nghiệp vụ lớn
    │   ├── auth/
    │   │   └── LoginPage.tsx                      # Màn Login (Client có thêm tab Đăng ký)
    │   ├── tours/                                 # TourDetailView.tsx (Client) / GuidePresetEditor.tsx (Guide)
    │   ├── bookings/                              # BookingWorkspace.tsx, CustomerCustomizeModal.tsx (Client) / BookingRequoteWorkspace.tsx (Guide)
    │   └── admin/                                 # (Riêng cổng Admin) OverviewView, UsersView, BookingsToursView, CatalogView
    ├── config/
    │   ├── constants/
    │   │   └── meta.ts                            # statusMeta, noteTypeMeta, serviceModeMeta, PORT_URLS
    │   ├── storage/
    │   │   └── auth-storage.ts                    # Key lưu token độc lập cho từng cổng
    │   └── theme.ts
    ├── utils/
    │   └── format.ts                              # formatVnd, resolveMediaUrl
    ├── styles/
    │   └── index.css
    ├── App.tsx
    └── main.tsx
```

---

## 3. Phân Chia Nhiệm Vụ Cho Các Subagent

| Thứ tự | Tên Subagent | Phạm vi thư mục (Scope Lock) | Nhiệm vụ cụ thể |
| :---: | :--- | :--- | :--- |
| **Pha 1** | **Subagent 1**<br>`Workspace & Directory Mover` | Root `Project1_demo/` | 1. Tạo `docs/` và di chuyển `DESIGN.md`, `PRODUCT.md`, `Project_1.pdf`, `specs/` vào `docs/`.<br>2. Đổi tên `backend` -> `TripBuilder-backend`, `web-client` -> `TripBuilder-frontend-client`, `web-admin` -> `TripBuilder-frontend-guide`.<br>3. Khởi tạo thư mục `TripBuilder-frontend-admin` (cấu hình port `:5175`). |
| **Pha 2** | **Subagent 2**<br>`Backend Layered & Admin API` | `TripBuilder-backend/` | 1. Tổ chức lại toàn bộ class Java sang cấu trúc Layered (`config`, `security`, `controller`, `service`, `repository`, `entity`, `dto`, `exception`, `util`).<br>2. Thêm `Role.ADMIN`, seed 2 tài khoản Admin mẫu (`admin@tripbuilder.vn`, `operator@tripbuilder.vn`, pass `123456`).<br>3. Thêm `POST /api/auth/register` cho Khách hàng đăng ký mới.<br>4. Tạo `AdminController` & `AdminService` phục vụ 4 phân hệ của Admin Tổng.<br>5. Cập nhật `AuthAndFlowTests.java` và chạy `.\mvnw.cmd test` đạt 100% PASS. |
| **Pha 2** | **Subagent 3**<br>`Client Portal & Login/Register` | `TripBuilder-frontend-client/` | 1. Tách `src/` thành `api/`, `components/{icons,ui}`, `views/{auth,tours,bookings}`, `config/`, `utils/`, `styles/`.<br>2. Nâng cấp `views/auth/LoginPage.tsx`: Chọn nhanh Khách mẫu 1-chạm + Tab Đăng nhập Email/Pass + **Tab Đăng ký tài khoản Khách mới** + Link sang Cổng Guide & Admin.<br>3. Gỡ bỏ `DemoSwitcherBar` bên trong `App.tsx`, giữ nút **Đăng xuất** trên Header. Chạy `npm run build` PASS. |
| **Pha 2** | **Subagent 4**<br>`Guide Portal Restructure` | `TripBuilder-frontend-guide/` | 1. Tách `src/` của cổng Tour Guide (`:5174`) thành `api/`, `components/{icons,ui}`, `views/{auth,bookings,tours}`, `config/`, `utils/`, `styles/`.<br>2. Cập nhật `views/auth/LoginPage.tsx` dành riêng cho `Role.GUIDE` (Chọn nhanh 1-chạm 3 Guide mẫu + Form đăng nhập + Link mở Cổng Khách & Cổng Admin Tổng).<br>3. Gỡ bỏ `DemoSwitcherBar` bên trong `App.tsx`, dùng nút **Đăng xuất** chuẩn. Chạy `npm run build` PASS. |
| **Pha 2** | **Subagent 5**<br>`System Admin Portal (:5175)` | `TripBuilder-frontend-admin/` | 1. Xây dựng cổng Admin Tổng trên port `:5175` theo đúng cây thư mục chuẩn CNPM.<br>2. Xây dựng `views/auth/LoginPage.tsx` cho `Role.ADMIN` (Chọn nhanh 1-chạm tài khoản Admin Tổng + Form đăng nhập).<br>3. Xây dựng 4 phân hệ sau đăng nhập: **Tổng quan KPI toàn sàn**, **Quản lý User (Khách & Guide)**, **Giám sát toàn bộ Tour & Booking**, **Quản lý Vùng & Kho dịch vụ (`PresetOption`)**.<br>4. Chạy `npm run build` PASS. |
| **Pha 3** | **Subagent 6**<br>`Integration & Launcher QA` | `run-all.bat`, `README.md` | 1. Cập nhật `run-all.bat` (và xóa `run.bat` cũ) để khởi chạy Backend (`:8080`) + 3 Frontend (`:5173`, `:5174`, `:5175`).<br>2. Cập nhật `README.md` mô tả đầy đủ kiến trúc 3 cổng, danh sách tài khoản mẫu của cả 3 vai trò và cấu trúc thư mục mới.<br>3. Kiểm tra toàn bộ build & test của cả 4 project. |
