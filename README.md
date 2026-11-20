# TripBuilder

Nền tảng kết nối **Khách hàng** đặt tour cá nhân hoá với **Tour Guide bản địa** báo giá thực tế theo từng vòng trao đổi.

## Kiến trúc 2 cổng tách biệt + Phân quyền (RBAC)

| Thành phần | URL | Vai trò |
| :--- | :--- | :--- |
| **Backend** | `http://localhost:8080` | Spring Boot 4 + JPA (H2 mặc định) · Token auth Bearer (`401`/`403`) |
| **Cổng Khách hàng** (`web-client`) | `http://localhost:5173` | Đăng nhập Khách · Khám phá tour · Tuỳ chỉnh chặng · Theo dõi báo giá · Chốt chuyến |
| **Cổng Tour Guide** (`web-admin`) | `http://localhost:5174` | Đăng nhập Guide · Tổng quan KPI · Bảng xử lý đơn & Báo giá lại · Quản lý Tour mẫu (`v1` -> `v2`) |

## Tài khoản demo (mật khẩu chung: `123456`)

- **Khách hàng (`:5173`)**: `an.nguyen@gmail.com`, `hoa.do@gmail.com`, `khoa.hoang@gmail.com`
- **Tour Guide (`:5174`)**: `binh.guide@tripbuilder.vn`, `chi.guide@tripbuilder.vn`, `dung.guide@tripbuilder.vn`

## Quy trình nghiệp vụ "Nếu có điều chỉnh về tour"

1. **Thương lượng nhiều vòng (`REQUOTED` <-> `WAITING_REQUOTE`)**: Khách có thể tiếp tục điều chỉnh sau khi Guide báo giá lại; hệ thống lưu toàn bộ `BookingRevision` theo từng vòng.
2. **Điều chỉnh sau khi đã chốt (`CONFIRMED` -> `CHANGE_REQUESTED` -> `REQUOTED` -> `CONFIRMED`)**: Vẫn giữ `confirmedTotalPrice` để đối chiếu chênh lệch sau chốt.
3. **Phiên bản Tour mẫu (`Tour.version`)**: Khi Guide sửa tour mẫu (`v1` -> `v2`), các đơn khách đã đặt giữ nguyên bản chụp `tourTitleSnapshot`, `tourVersionSnapshot` và đơn giá lúc đặt.

## Khởi chạy nhanh (Windows)

```bat
run.bat
```

Hoặc chạy từng terminal:

```powershell
cd backend; .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2
cd web-client; npm run dev
cd web-admin; npm run dev
```
