package com.tripbuilder.common;

/** Lỗi do dữ liệu gửi lên không hợp lệ hoặc thao tác sai trạng thái -> HTTP 400. */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
