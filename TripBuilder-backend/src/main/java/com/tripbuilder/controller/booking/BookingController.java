package com.tripbuilder.controller.booking;

import com.tripbuilder.dto.request.booking.CancelBookingRequest;
import com.tripbuilder.dto.request.booking.CreateBookingRequest;
import com.tripbuilder.dto.request.booking.CustomizeRequest;
import com.tripbuilder.dto.request.booking.RequoteRequest;
import com.tripbuilder.dto.request.booking.ReviewRequest;
import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.booking.BookingDto;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.ForbiddenException;
import com.tripbuilder.security.AuthInterceptor;
import com.tripbuilder.service.booking.BookingService;
import jakarta.servlet.http.HttpServletRequest;
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
                                              @RequestParam(required = false) Long guideId,
                                              HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() == Role.ADMIN) {
            return ApiResponse.ok(bookingService.list(customerId, guideId));
        }
        if (user.getRole() == Role.CUSTOMER) {
            if (guideId != null || (customerId != null && !customerId.equals(user.getId()))) {
                throw new ForbiddenException("Bạn chỉ có thể xem đơn đặt tour của chính mình");
            }
            return ApiResponse.ok(bookingService.list(user.getId(), null));
        }
        if (customerId != null || (guideId != null && !guideId.equals(user.getId()))) {
            throw new ForbiddenException("Bạn chỉ có thể xem các đơn thuộc tour của mình");
        }
        return ApiResponse.ok(bookingService.list(null, user.getId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookingDto> get(@PathVariable Long id, HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        return ApiResponse.ok(bookingService.get(id, user));
    }

    /** Chỉ Khách hàng được tạo đơn đặt tour. */
    @PostMapping
    public ApiResponse<BookingDto> create(@RequestBody CreateBookingRequest req, HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.CUSTOMER) {
            throw new ForbiddenException("Tài khoản Tour Guide không thể thực hiện đặt tour");
        }
        CreateBookingRequest scoped = new CreateBookingRequest(
                req.tourId(),
                user.getId(),
                req.startDate(),
                req.days(),
                req.guests(),
                req.adults(),
                req.children(),
                req.serviceMode(),
                req.customerNote(),
                req.customized(),
                req.steps()
        );
        return ApiResponse.ok("Đã gửi yêu cầu đặt tour", bookingService.create(scoped));
    }

    /** Khách hàng điều chỉnh lịch trình (kể cả vòng tiếp hoặc xin đổi sau chốt). */
    @PutMapping("/{id}/customize")
    public ApiResponse<BookingDto> customize(@PathVariable Long id,
                                             @RequestBody CustomizeRequest req,
                                             HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.CUSTOMER) {
            throw new ForbiddenException("Chỉ khách hàng mới được gửi yêu cầu tuỳ chỉnh");
        }
        return ApiResponse.ok("Đã gửi điều chỉnh cho Tour Guide", bookingService.customize(id, req, user));
    }

    /** Tour Guide xác nhận lịch trống cho đơn đặt tour. */
    @PostMapping("/{id}/accept")
    public ApiResponse<BookingDto> accept(@PathVariable Long id, HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.GUIDE) {
            throw new ForbiddenException("Chỉ Tour Guide mới có quyền xác nhận lịch trống");
        }
        return ApiResponse.ok("Đã xác nhận lịch trống cho đơn đặt tour", bookingService.accept(id, user));
    }

    /** Tour Guide kiểm tra & gửi báo giá lại (hỗ trợ cả đơn đã chốt cần điều chỉnh). */
    @PutMapping("/{id}/requote")
    public ApiResponse<BookingDto> requote(@PathVariable Long id,
                                           @RequestBody RequoteRequest req,
                                           HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.GUIDE) {
            throw new ForbiddenException("Chỉ Tour Guide mới có quyền gửi báo giá");
        }
        return ApiResponse.ok("Đã gửi báo giá cho khách hàng", bookingService.requote(id, req, user));
    }

    /** Khách hàng đồng ý chốt chuyến. */
    @PostMapping("/{id}/confirm")
    public ApiResponse<BookingDto> confirm(@PathVariable Long id, HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.CUSTOMER) {
            throw new ForbiddenException("Chỉ khách hàng mới có quyền chốt chuyến");
        }
        return ApiResponse.ok("Đã chốt lịch trình chuyến đi!", bookingService.confirm(id, user));
    }

    /** Từ chối điều chỉnh sau chốt và khôi phục về snapshot đã chốt. */
    @PostMapping("/{id}/reject-change")
    public ApiResponse<BookingDto> rejectChange(@PathVariable Long id, HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.GUIDE && user.getRole() != Role.CUSTOMER) {
            throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này");
        }
        return ApiResponse.ok("Đã khôi phục lịch trình đã chốt trước đó", bookingService.rejectChange(id, user));
    }

    /** Tour Guide hoặc Admin đánh dấu chuyến đi đã hoàn thành. */
    @PostMapping("/{id}/complete")
    public ApiResponse<BookingDto> complete(@PathVariable Long id, HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.GUIDE && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Chỉ Tour Guide hoặc Admin mới có quyền hoàn thành chuyến đi");
        }
        return ApiResponse.ok("Đã hoàn thành chuyến đi", bookingService.complete(id, user));
    }

    /** Khách hàng hoặc Guide sở hữu đơn có thể huỷ đơn. */
    @PostMapping("/{id}/cancel")
    public ApiResponse<BookingDto> cancel(@PathVariable Long id,
                                          @RequestBody(required = false) CancelBookingRequest req,
                                          HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        return ApiResponse.ok("Đã huỷ đơn đặt tour", bookingService.cancel(id, req, user));
    }

    /** Khách đánh giá sau khi chốt/hoàn thành chuyến đi. */
    @PostMapping("/{id}/review")
    public ApiResponse<BookingDto> review(@PathVariable Long id,
                                          @RequestBody ReviewRequest req,
                                          HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.CUSTOMER) {
            throw new ForbiddenException("Chỉ khách hàng mới có quyền gửi đánh giá");
        }
        return ApiResponse.ok("Đã gửi đánh giá chuyến đi", bookingService.review(id, req, user));
    }
}
