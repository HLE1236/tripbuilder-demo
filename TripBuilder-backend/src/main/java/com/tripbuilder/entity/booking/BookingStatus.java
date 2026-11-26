package com.tripbuilder.entity.booking;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 4 chặng tinh gọn trên Thanh tiến trình:
 * 1: BOOKED_ORIGINAL  — Đặt theo lịch chuẩn
 * 2: WAITING_REQUOTE  — Chờ Guide báo giá / CHANGE_REQUESTED — Điều chỉnh sau chốt
 * 3: REQUOTED         — Guide đã báo giá mới
 * 4: CONFIRMED        — Khách đã chốt
 */
@Getter
@RequiredArgsConstructor
public enum BookingStatus {
    BOOKED_ORIGINAL("Lịch trình chuẩn", 1),
    WAITING_REQUOTE("Chờ báo giá", 2),
    CHANGE_REQUESTED("Điều chỉnh sau chốt", 2),
    REQUOTED("Đã có báo giá", 3),
    CONFIRMED("Đã chốt", 4),
    COMPLETED("Đã hoàn thành", 5),
    CANCELLED("Đã huỷ", 0);

    private final String label;
    private final int stepIndex;
}
