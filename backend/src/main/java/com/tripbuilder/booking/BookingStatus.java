package com.tripbuilder.booking;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 4 trạng thái khớp trực tiếp với Thanh tiến trình (Stepper) trên giao diện:
 * 1. BOOKED_ORIGINAL : Khách đặt theo nguyên bản Tour Preset (đã có sẵn giá gốc, có thể chốt luôn hoặc bấm sửa)
 * 2. WAITING_REQUOTE : Khách đã chỉnh sửa lịch trình theo ý muốn -> Đang chờ Tour Guide báo giá lại
 * 3. REQUOTED        : Tour Guide đã cập nhật giá từng mục & gửi Báo giá lại -> Chờ Khách đồng ý chốt
 * 4. CONFIRMED       : Khách đã đồng ý chốt Tour
 * 5. CANCELLED       : Đã huỷ
 */
@Getter
@RequiredArgsConstructor
public enum BookingStatus {
    BOOKED_ORIGINAL("Đã đặt theo giá gốc", 1),
    WAITING_REQUOTE("Chờ Guide báo giá lại", 2),
    REQUOTED("Guide đã báo giá lại", 3),
    CONFIRMED("Khách đã đồng ý chốt", 4),
    CANCELLED("Đã huỷ", 0);

    private final String label;
    private final int stepIndex;
}
