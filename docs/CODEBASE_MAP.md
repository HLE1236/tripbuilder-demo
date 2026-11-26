# Bản Đồ Kiến Trúc & Chỉ Dẫn Sửa Đổi Codebase (`CODEBASE_MAP.md`)

> Tài liệu chuẩn (thay thế cho `PLAN_RESTRUCTURE.md` cũ) dùng để điều phối subagent sửa đúng module cần thiết mà không cần đọc toàn bộ dự án.

---

## 1. Cấu trúc tổng thể & Quy ước tầng

```text
Project1_demo/
├── AGENTS.md                        # Quy tắc điều phối ngắn gọn cho AI agents
├── README.md                        # Hướng dẫn tổng quan & khởi chạy
├── run-all.bat                      # Khởi chạy đồng bộ BE (:8080) + 3 FE (:5173/:5174/:5175)
├── docs/
│   ├── CODEBASE_MAP.md              # [File này] Bản đồ thư mục, tính năng & API
│   ├── DESIGN.md / PRODUCT.md       # Tài liệu thiết kế UI/UX & sản phẩm
│   └── specs/                       # Tài liệu spec
├── TripBuilder-backend/             # Spring Boot 4 REST API (:8080)
├── TripBuilder-frontend-client/     # Cổng Khách hàng (:5173)
├── TripBuilder-frontend-guide/      # Cổng Tour Guide (:5174)
└── TripBuilder-frontend-admin/      # Cổng Admin Tổng (:5175)
```

---

## 2. Cây thư mục từng Project

### 2.1. `TripBuilder-backend/src/main/java/com/tripbuilder/`

```text
com/tripbuilder/
├── BackendApplication.java
├── config/
│   ├── CorsConfig.java                  # CORS cho :5173, :5174, :5175
│   ├── DataSeeder.java                  # [~66KB] Seed regions, photos, options, users, tours, bookings
│   └── WebConfig.java                   # Đăng ký AuthInterceptor & static resources (/images/**)
├── security/
│   └── AuthInterceptor.java             # Whitelist public endpoints, xác thực Bearer token
├── controller/
│   ├── admin/AdminController.java       # /api/admin/** (overview, users, tours, bookings, preset-options)
│   ├── auth/AuthController.java         # /api/auth/** (login, register, refresh, logout, forgot/reset, me, profile)
│   ├── booking/BookingController.java   # /api/bookings/** (CRUD + customize, accept, requote, confirm, reject-change, complete, cancel, review)
│   ├── favorite/FavoriteController.java # /api/favorites/**
│   ├── notification/NotificationController.java # /api/notifications/**
│   ├── region/RegionController.java     # /api/regions/**
│   ├── system/HelloController.java      # /api/hello
│   └── tour/
│       ├── PresetOptionController.java  # /api/options
│       └── TourController.java          # /api/tours/**
├── service/
│   ├── admin/AdminService.java          # KPI overview, CRUD user/guide, quản lý catalog PresetOption, điều phối
│   ├── auth/AuthService.java            # Hash mật khẩu, token/refresh token, OTP quên mật khẩu
│   ├── booking/BookingService.java      # [~56KB] Toàn bộ vòng đời đặt tour, tính tiền, báo giá lại, huỷ, review
│   ├── catalog/PresetOptionService.java # Lấy kho dịch vụ theo vùng
│   ├── favorite/FavoriteService.java    # Tour đã lưu
│   ├── notification/NotificationService.java # Thông báo cho user
│   ├── region/RegionService.java        # Danh sách vùng & thư viện ảnh
│   └── tour/TourService.java            # CRUD tour preset của Guide, filter & search
├── repository/                          # Spring Data JPA: Booking, Notification, PasswordResetOtp, PresetOption, RefreshToken, RegionPhoto, Region, SavedTour, Tour, User
├── entity/
│   ├── auth/      (PasswordResetOtp, RefreshToken)
│   ├── booking/   (Booking, BookingRevision, BookingStatus, BookingStep)
│   ├── catalog/   (PresetOption)
│   ├── favorite/  (SavedTour)
│   ├── notification/ (Notification)
│   ├── region/    (Region, RegionPhoto)
│   ├── tour/      (Tour, TourStep)
│   └── user/      (AppUser, Role)
├── dto/
│   ├── request/{admin,auth,booking,tour}/*.java
│   └── response/{ApiResponse,admin,auth,booking,catalog,notification,region,system,tour,user}/*.java
├── exception/ (BadRequestException, ForbiddenException, UnauthorizedException, GlobalExceptionHandler)
└── util/      (Money, VietnameseTextUtil)
```

