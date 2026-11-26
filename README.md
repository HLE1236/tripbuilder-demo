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

## Dữ liệu mẫu & Tài khoản demo (Mật khẩu chung: `123456`)

- **Dữ liệu seed sẵn:** 12 vùng điểm đến (Hạ Long, Đà Lạt, Hội An, Sa Pa, Phú Quốc, Huế, Ninh Bình, Hà Giang, Mộc Châu, Nha Trang, Quy Nhơn, Côn Đảo), 24 Tour Guide (đúng 2 Guide/vùng, mỗi Guide chỉ tạo tour tại vùng của mình), 48 Tour mẫu, 12 Khách hàng, 34 đơn đặt tour đủ mọi trạng thái.
- **Khách hàng (`:5173`)**: `an.nguyen@gmail.com`, `hoa.do@gmail.com`, `khoa.hoang@gmail.com` *(cùng 9 tài khoản khách bổ sung hoặc tự đăng ký mới trực tiếp trên màn Login)*
- **Tour Guide (`:5174`)**: 6 tài khoản chọn nhanh `binh.guide@tripbuilder.vn`, `chi.guide@tripbuilder.vn`, `dung.guide@tripbuilder.vn`, `minh.guide@tripbuilder.vn`, `nam.guide@tripbuilder.vn`, `thao.guide@tripbuilder.vn` *(cùng 18 Guide khác theo 12 vùng)*
- **Admin Tổng (`:5175`)**: `admin@tripbuilder.vn`, `operator@tripbuilder.vn`

## Reset DB demo (H2 local)

Dừng Backend (`:8080`), sau đó xoá thư mục `TripBuilder-backend/data` và chạy lại Backend với profile `h2` để seed lại từ đầu:

```powershell
Remove-Item -Recurse -Force d:\2026.1\Project1_demo\TripBuilder-backend\data
```

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
