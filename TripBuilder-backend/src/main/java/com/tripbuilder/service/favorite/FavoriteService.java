package com.tripbuilder.service.favorite;

import com.tripbuilder.entity.favorite.SavedTour;
import com.tripbuilder.repository.SavedTourRepository;

import com.tripbuilder.entity.tour.Tour;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.service.tour.TourService;
import com.tripbuilder.entity.user.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final SavedTourRepository savedTourRepository;
    private final TourService tourService;

    @Transactional(readOnly = true)
    public List<Long> listIds(Long customerId) {
        return savedTourRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(st -> st.getTour().getId())
                .toList();
    }

    public List<Long> save(AppUser customer, Long tourId) {
        Tour tour = tourService.find(tourId);
        if (Boolean.FALSE.equals(tour.getActive())) {
            throw new BadRequestException("Tour đã ngừng hoạt động, không thể lưu");
        }
        if (!savedTourRepository.existsByCustomerIdAndTourId(customer.getId(), tour.getId())) {
            try {
                savedTourRepository.saveAndFlush(SavedTour.builder()
                        .customer(customer)
                        .tour(tour)
                        .createdAt(LocalDateTime.now())
                        .build());
            } catch (DataIntegrityViolationException ignored) {
                // Concurrent save on unique constraint is idempotent
            }
        }
        return listIds(customer.getId());
    }

    @Transactional
    public List<Long> remove(Long customerId, Long tourId) {
        savedTourRepository.deleteByCustomerIdAndTourId(customerId, tourId);
        return listIds(customerId);
    }
}
