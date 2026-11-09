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

    public record OptionDto(Long id, Long regionId, String category, String title, long pricePerPerson) {
        public static OptionDto from(PresetOption o) {
            return new OptionDto(o.getId(), o.getRegion().getId(), o.getCategory(), o.getTitle(), o.getPricePerPerson());
        }
    }

    @GetMapping
    public ApiResponse<List<OptionDto>> getByRegion(@RequestParam Long regionId) {
        return ApiResponse.ok(optionRepository.findByRegionIdOrderByIdAsc(regionId)
                .stream().map(OptionDto::from).toList());
    }
}
