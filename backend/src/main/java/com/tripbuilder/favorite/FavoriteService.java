package com.tripbuilder.favorite;

import com.tripbuilder.tour.Tour;
import com.tripbuilder.tour.TourService;
import com.tripbuilder.user.AppUser;
import lombok.RequiredArgsConstructor;
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

    @Transactional
    public List<Long> save(AppUser customer, Long tourId) {
        Tour tour = tourService.find(tourId);
        if (!savedTourRepository.existsByCustomerIdAndTourId(customer.getId(), tour.getId())) {
            savedTourRepository.save(SavedTour.builder()
                    .customer(customer)
                    .tour(tour)
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        return listIds(customer.getId());
    }

    @Transactional
    public List<Long> remove(Long customerId, Long tourId) {
        savedTourRepository.deleteByCustomerIdAndTourId(customerId, tourId);
        return listIds(customerId);
    }
}
