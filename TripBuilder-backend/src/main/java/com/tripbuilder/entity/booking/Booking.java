package com.tripbuilder.entity.booking;

import com.tripbuilder.entity.tour.Tour;
import com.tripbuilder.entity.user.AppUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Đơn đặt tour của khách hàng.
 * Lưu snapshot lịch trình & giá tại thời điểm đặt, hỗ trợ đàm phán nhiều vòng
 * và điều chỉnh sau khi đã chốt mà không bị ảnh hưởng khi Guide sửa Tour Preset gốc.
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

    /** Snapshot tên & version tour lúc khách đặt (tránh bị trôi khi Guide sửa tour gốc). */
    @Column(length = 200)
    private String tourTitleSnapshot;

    private Integer tourVersionSnapshot;

    @ManyToOne(optional = false)
    private AppUser customer;

    @ManyToOne(optional = false)
    private AppUser guide;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(name = "num_days", nullable = false)
    private Integer days;

    @Column(nullable = false)
    private Integer guests;

    @Column(length = 1000)
    private String customerNote;

    @Column(length = 30)
    private String serviceMode;

    @Column(length = 1000)
    private String guideNote;

    private Integer customerRating;

    @Column(length = 1000)
    private String customerReview;

    @Column(nullable = false)
    private Long originalPricePerPerson;

    @Column(nullable = false)
    private Long currentPricePerPerson;

    @Column(nullable = false)
    private Long groupAdjustment;

    @Column(nullable = false)
    private Long totalPrice;

    /** Lưu tổng giá lần chốt gần nhất để đối chiếu khi có điều chỉnh sau chốt. */
    private Long confirmedTotalPrice;

    /** Số vòng trao đổi/điều chỉnh. */
    private Integer revisionCount;

    /** Đánh dấu đơn đang ở luồng điều chỉnh sau khi đã chốt. */
    private Boolean postConfirmAdjustment;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    private BookingStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC, sortOrder ASC, id ASC")
    @Builder.Default
    private List<BookingStep> steps = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("roundNo DESC, id DESC")
    @Builder.Default
    private List<BookingRevision> revisions = new ArrayList<>();
}
