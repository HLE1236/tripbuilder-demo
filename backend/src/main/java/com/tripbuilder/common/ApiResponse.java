package com.tripbuilder.common;

/**
 * Chuẩn response trả về cho mọi API: { statusCode, message, data }.
 * Frontend đọc dữ liệu qua res.data.data (giống demo_admin / TravelApp).
 */
public record ApiResponse<T>(int statusCode, String message, T data) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(200, "OK", data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(200, message, data);
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return new ApiResponse<>(statusCode, message, null);
    }
}
