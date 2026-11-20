---
name: TripBuilder
description: Sổ tay hành trình & Bàn điều phối báo giá bản địa — thiết kế theo bộ quy chuẩn unslop (CC BY 4.0 · Damir Sokolovsky @heydamir)
colors:
  client-bg: "#FAF8F5"
  client-surface: "#F3EFEA"
  client-surface-2: "#EAE4DC"
  client-ink: "#161514"
  admin-bg: "#FAFAFA"
  admin-surface: "#F4F4F5"
  admin-surface-2: "#E4E4E7"
  admin-ink: "#141415"
  border-subtle: "rgba(22, 21, 20, 0.08)"
  border-strong: "rgba(22, 21, 20, 0.16)"
  accent: "#D9381E"
  accent-hover: "#B82D16"
  accent-soft: "rgba(217, 56, 30, 0.08)"
  emerald: "#16A34A"
  amber: "#B45309"
  crimson: "#DC2626"
typography:
  display:
    fontFamily: "Be Vietnam Pro, Plus Jakarta Sans, ui-sans-serif, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.02em"
  sans:
    fontFamily: "Plus Jakarta Sans, Be Vietnam Pro, ui-sans-serif, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontWeight: 500
motion:
  easeOut: "cubic-bezier(0.22, 1, 0.36, 1)"
  feedbackDuration: "150ms"
---

# Design System: TripBuilder (Unslop Edition)

> Thiết kế lại theo bộ quy chuẩn **unslop** của Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), phát hành theo giấy phép **CC BY 4.0**.

## 5-Line Direction

1. **Product:** Ứng dụng để du khách Việt xem lịch trình mẫu từ hướng dẫn viên bản địa, tự đổi từng chặng theo ý muốn và đối chiếu báo giá từng dòng trước khi chốt chuyến.
2. **Character:** Điềm tĩnh, tường tận, đậm chất bản địa (`calm, exact, locally grounded`).
3. **World:**
   - **Cổng Khách hàng (`web-client`):** Sổ tay hành trình giấy kem ấm (`#FAF8F5` nền, `#F3EFEA` bề mặt, `#EAE4DC` bề mặt phụ, `#161514` chữ chính).
   - **Cổng Hướng dẫn viên (`web-admin`):** Bàn làm việc xám thạch anh sáng (`#FAFAFA` nền, `#F4F4F5` bề mặt, `#E4E4E7` bề mặt phụ, `#141415` chữ chính).
   - Viền hairline mảnh `8%` (`rgba(22, 21, 20, 0.08)`). Duy nhất 1 màu nhấn đất nung/san hô trầm (`--accent: #D9381E`, `--accent-hover: #B82D16`, `--accent-soft: rgba(217, 56, 30, 0.08)`).
4. **Moments:**
   - (1) Khung ảnh thực tế từ 78 bức ảnh địa danh Việt Nam đặt cạnh thẻ tóm tắt lộ trình theo ngày.
   - (2) Bảng đối chiếu báo giá 4 cột rõ tới từng đồng.
5. **Signature:** Đường kẻ dọc nối các chặng theo ngày với chấm màu nhỏ `6px` (`status dot`) định danh loại dịch vụ và mã giờ/chi phí bằng font `IBM Plex Mono` `tabular-nums`, thay cho các hộp badge nhiều màu.

---

## 9 Passes Summary

### 1. Spacing
- Toàn bộ khoảng cách tuân theo lưới `4px` (`4, 8, 12, 16, 20, 24, 32, 48`).

### 2. Color & Surfaces
- Bề mặt trung tính theo thế giới của từng cổng, không gradient đa sắc, không bóng phát sáng màu (`colored glows` bị loại bỏ hoàn toàn trên `.btn-primary` và `.btn-confirm`).
- Chữ chia 3 vai trò rõ ràng: `--ink`, `--ink-2` (`--ink-secondary`), `--ink-3` (`--ink-muted`).
- Độ sâu dựa trên bước chuyển sắc bề mặt và viền hairline `8%`, bóng trung tính siêu nhẹ (`0 1px 2px rgba(22, 21, 20, 0.05)`).

### 3. Icons & Status Dots
- Một bộ icon nét đơn `Icon.tsx` (`1.75px` stroke), màu theo vai trò chữ.
- Thay thế toàn bộ hộp badge 5 màu lòe loẹt bằng nền trung tính + viền hairline `1px solid var(--border-subtle)` + chấm tròn `6px` (`::before` / `.status-dot`):
  - Khách sạn (`.category-badge-hotel`): `#4F46E5`
  - Ẩm thực (`.category-badge-food`): `#D97706`
  - Di chuyển (`.category-badge-transport`): `#0284C7`
  - Hoạt động (`.category-badge-activity`): `#059669`
  - Tùy chỉnh (`.category-badge-custom`): `#D9381E`

### 4. Copy
- Sentence case toàn bộ nhãn và tiêu đề, không dùng `UPPERCASE` giãn cách rộng (`tracking-widest`, `tracking-wider`).
- Không dùng dấu chấm than `!`, không dùng từ ngữ thổi phồng.

### 5. Typography
- Font chữ Việt chuẩn không lỗi dấu: `Be Vietnam Pro` cho tiêu đề, `Plus Jakarta Sans` cho giao diện và nội dung, `IBM Plex Mono` (`tabular-nums`) cho giá tiền và mã đơn.
- Giữ cỡ chữ dễ đọc chuẩn trình chiếu (`body: 16px`, nhãn phụ tối thiểu `13px–14px`), nhưng hạ độ đậm tiêu đề xuống `500–600` (loại bỏ `700/800/900` nặng nề).

### 6. Layout & Details
- Bo góc theo kích thước: `6px` cho tag/badge, `8px–10px` cho nút và ô nhập liệu, `12px` cho thẻ `.flagship-card`.

### 7. Motion
- Một đường cong duy nhất `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`.
- Loại bỏ `transition-all` và hiệu ứng nhảy `translateY(-4px)` khi hover thẻ; chỉ chuyển màu viền `border-color: var(--border-strong)` nhẹ nhàng.
