package com.tripbuilder.service.catalog;

import com.tripbuilder.dto.response.catalog.OptionDto;
import com.tripbuilder.entity.catalog.PresetOption;
import com.tripbuilder.repository.PresetOptionRepository;
import com.tripbuilder.util.VietnameseTextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class PresetOptionService {

    private final PresetOptionRepository optionRepository;

    @Transactional(readOnly = true)
    public List<OptionDto> getByRegion(Long regionId) {
        return getByRegion(regionId, null, null, "default");
    }

    @Transactional(readOnly = true)
    public List<OptionDto> getByRegion(Long regionId, String category, String q, String sort) {
        String normalizedCategory = (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category.trim()))
                ? category.trim()
                : null;
        String normalizedQuery = VietnameseTextUtil.normalize(q);

        Stream<PresetOption> stream = optionRepository.findByRegionIdOrderByIdAsc(regionId).stream();

        if (normalizedCategory != null) {
            stream = stream.filter(o -> normalizedCategory.equalsIgnoreCase(o.getCategory()));
        }

        if (!normalizedQuery.isEmpty()) {
            stream = stream.filter(o ->
                    VietnameseTextUtil.normalize(o.getTitle()).contains(normalizedQuery)
                            || VietnameseTextUtil.normalize(o.getDescription()).contains(normalizedQuery));
        }

        if ("price_asc".equalsIgnoreCase(sort)) {
            stream = stream.sorted(Comparator.comparingLong(PresetOption::getPricePerPerson)
                    .thenComparingLong(PresetOption::getId));
        } else if ("price_desc".equalsIgnoreCase(sort)) {
            stream = stream.sorted(Comparator.comparingLong(PresetOption::getPricePerPerson).reversed()
                    .thenComparingLong(PresetOption::getId));
        }

        return stream.map(OptionDto::from).toList();
    }
}
