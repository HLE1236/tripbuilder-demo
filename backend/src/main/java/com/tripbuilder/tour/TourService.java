package com.tripbuilder.tour;

import com.tripbuilder.common.BadRequestException;
import com.tripbuilder.region.Region;
import com.tripbuilder.region.RegionRepository;
import com.tripbuilder.user.AppUser;
import com.tripbuilder.user.Role;
import com.tripbuilder.user.UserDto;
import com.tripbuilder.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TourService {

    private final TourRepository tourRepository;
    private final UserRepository userRepository;
    private final RegionRepository regionRepository;

    public record StepInput(int dayNumber, String category, String title, long pricePerPerson) {}

    public record StepDto(Long id, int dayNumber, String category, String title, long pricePerPerson) {
        public static StepDto from(TourStep s) {
            return new StepDto(s.getId(), s.getDayNumber(), s.getCategory(), s.getTitle(), s.getPricePerPerson());
        }
    }

    public record TourDto(
            Long id,
            String title,
            String description,
            String imageUrl,
            int days,
            long basePricePerPerson,
            Long regionId,
            String regionName,
            String province,
            UserDto guide,
            LocalDateTime createdAt,
            List<StepDto> steps
    ) {}

    public record SaveTourRequest(
            Long guideId,
            Long regionId,
            String title,
            String description,
            String imageUrl,
            int days,
            List<StepInput> steps
    ) {}

    @Transactional(readOnly = true)
    public List<TourDto> list(Long guideId) {
        List<Tour> list = guideId == null
                ? tourRepository.findAllByOrderByIdDesc()
                : tourRepository.findByGuideIdOrderByIdDesc(guideId);
        return list.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public TourDto get(Long id) {
        return toDto(find(id));
    }

    @Transactional
    public TourDto create(SaveTourRequest req) {
        AppUser guide = userRepository.findById(req.guideId() == null ? -1 : req.guideId())
                .filter(u -> u.getRole() == Role.GUIDE)
                .orElseThrow(() -> new BadRequestException("Tài khoản Tour Guide không hợp lệ"));
        Region region = regionRepository.findById(req.regionId() == null ? -1 : req.regionId())
                .orElseThrow(() -> new BadRequestException("Vui lòng chọn khu vực điểm đến"));

        Tour tour = Tour.builder()
                .guide(guide)
                .region(region)
                .createdAt(LocalDateTime.now())
                .build();
        applyFields(tour, region, req);
        return toDto(tourRepository.save(tour));
    }

    @Transactional
    public TourDto update(Long id, SaveTourRequest req) {
        Tour tour = find(id);
        Region region = req.regionId() != null
                ? regionRepository.findById(req.regionId()).orElse(tour.getRegion())
                : tour.getRegion();
        tour.setRegion(region);
        applyFields(tour, region, req);
        tourRepository.flush();
        return toDto(tour);
    }

    private void applyFields(Tour tour, Region region, SaveTourRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new BadRequestException("Vui lòng nhập tên Tour");
        }
        if (req.days() < 1 || req.days() > 10) {
            throw new BadRequestException("Số ngày của tour phải từ 1 đến 10");
        }
        if (req.steps() == null || req.steps().isEmpty()) {
            throw new BadRequestException("Lịch trình tour phải có ít nhất 1 hoạt động");
        }

        tour.setTitle(req.title().trim());
        tour.setDescription(req.description());
        tour.setImageUrl(req.imageUrl() == null || req.imageUrl().isBlank() ? region.getImageUrl() : req.imageUrl().trim());
        tour.setDays(req.days());

        tour.getSteps().clear();
        long sum = 0;
        int order = 1;
        for (StepInput s : req.steps()) {
            if (s.title() == null || s.title().isBlank()) continue;
            int day = Math.max(1, Math.min(req.days(), s.dayNumber()));
            long price = Math.max(0, s.pricePerPerson());
            sum += price;
            tour.getSteps().add(TourStep.builder()
                    .tour(tour)
                    .dayNumber(day)
                    .category(s.category() == null || s.category().isBlank() ? "Hoạt động" : s.category())
                    .title(s.title().trim())
                    .pricePerPerson(price)
                    .sortOrder(order++)
                    .build());
        }
        if (tour.getSteps().isEmpty()) {
            throw new BadRequestException("Vui lòng nhập nội dung hoạt động cho lịch trình");
        }
        tour.setBasePricePerPerson(sum);
    }

    public Tour find(Long id) {
        return tourRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tour ID " + id));
    }

    public TourDto toDto(Tour t) {
        return new TourDto(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getImageUrl(),
                t.getDays(),
                t.getBasePricePerPerson(),
                t.getRegion().getId(),
                t.getRegion().getName(),
                t.getRegion().getProvince(),
                UserDto.from(t.getGuide()),
                t.getCreatedAt(),
                t.getSteps().stream().map(StepDto::from).toList()
        );
    }
}
