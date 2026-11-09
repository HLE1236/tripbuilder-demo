package com.tripbuilder.booking;

import com.tripbuilder.tour.Tour;
import com.tripbuilder.user.AppUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Đơn đặt tour của khách hàng.
 * Lưu cả Giá gốc ban đầu (để đối chiếu) và Giá sau khi chỉnh sửa / Guide báo giá lại.
 */
@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20)
    private String code;

    @ManyToOne(optional = false)
    private Tour tour;

    @ManyToOne(optional = false)
    private AppUser customer;

    @ManyToOne(optional = false)
    private AppUser guide;

    @Column(nullable = false)
    private LocalDate startDate;

    /** Số ngày đi thực tế khách muốn (mặc định bằng số ngày của tour, khách có thể tăng/giảm). */
    @Column(name = "num_days", nullable = false)
    private Integer days;

    /** Số lượng khách đi (tính chung đơn giản: Đơn giá/người × guests). */
    @Column(nullable = false)
    private Integer guests;

    /** Ghi chú yêu cầu riêng của khách. */
    @Column(length = 1000)
    private String customerNote;

    /** Lời nhắn phản hồi của Tour Guide khi báo giá lại. */
    @Column(length = 1000)
    private String guideNote;

    /** Giá gốc / 1 người của Tour Preset lúc đặt. */
    @Column(nullable = false)
    private Long originalPricePerPerson;

    /** Đơn giá / 1 người hiện tại (tổng các dòng hoạt động trong đơn). */
    @Column(nullable = false)
    private Long currentPricePerPerson;

    /** Phụ thu (+) hoặc giảm giá (-) cho cả đoàn do Guide nhập khi báo giá lại. */
    @Column(nullable = false)
    private Long groupAdjustment;

    /** Tổng thanh toán cuối cùng = (currentPricePerPerson × guests) + groupAdjustment. */
    @Column(nullable = false)
    private Long totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC, sortOrder ASC, id ASC")
    @Builder.Default
    private List<BookingStep> steps = new ArrayList<>();
}
