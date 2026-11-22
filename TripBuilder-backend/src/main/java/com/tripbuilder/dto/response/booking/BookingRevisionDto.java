package com.tripbuilder.dto.response.booking;

import com.tripbuilder.entity.booking.BookingRevision;

import java.time.LocalDateTime;

public record BookingRevisionDto(
        Long id,
        int roundNo,
        String actorRole,
        String actorName,
        String actionLabel,
        String note,
        long totalPrice,
        LocalDateTime createdAt
) {
    public static BookingRevisionDto from(BookingRevision r) {
        return new BookingRevisionDto(
                r.getId(),
                r.getRoundNo() == null ? 1 : r.getRoundNo(),
                r.getActorRole(),
                r.getActorName(),
                r.getActionLabel(),
                r.getNote(),
                r.getTotalPrice() == null ? 0L : r.getTotalPrice(),
                r.getCreatedAt()
        );
    }
}
