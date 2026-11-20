package com.tripbuilder.catalog;

import com.tripbuilder.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/options")
@RequiredArgsConstructor
public class PresetOptionController {

    private final PresetOptionRepository optionRepository;

    public record OptionDto(
            Long id,
            Long regionId,
            String category,
            String title,
            String imageUrl,
            long pricePerPerson
    ) {
        public static OptionDto from(PresetOption o) {
            String img = (o.getImageUrl() != null && !o.getImageUrl().isBlank())
                    ? o.getImageUrl()
                    : o.getRegion().getImageUrl();
            return new OptionDto(
                    o.getId(),
                    o.getRegion().getId(),
                    o.getCategory(),
                    o.getTitle(),
                    img,
                    o.getPricePerPerson()
            );
        }
    }

    @GetMapping
    public ApiResponse<List<OptionDto>> getByRegion(@RequestParam Long regionId) {
        return ApiResponse.ok(optionRepository.findByRegionIdOrderByIdAsc(regionId)
                .stream().map(OptionDto::from).toList());
    }
}
