# TripBuilder — Kịch bản Demo Hoàn chỉnh

Nền tảng kết nối **Du khách đi tự túc** với **Hướng dẫn viên bản địa (Local Tour Guide)**.

> **Kịch bản chuẩn:**
> **1. Ông Tour Guide đăng 1 Tour Preset** (có sẵn lịch trình theo ngày & Giá gốc/khách; có thể chỉnh sửa lại Tour Preset bất cứ lúc nào)
> $\rightarrow$ **2. Ông Khách hàng bấm vào Tour, tự chỉnh sửa lịch trình theo ý muốn ngay rồi bấm Book**
> $\rightarrow$ **3. Ông Tour Guide xem phần khách đã sửa, điều chỉnh trực tiếp giá từng hạng mục & gửi Báo giá lại**
> $\rightarrow$ **4. Ông Khách hàng xem Báo giá lại và bấm Đồng ý chốt!**

---

## 1. Cách chạy (Chỉ cần 1 cửa sổ trình duyệt duy nhất)

Chạy lệnh sau tại thư mục gốc:

```powershell
.\run.bat
```

Sau khi Backend khởi động xong, mở trình duyệt tại:
👉 **http://localhost:5173**

Trên thanh Header góc trên bên phải có **Nút gạt chuyển vai tức thì**:
- **[👤 Vai: Khách hàng]** $\leftrightarrow$ **[🧭 Vai: Tour Guide]**
- Bạn chỉ cần bấm gạt qua lại trên cùng 1 màn hình để trình bày toàn bộ luồng cho thầy xem mà không cần mở nhiều cửa sổ hay bấm F5!

*(Mẹo: Nếu muốn xoá sạch dữ liệu vừa thao tác để demo lại từ đầu với bộ dữ liệu mẫu ban đầu, chỉ cần xoá thư mục `backend/data` rồi chạy lại `.\run.bat`).*

---

## 2. Hướng dẫn bấm Demo 4 bước trước mặt Giảng viên (2 phút)

### Bước 1 — Ông Tour Guide đăng (hoặc chỉnh sửa) 1 Tour Preset
1. Trên thanh Header (`http://localhost:5173`), bấm nút **[🧭 Vai: Tour Guide]** (mặc định đang chọn Guide **Trần Văn Bình**).
2. Bạn có thể:
   - Bấm **+ Đăng Tour Preset mới** (hoặc bấm **✎ Chỉnh sửa Tour Preset** ngay trên một tour có sẵn).
   - Nhập tên tour, chọn khu vực, và gõ các mốc hoạt động theo **Ngày 1, Ngày 2...** kèm đơn giá/khách (hoặc bấm 1 nút chèn nhanh từ các gợi ý có sẵn của khu vực).
   - Hệ thống tự động cộng các dòng lại thành **Tổng Giá gốc / 1 khách**. Bấm **Lưu / Đăng Tour Preset**.

### Bước 2 — Ông Khách hàng chọn Tour $\rightarrow$ Chỉnh sửa theo ý muốn $\rightarrow$ Book
1. Trên thanh Header, bấm nút **[👤 Vai: Khách hàng]** (chọn Khách: **Nguyễn Văn An**).
2. Chọn một Tour bất kỳ $\rightarrow$ bấm **Tuỳ chỉnh & Book Tour**.
3. Trong cửa sổ hiện ra, toàn bộ lịch trình chuẩn của Guide đã nằm sẵn. Khách có thể:
   - Đổi **Ngày khởi hành**, **Số khách tham gia**, **Số ngày đi**.
   - **Bấm `✕ Bỏ`** những hoạt động không thích.
   - **Sửa trực tiếp chữ** trên bất kỳ dòng nào, hoặc bấm chọn nhanh gợi ý (VD: `+ Du thuyền Paradise 5★ ngủ đêm trên vịnh`).
   - **Tự gõ thêm yêu cầu riêng** vào ô cuối mỗi ngày (VD: *"Chuẩn bị tiệc BBQ / bánh kem sinh nhật tại cabin"* $\rightarrow$ hệ thống tự gắn nhãn `Chờ Guide báo giá`).
4. Bấm nút màu cam **Book Tour & Yêu cầu Guide Báo giá lại**.
   - Hệ thống mở ngay màn hình chi tiết đơn hàng với **Thanh tiến trình 4 bước (Stepper)** đang sáng ở **Bước 2: Khách chỉnh sửa**.
   - *(Lưu ý: Kể cả sau khi đã Book xong, khách vẫn có thể bấm nút **✎ Chỉnh sửa theo ý muốn** trên đơn hàng để sửa lại bất cứ lúc nào!).*

### Bước 3 — Ông Tour Guide kiểm tra bản khách sửa $\rightarrow$ Báo giá lại
1. Ngay tại màn hình đơn hàng đó (hoặc ở danh sách đơn), bạn bấm gạt trên Header sang **[🧭 Vai: Tour Guide]**.
2. Giao diện lập tức mở **Công cụ Báo giá lại dành cho Tour Guide**:
   - Các dòng khách giữ nguyên ghi `Giữ nguyên gốc`, dòng khách đổi ghi `Khách đã sửa/đổi` (màu vàng), dòng khách tự gõ thêm ghi `Khách yêu cầu thêm` (màu tím).
   - Guide **nhập/sửa trực tiếp giá tiền của từng dòng** (đặc biệt là điền giá cho mục khách mới tự gõ thêm), có thể sửa lại câu chữ hoặc thêm mục đề xuất mới.
   - Nhập **Ưu đãi giảm giá (-)** hoặc **Phụ thu (+)** cho cả đoàn (nếu có) và gõ **Lời nhắn phản hồi**.
3. Bấm **📨 Gửi Báo giá lại cho Khách hàng** $\rightarrow$ Thanh tiến trình nhảy sang **Bước 3: Guide báo giá lại**.

### Bước 4 — Ông Khách hàng xem Báo giá lại $\rightarrow$ Đồng ý chốt
1. Bấm gạt trên Header quay lại **[👤 Vai: Khách hàng]**.
2. Khách nhìn thấy rõ hộp so sánh **[Giá gốc Tour Preset]** vs **[Tổng Giá Guide báo lại]**, đọc lời nhắn phản hồi của Guide và bảng giá chi tiết từng mục.
3. Bấm nút màu xanh lá **✓ Đồng ý chốt Tour** $\rightarrow$ Thanh tiến trình hoàn tất **Bước 4: Khách đồng ý chốt**!
