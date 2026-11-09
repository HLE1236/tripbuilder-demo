package com.tripbuilder.booking;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 4 bước thân thiện trên Thanh tiến trình (Stepper):
 * Bước 1: Khách gửi yêu cầu đặt tour (BOOKED_ORIGINAL)
 * Bước 2: Tuỳ chỉnh lịch trình - Chờ Guide báo giá (WAITING_REQUOTE)
 * Bước 3: Guide kiểm tra & Báo giá chốt (REQUOTED)
 * Bước 4: Khách đồng ý & Hoàn tất (CONFIRMED)
 */
@Getter
@RequiredArgsConstructor
public enum BookingStatus {
    BOOKED_ORIGINAL("Đặt theo lịch trình chuẩn", 1),
    WAITING_REQUOTE("Đã tuỳ chỉnh · Chờ Guide báo giá", 2),
    REQUOTED("Guide đã báo giá chốt", 3),
    CONFIRMED("Khách đã đồng ý & Hoàn tất", 4),
    CANCELLED("Đã huỷ", 0);

    private final String label;
    private final int stepIndex;
}
