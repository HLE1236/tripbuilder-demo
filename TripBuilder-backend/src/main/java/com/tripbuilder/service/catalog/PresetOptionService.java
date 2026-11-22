package com.tripbuilder.service.catalog;

import com.tripbuilder.dto.response.catalog.OptionDto;
import com.tripbuilder.repository.PresetOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PresetOptionService {

    private final PresetOptionRepository optionRepository;

    @Transactional(readOnly = true)
    public List<OptionDto> getByRegion(Long regionId) {
        return optionRepository.findByRegionIdOrderByIdAsc(regionId)
                .stream()
                .map(OptionDto::from)
                .toList();
    }
}