- **Resources & Tests:**
  - `src/main/resources/application.properties`, `application-h2.properties`
  - `src/main/resources/static/images/` (`activities/`, `avatars/`, `tours/<region>/`, `manifest.json`)
  - `src/test/java/com/tripbuilder/`: `AuthAndFlowTests.java` (~50KB), `AuthSecurityAndSearchTests.java`, `BackendApplicationTests.java`

---

### 2.2. Kiến trúc chuẩn cho 3 Frontend (`TripBuilder-frontend-{client,guide,admin}/src/`)

Cả 3 frontend dùng cùng mô hình phân tầng:

| Tầng | Đường dẫn | Trách nhiệm |
| :--- | :--- | :--- |
| **API Layer** | `src/api/{client,interceptor,types,index}.ts` & `src/api/<domain>/*.api.ts` | Gọi HTTP qua axios instance, gắn Bearer token & auto-refresh 401 |
| **Query Hooks** | `src/hooks/api/use*Queries.ts` | Bọc TanStack Query (`useQuery`, `useMutation`, `queryKeys`) |
| **Feature Hooks** | `src/hooks/use*.ts` | State nghiệp vụ của từng màn hình/modal (form, filter, submit) |
| **Zustand Stores** | `src/stores/useAuthStore.ts`, `use*UiStore.ts`, `useThemeStore.ts` | Phiên đăng nhập, modal state, filter UI, dark/light theme |
| **Views** | `src/views/<feature>/*.tsx` | Các màn hình/workspace chính |
| **Components** | `src/components/{auth,ui,icon}/` | Modal Auth (`client`), `SafeImage`, `NotificationBell`, `ErrorBoundary`, `components/icon/*` (chỉ import qua `components/icon/index.ts`, không cần mở từng icon) |
| **Config & Utils** | `src/config/{constants/meta.ts,storage/auth-storage.ts,query-client.ts,theme.ts}`, `src/utils/` | Metadata trạng thái, localStorage key riêng theo cổng, format tiền/ngày |

