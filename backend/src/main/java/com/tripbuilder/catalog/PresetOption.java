package com.tripbuilder.catalog;

import com.tripbuilder.region.Region;
import jakarta.persistence.*;
import lombok.*;

/**
 * Gợi ý dịch vụ / hoạt động có sẵn tại từng khu vực (Khách sạn, Xe, Ăn uống, Trải nghiệm).
 * Dùng để bấm chọn nhanh khi Guide tạo/sửa Tour Preset hoặc khi Khách tuỳ chỉnh lịch trình.
 * Giá tính đơn giản: VNĐ / 1 người.
 */
@Entity
@Table(name = "preset_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresetOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Region region;

    /** Nhóm: "Khách sạn", "Di chuyển", "Ăn uống", "Trải nghiệm" */
    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 200)
    private String title;

    /** Đơn giá / 1 người (VNĐ). */
    @Column(nullable = false)
    private Long pricePerPerson;
}
