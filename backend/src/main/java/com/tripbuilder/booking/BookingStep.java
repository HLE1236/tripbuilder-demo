package com.tripbuilder.booking;

import jakarta.persistence.*;
import lombok.*;

/**
 * Một dòng hoạt động trong đơn đặt tour của khách.
 * Lưu cả tên gốc (originalTitle) và giá gốc (originalPricePerPerson) để đối chiếu Trước & Sau.
 *
 * noteType:
 * - "PRESET"   : Giữ nguyên từ Tour gốc
 * - "MODIFIED" : Khách đã đổi sang lựa chọn khác (Swap)
 * - "REMOVED"  : Khách đã bấm Bỏ mục này (giá hiện tại = 0đ, gạch ngang, giữ lại vết cho Guide thấy)
 * - "CUSTOM"   : Khách yêu cầu thêm mới
 * - "GUIDE"    : Guide đã báo giá / điều chỉnh
 */
@Entity
@Table(name = "booking_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Booking booking;

    @Column(nullable = false)
    private Integer dayNumber;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false)
    private Long pricePerPerson;

    /** Tên hạng mục gốc trước khi đổi (nếu có) để hiển thị "Đã đổi từ X -> Y". */
    @Column(length = 300)
    private String originalTitle;

    /** Đơn giá gốc trước khi đổi/bỏ/báo giá lại để hiển thị giá cũ gạch ngang. */
    private Long originalPricePerPerson;

    @Column(length = 20)
    private String noteType;

    private Integer sortOrder;
}