#### Chi tiết file đặc thù từng cổng:
- **Client (`:5173`):**
  - `App.tsx` (~50KB): Router, catalog, hero, header, gọi `CustomerCustomizeModal`, `AuthModal`, `TravelPhotoLightbox`
  - `views/`: `auth/LoginPage.tsx`, `tours/TourDetailView.tsx`, `bookings/BookingWorkspace.tsx`, `bookings/CustomerCustomizeModal.tsx` (~59KB), `profile/ProfileView.tsx`
  - `components/auth/`: `AuthModal.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `TermsModal.tsx`, `PasswordInput.tsx`, `PasswordStrengthMeter.tsx`
  - `hooks/`: `useClientPortal.ts`, `useCustomerCustomize.ts`, `useBookingWorkspace.ts`, `useTourDetail.ts`, `useLoginForm.ts`
- **Guide (`:5174`):**
  - `App.tsx`: Shell cổng Guide, danh sách booking & tab quản lý Tour mẫu
  - `views/`: `auth/LoginPage.tsx`, `bookings/BookingRequoteWorkspace.tsx` (~54KB), `tours/GuidePresetEditor.tsx` (~30KB)
  - `components/ui/RegionPhotoPicker.tsx`
  - `hooks/`: `useGuidePortal.ts`, `useBookingRequote.ts`, `useGuidePresetEditor.ts`, `useLoginForm.ts`
- **Admin (`:5175`):**
  - `App.tsx`: Shell 4 tab quản trị
  - `views/`: `auth/LoginPage.tsx`, `admin/OverviewView.tsx`, `admin/UsersView.tsx`, `admin/OperationsView.tsx`, `admin/CatalogView.tsx`
  - `hooks/`: `useAdminPortal.ts`, `useUsersManager.ts`, `useOperationsManager.ts`, `useCatalogManager.ts`, `useLoginForm.ts`

---

## 3. Bảng tra cứu: "Muốn sửa X → Mở file nào?"

| Tính năng / Bug cần xử lý | Backend files | Frontend files |
| :--- | :--- | :--- |
| **Đăng nhập / Đăng ký / Quên MK (Client modal & page)** | `controller/auth/AuthController.java`, `service/auth/AuthService.java`, `security/AuthInterceptor.java` | Client: `components/auth/{AuthModal,LoginForm,RegisterForm,ForgotPasswordForm,TermsModal}.tsx`, `stores/useAuthStore.ts`, `hooks/useClientPortal.ts` |
| **Chọn chuyến & Tuỳ chỉnh lịch trình (Client)** | `controller/booking/BookingController.java`, `service/booking/BookingService.java` (`create`, `customize`) | Client: `views/bookings/CustomerCustomizeModal.tsx`, `hooks/useCustomerCustomize.ts`, `hooks/useClientPortal.ts` (`requireAuthForBookingSubmit`, `handleAuthSuccess`) |
| **Chi tiết đơn & Chốt / Huỷ / Đánh giá (Client)** | `service/booking/BookingService.java` (`confirm`, `rejectChange`, `cancel`, `addReview`) | Client: `views/bookings/BookingWorkspace.tsx`, `hooks/useBookingWorkspace.ts` |
| **Khám phá Tour / Yêu thích / Chi tiết Tour** | `controller/tour/TourController.java`, `service/tour/TourService.java`, `service/favorite/FavoriteService.java` | Client: `App.tsx`, `views/tours/TourDetailView.tsx`, `hooks/useClientPortal.ts`, `utils/search.ts` |
| **Guide tạo/sửa Tour mẫu & Khoá vùng bản địa** | `service/tour/TourService.java` (`create`, `update`), `controller/tour/TourController.java` | Guide: `views/tours/GuidePresetEditor.tsx`, `hooks/useGuidePresetEditor.ts`, `components/ui/RegionPhotoPicker.tsx` |
| **Guide nhận đơn & Báo giá lại từng chặng** | `service/booking/BookingService.java` (`accept`, `requote`, `complete`) | Guide: `views/bookings/BookingRequoteWorkspace.tsx`, `hooks/useBookingRequote.ts` |
| **Admin: Quản lý User & Ràng buộc vùng của Guide** | `controller/admin/AdminController.java`, `service/admin/AdminService.java` (`createUser`, `updateUser`, `deleteUser`) | Admin: `views/admin/UsersView.tsx`, `hooks/useUsersManager.ts` |
| **Admin: Điều phối đơn & Đổi Guide (cùng vùng)** | `service/admin/AdminService.java` (`reassignGuide`), `service/booking/BookingService.java` (`reassignGuide`) | Admin: `views/admin/OperationsView.tsx`, `hooks/useOperationsManager.ts` |
| **Admin: Kho dịch vụ `PresetOption` & Vùng** | `service/admin/AdminService.java` (`createPresetOption`, `updatePresetOption`, `deletePresetOption`) | Admin: `views/admin/CatalogView.tsx`, `hooks/useCatalogManager.ts` |
| **Dữ liệu mẫu (12 Regions, 107 Photos, 24 Guides, 48 Tours, 34 Bookings)** | `config/DataSeeder.java`, `resources/static/images/manifest.json`, `src/test/java/com/tripbuilder/AuthAndFlowTests.java` | Không cần sửa FE |
| **Thông báo chuông (Notifications)** | `controller/notification/NotificationController.java`, `service/notification/NotificationService.java` | Client & Guide: `components/ui/NotificationBell.tsx`, `hooks/api/useNotificationQueries.ts` |

### Quy mô & Ràng buộc dữ liệu Seed (`DataSeeder.java`)

- **12 Vùng điểm đến:** Vịnh Hạ Long (`ha-long`), Đà Lạt (`da-lat`), Phố cổ Hội An (`hoi-an`), Sa Pa (`sa-pa`), Phú Quốc (`phu-quoc`), Cố đô Huế (`hue`), Ninh Bình (`ninh-binh`), Hà Giang (`ha-giang`), Mộc Châu (`moc-chau`), Nha Trang (`nha-trang`), Quy Nhơn (`quy-nhon`), Côn Đảo (`con-dao`).
- **24 Tour Guide (đúng 2 Guide / vùng):** Mỗi tài khoản Guide gắn bắt buộc với 1 `Region` (`TourService.create/update` luôn ép `tour.region = guide.region`; `AdminService.updateUser` cấm đổi vùng Guide đã có tour; `BookingService.reassignGuide` chỉ chuyển sang Guide cùng vùng).
- **48 Tour mẫu** (mỗi Guide 2 tour đúng vùng của mình), **12 Khách hàng**, **34 Booking** phủ đủ 7 `BookingStatus` (`BOOKED_ORIGINAL`, `WAITING_REQUOTE`, `REQUOTED`, `CONFIRMED`, `CHANGE_REQUESTED`, `COMPLETED`, `CANCELLED`), **10 đánh giá**, **107 ảnh** (`6` ảnh dùng chung + `66` ảnh local + `35` ảnh Wikimedia Commons cho 6 vùng mới).

---

## 4. Bản đồ REST API Endpoints

- **Auth (`/api/auth`)** → `AuthController` → `AuthService`:
  - `POST /login`, `POST /register`, `POST /refresh`, `POST /logout`
  - `POST /forgot-password`, `POST /reset-password`
  - `GET /me`, `PUT /profile`, `POST /change-password`, `GET /demo-accounts?role=...`
- **Regions & Options (`/api/regions`, `/api/options`)** → `RegionController`, `PresetOptionController`:
  - `GET /api/regions`, `GET /api/regions/{id}/photos`, `GET /api/regions/photos?category=...`
  - `GET /api/options?regionId=...`
- **Tours (`/api/tours`)** → `TourController` → `TourService`:
  - `GET /api/tours` (filter `guideId`, `regionId`, `minDays`, `maxDays`, `q`, `sort`, `includeInactive`), `GET /api/tours/{id}`
  - `POST /api/tours`, `PUT /api/tours/{id}`, `PATCH /api/tours/{id}/status`, `DELETE /api/tours/{id}` (GUIDE / ADMIN)
- **Bookings (`/api/bookings`)** → `BookingController` → `BookingService`:
  - `GET /api/bookings`, `GET /api/bookings/{id}`, `POST /api/bookings`
  - `PUT /api/bookings/{id}/customize`, `POST /api/bookings/{id}/accept`, `PUT /api/bookings/{id}/requote`
  - `POST /api/bookings/{id}/confirm`, `POST /api/bookings/{id}/reject-change`, `POST /api/bookings/{id}/complete`, `POST /api/bookings/{id}/cancel`, `POST /api/bookings/{id}/review`
- **Favorites & Notifications**:
  - `GET /api/favorites`, `POST /api/favorites/{tourId}`, `DELETE /api/favorites/{tourId}`
  - `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`
- **Admin (`/api/admin`)** → `AdminController` → `AdminService` (chỉ `ADMIN`):
  - `GET /overview`
  - `GET /users`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}`
  - `GET /tours`, `GET /bookings`, `PUT /bookings/{id}/reassign`
  - `GET /preset-options`, `POST /preset-options`, `PUT /preset-options/{id}`, `DELETE /preset-options/{id}`

