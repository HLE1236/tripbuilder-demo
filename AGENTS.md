# AGENTS.md — Hướng dẫn điều phối Subagent dự án TripBuilder

> Tài liệu khởi đầu cho mọi AI agent / subagent làm việc trên `d:\2026.1\Project1_demo`.
> **Nguyên tắc vàng:** KHÔNG đọc toàn bộ dự án. Tra [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md) để định vị đúng file theo tính năng, chỉ đọc/sửa các file trong phạm vi được giao.

## 1. Tổng quan kiến trúc (1 Backend + 3 Frontend)

| Thành phần | Thư mục | Port | Vai trò (`Role`) | Tech Stack |
| :--- | :--- | :---: | :--- | :--- |
| **Backend API** | `TripBuilder-backend/` | `:8080` | `CUSTOMER` · `GUIDE` · `ADMIN` | Spring Boot 4, Java, JPA, H2 (`./data/tripbuilder`) / SQL Server |
| **Cổng Khách hàng** | `TripBuilder-frontend-client/` | `:5173` | `CUSTOMER` | React 19, Vite 8, TS, Tailwind v4, TanStack Query, Zustand |
| **Cổng Tour Guide** | `TripBuilder-frontend-guide/` | `:5174` | `GUIDE` | React 19, Vite 8, TS, Tailwind v4, TanStack Query, Zustand |
| **Cổng Admin Tổng** | `TripBuilder-frontend-admin/` | `:5175` | `ADMIN` | React 19, Vite 8, TS, Tailwind v4, TanStack Query, Zustand |

## 2. Quy tắc làm việc cho Subagent

1. **Tra cứu trước khi đọc:** Đọc bảng *"Muốn sửa X → Mở file nào"* trong `docs/CODEBASE_MAP.md`. Không quét mù toàn bộ repo.
2. **File dung lượng lớn (>35KB) — dùng `grep`/`rg` theo tên hàm, không đọc cả file:**
   - `DataSeeder.java` (~66KB), `BookingService.java` (~56KB), `CustomerCustomizeModal.tsx` (~59KB), `BookingRequoteWorkspace.tsx` (~54KB), `App.tsx` client (~50KB).
3. **Encoding UTF-8 bắt buộc:** Toàn bộ Java/TSX dùng tiếng Việt có dấu UTF-8.
   - **CẤM** dùng PowerShell `Set-Content` / `Out-File` mặc định để sửa code (gây hỏng dấu tiếng Việt).
   - Khi đọc bằng PowerShell phải thêm `-Encoding UTF8`. Luôn sửa file bằng `edit_file` / `write_file`.
4. **Cẩn thận Git working tree:** Chỉ sửa file liên quan trực tiếp đến nhiệm vụ. Không revert/stash các thay đổi đang có sẵn nếu không được yêu cầu.

## 3. Quy tắc nghiệp vụ cốt lõi (Bất biến)

- **1 Guide bản địa = đúng 1 Vùng (`Region`):**
  - Tài khoản `GUIDE` bắt buộc gắn với 1 `Region`.
  - Khi tạo/sửa `Tour`, Backend luôn gắn `region` của `Tour` theo `guide.region` (không cho Guide tạo tour ở vùng khác).
  - Admin không được đổi `region` của Guide đã có tour; điều phối/chuyển đơn (`reassignGuide`) chỉ được chuyển cho Guide cùng `region` với Tour của đơn.
- **State Machine của Booking (`BookingStatus`):**
  - `BOOKED_ORIGINAL` → (tuỳ chỉnh) `WAITING_REQUOTE` → (Guide báo giá) `REQUOTED` → (Khách chốt) `CONFIRMED` → (Admin/Guide hoàn tất) `COMPLETED`.
  - Sau khi `CONFIRMED`, khách gửi điều chỉnh sẽ chuyển `CHANGE_REQUESTED` → Guide báo giá lại → `REQUOTED` → khách xác nhận hoặc `reject-change` (khôi phục snapshot đã chốt).
  - Huỷ đơn → `CANCELLED` (từ các trạng thái chưa hoàn thành).
- **RBAC & Auth (`AuthInterceptor`):**
  - Public: `/api/hello`, `/api/system/**`, `/api/regions/**`, `/api/options/**`, `GET /api/tours/**`, `/api/auth/{login,register,refresh,logout,forgot-password,reset-password,demo-accounts}`.
  - Mọi endpoint khác yêu cầu Bearer token hợp lệ và check role tại Service/Controller.
- **Z-index / Top Layer trên Client (`:5173`):**
  - `CustomerCustomizeModal` dùng `@astryxdesign/core` `<Dialog>` (native `<dialog>.showModal()`). Mọi modal mở đè lên trên nó (như `AuthModal`, `TermsModal`) **phải** dùng native `<dialog>.showModal()` để nằm trên cùng browser top layer.

## 4. Lệnh Verify & Vận hành

```powershell
# Backend test (dùng H2 in-memory tự động, chạy DataSeeder)
cd d:\2026.1\Project1_demo\TripBuilder-backend; .\mvnw.cmd test

# Chạy Backend local profile H2 (tạo/đọc DB tại TripBuilder-backend/data/)
cd d:\2026.1\Project1_demo\TripBuilder-backend; .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=h2"

# Reset DB demo H2 (dừng backend trước khi xoá)
Remove-Item -Recurse -Force d:\2026.1\Project1_demo\TripBuilder-backend\data

# Build & lint từng Frontend
cd d:\2026.1\Project1_demo\TripBuilder-frontend-client; npm run build
cd d:\2026.1\Project1_demo\TripBuilder-frontend-guide; npm run build
cd d:\2026.1\Project1_demo\TripBuilder-frontend-admin; npm run build
```

## 5. Dữ liệu mẫu & Tài khoản Demo nhanh (Mật khẩu chung: `123456`)

- **Quy mô seed mặc định (`DataSeeder`):** 12 vùng điểm đến · 24 Tour Guide (2 Guide/vùng) · 12 Khách hàng · 48 Tour mẫu · 34 Booking đủ 7 trạng thái · 107 ảnh địa danh & dịch vụ.
- **Client (`:5173`):** `an.nguyen@gmail.com`, `hoa.do@gmail.com`, `khoa.hoang@gmail.com` *(hoặc tự đăng ký; + 9 khách bổ sung như `phuong.tran@gmail.com`, `duc.pham@gmail.com`...)*
- **Tour Guide (`:5174`):** 6 tài khoản chọn nhanh: `binh.guide@tripbuilder.vn` (Hạ Long), `chi.guide@tripbuilder.vn` (Đà Lạt), `dung.guide@tripbuilder.vn` (Hội An), `minh.guide@tripbuilder.vn` (Sa Pa), `nam.guide@tripbuilder.vn` (Phú Quốc), `thao.guide@tripbuilder.vn` (Huế) *(+ 18 Guide khác theo từng vùng, xem `DataSeeder.java`)*
- **Admin Tổng (`:5175`):** `admin@tripbuilder.vn`, `operator@tripbuilder.vn`
