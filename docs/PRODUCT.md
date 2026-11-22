# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Khách du lịch Việt Nam (Customer):** người dùng phổ thông, không rành công nghệ. Họ xem các tour do hướng dẫn viên bản địa đăng, giữ nguyên lịch trình chuẩn hoặc đổi khách sạn / bỏ / thêm hoạt động, rồi chờ báo giá và đồng ý chốt.
- **Hướng dẫn viên bản địa (Tour Guide):** đăng tour có sẵn lịch trình theo ngày và đơn giá từng mục; nhận yêu cầu tuỳ chỉnh, điền giá cho mục khách tự thêm, giảm giá hoặc phụ thu cho đoàn, gửi báo giá chốt.
- **Người chấm demo (giảng viên):** xem sinh viên trình bày toàn bộ kịch bản trên laptop 13–15 inch, đôi khi chiếu lên máy chiếu. Cần nhìn là hiểu đang ở bước nào, ai làm gì.

## Product Purpose

TripBuilder là bản demo đồ án sinh viên (2 tuần) cho một kịch bản hoàn chỉnh: Guide đăng tour → Khách đặt → Khách chỉnh sửa theo ý muốn → Guide báo giá lại → Khách đồng ý. Thành công nghĩa là người chấm theo dõi được trọn vòng 4 bước trên một màn hình, dữ liệu đầy đủ, không bấm sai.

## Positioning

Tour không phải gói cứng: mỗi tour là một lịch trình chuẩn do người địa phương soạn, khách được đổi từng mục ngay trên lịch trình đó và thấy rõ chênh lệch giá trước/sau, còn Guide báo giá lại từng dòng thay vì đưa một con số chung.

## Operating Context

- Một trang web duy nhất, có thanh demo để chuyển vai Khách ↔ Guide và tự đồng bộ đúng tài khoản của đơn đang xem.
- Luồng 4 bước: `BOOKED_ORIGINAL` → `WAITING_REQUOTE` → `REQUOTED` → `CONFIRMED` (có thể `CANCELLED`).
- Loại dòng lịch trình: `PRESET`, `MODIFIED` (đã đổi), `REMOVED` (đã bỏ, 0đ), `CUSTOM` (khách tự thêm, chờ giá), `GUIDE` (Guide đã báo giá).
- Dữ liệu mẫu: 6 vùng (Hạ Long, Đà Lạt, Hội An, Sa Pa, Phú Quốc, Huế), nhiều Guide và Khách, 4 đơn mẫu BK-0001…BK-0004.

## Capabilities and Constraints

- Stack có sẵn: Spring Boot + H2 (backend), React 19 + Vite + Tailwind CSS v4 (`web-client`, `web-admin` dùng chung mã nguồn).
- Không thêm thư viện JS mới. Được dùng Google Fonts (phải hỗ trợ tiếng Việt có dấu) và chuyển động CSS nhẹ.
- Cần hỗ trợ chế độ sáng và tối.
- Toàn bộ giao diện bằng tiếng Việt; tiền tệ định dạng `1.234.000đ`.
- Không có hệ thống đăng nhập thật; chọn tài khoản mẫu trên thanh demo.

## Brand Commitments

- Tên: **TripBuilder**.
- Giọng văn: tiếng Việt thân thiện, rõ ràng, hướng dẫn từng bước; tránh thuật ngữ kỹ thuật.
- Cảm giác người dùng chọn: ấm áp, bản địa, gần gũi, gợi Việt Nam.

## Evidence on Hand

- Ảnh tour/vùng lấy từ URL Unsplash trong dữ liệu seed (`backend/src/main/java/com/tripbuilder/config/DataSeeder.java`).
- Không có đánh giá, số liệu khách hàng hay đối tác thật — không được bịa.

## Product Principles

1. Chọn một chạm, nhìn là hiểu, không thể bấm sai.
2. Luôn cho thấy trước/sau: giá gốc, mục đã đổi/bỏ/thêm, ưu đãi, tổng cuối.
3. Mỗi màn hình nói rõ "việc tiếp theo cần làm" và ai phải làm.
4. Người địa phương là trung tâm: Guide hiện diện rõ trên tour và báo giá.

## Accessibility & Inclusion

Chữ đủ lớn và tương phản cao để đọc được trên máy chiếu; mọi thao tác dùng được bằng bàn phím; tôn trọng `prefers-reduced-motion`.