---

## 5. Quy trình chuẩn: Thêm 1 API mới End-to-End

1. **Backend:**
   - Thêm DTO trong `dto/request/<domain>/` và/hoặc `dto/response/<domain>/`.
   - Cài đặt logic & check quyền (`Role`, ownership) trong `service/<domain>/`.
   - Khai báo endpoint trong `controller/<domain>/` (trả về `ApiResponse.ok(...)`).
   - Nếu là endpoint public, cập nhật `AuthInterceptor.java`; nếu cần test, thêm case trong `src/test/java/com/tripbuilder/`.
2. **Frontend (ở cổng tương ứng):**
   - Khai báo type trong `src/api/types.ts`.
   - Tạo `src/api/<domain>/<action>.api.ts` và export qua `src/api/<domain>/index.ts` + `src/api/index.ts`.
   - Thêm query/mutation hook trong `src/hooks/api/use*Queries.ts` (nhớ `invalidateQueries`).
   - Gắn vào feature hook `src/hooks/use*.ts` và UI `src/views/...`.

---

## 6. Template giao việc cho Subagent

```markdown
- **Mục tiêu:** [Mô tả ngắn gọn yêu cầu]
- **Scope Lock (CHỈ được sửa trong):** [Liệt kê chính xác 2-5 file từ Bảng mục 3]
- **Ngữ cảnh cần đọc:** [Tên hàm hoặc dòng cần đọc — không đọc cả repo]
- **Verify Command:** [.\mvnw.cmd test | npm run build]
- **Definition of Done:** [Tiêu chí hoàn thành + không vỡ UTF-8 + không tạo file ngoài scope]
```
