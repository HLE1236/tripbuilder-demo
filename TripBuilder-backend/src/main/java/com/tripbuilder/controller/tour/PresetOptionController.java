package com.tripbuilder.controller.tour;

import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.catalog.OptionDto;
import com.tripbuilder.service.catalog.PresetOptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/options")
@RequiredArgsConstructor
public class PresetOptionController {

    private final PresetOptionService presetOptionService;

    @GetMapping
    public ApiResponse<List<OptionDto>> getByRegion(
            @RequestParam Long regionId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "default") String sort
    ) {
        return ApiResponse.ok(presetOptionService.getByRegion(regionId, category, q, sort));
    }
}
