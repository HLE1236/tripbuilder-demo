package com.tripbuilder.booking;

import jakarta.persistence.*;
import lombok.*;

/**
 * Một dòng hoạt động trong đơn đặt tour của khách.
 * noteType cho biết dòng này:
 * - "PRESET"   : Giữ nguyên từ Tour gốc
 * - "MODIFIED" : Khách đã đổi dịch vụ hoặc sửa nội dung
 * - "CUSTOM"   : Khách tự gõ thêm yêu cầu mới (ban đầu giá có thể = 0 chờ Guide điền giá)
 * - "GUIDE"    : Guide đề xuất / điều chỉnh khi báo giá lại
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

    @Column(length = 20)
    private String noteType;

    private Integer sortOrder;
}
