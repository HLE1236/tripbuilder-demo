# TripBuilder

Nền tảng kết nối **Khách hàng** đặt tour cá nhân hoá với **Tour Guide bản địa** báo giá thực tế theo từng vòng trao đổi, kèm **Cổng Admin Tổng** điều hành toàn hệ thống.

## Kiến trúc 1 Backend + 3 Frontend (Chuẩn CNPM)

| Thành phần | Thư mục | URL | Vai trò (`Role`) | Chức năng chính |
| :--- | :--- | :--- | :---: | :--- |
| **Backend API** | `TripBuilder-backend` | `http://localhost:8080` | `CUSTOMER` · `GUIDE` · `ADMIN` | Spring Boot 4 + JPA (H2 mặc định), Bearer Token RBAC |
| **Cổng Khách hàng** | `TripBuilder-frontend-client` | `http://localhost:5173` | `CUSTOMER` | Đăng nhập / Đăng ký · Khám phá tour · Tuỳ chỉnh chặng · Đối chiếu báo giá · Chốt chuyến |
| **Cổng Tour Guide** | `TripBuilder-frontend-guide` | `http://localhost:5174` | `GUIDE` | Đăng nhập Guide · Bảng điều phối & Báo giá lại từng dòng · Quản lý Tour mẫu |
| **Cổng Admin Tổng** | `TripBuilder-frontend-admin` | `http://localhost:5175` | `ADMIN` | Đăng nhập Admin · KPI toàn sàn · Quản lý User · Giám sát Tour & Đơn · Quản lý Vùng & Kho dịch vụ |

## Cấu trúc thư mục

```text
Project1_demo/
├── docs/                          # Tài liệu đề bài, PRODUCT.md, DESIGN.md, specs/
├── TripBuilder-backend/           # Spring Boot (Layered: config, security, controller, service, repository, entity, dto, exception, util)
├── TripBuilder-frontend-client/   # React + Vite (:5173)
├── TripBuilder-frontend-guide/    # React + Vite (:5174)
├── TripBuilder-frontend-admin/    # React + Vite (:5175)
├── PLAN_RESTRUCTURE.md            # Kế hoạch tái cấu trúc & phân công Subagents
└── run-all.bat                    # Script khởi chạy đồng bộ 4 service trên Windows
```

## Tài khoản demo (Mật khẩu chung: `123456`)

- **Khách hàng (`:5173`)**: `an.nguyen@gmail.com`, `hoa.do@gmail.com`, `khoa.hoang@gmail.com` *(hoặc tự đăng ký tài khoản mới trực tiếp trên màn Login)*
- **Tour Guide (`:5174`)**: `binh.guide@tripbuilder.vn`, `chi.guide@tripbuilder.vn`, `dung.guide@tripbuilder.vn`
- **Admin Tổng (`:5175`)**: `admin@tripbuilder.vn`, `operator@tripbuilder.vn`

## Khởi chạy nhanh (Windows)

```bat
run-all.bat
```

Hoặc chạy từng terminal riêng lẻ:

```powershell
cd TripBuilder-backend; .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2
cd TripBuilder-frontend-client; npm run dev
cd TripBuilder-frontend-guide; npm run dev
cd TripBuilder-frontend-admin; npm run dev
```
