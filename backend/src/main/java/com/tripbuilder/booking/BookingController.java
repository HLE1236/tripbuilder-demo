package com.tripbuilder.booking;

import com.tripbuilder.booking.BookingService.*;
import com.tripbuilder.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public ApiResponse<List<BookingDto>> list(@RequestParam(required = false) Long customerId,
                                              @RequestParam(required = false) Long guideId) {
        return ApiResponse.ok(bookingService.list(customerId, guideId));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookingDto> get(@PathVariable Long id) {
        return ApiResponse.ok(bookingService.get(id));
    }

    /** Khách đặt tour (nguyên bản hoặc đã chỉnh sửa ngay lúc đặt). */
    @PostMapping
    public ApiResponse<BookingDto> create(@RequestBody CreateBookingRequest req) {
        return ApiResponse.ok("Đã đặt tour thành công", bookingService.create(req));
    }

    /** Khách chỉnh sửa lại lịch trình theo ý muốn -> Chờ Guide báo giá lại. */
    @PutMapping("/{id}/customize")
    public ApiResponse<BookingDto> customize(@PathVariable Long id, @RequestBody CustomizeRequest req) {
        return ApiResponse.ok("Đã gửi yêu cầu chỉnh sửa cho Tour Guide", bookingService.customize(id, req));
    }

    /** Tour Guide sửa từng dòng giá & gửi Báo giá lại cho khách. */
    @PutMapping("/{id}/requote")
    public ApiResponse<BookingDto> requote(@PathVariable Long id, @RequestBody RequoteRequest req) {
        return ApiResponse.ok("Đã gửi Báo giá lại cho khách hàng", bookingService.requote(id, req));
    }

    /** Khách đồng ý chốt báo giá. */
    @PostMapping("/{id}/confirm")
    public ApiResponse<BookingDto> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Đã xác nhận chốt Tour!", bookingService.confirm(id));
    }

    /** Huỷ đơn. */
    @PostMapping("/{id}/cancel")
    public ApiResponse<BookingDto> cancel(@PathVariable Long id) {
        return ApiResponse.ok("Đã huỷ đơn đặt tour", bookingService.cancel(id));
    }
}
