package com.tripbuilder.controller.guide;

import com.tripbuilder.dto.request.guide.CreateGuideApplicationRequest;
import com.tripbuilder.dto.request.guide.LookupGuideApplicationRequest;
import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.guide.GuideApplicationStatusDto;
import com.tripbuilder.service.guide.GuideApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/guide-applications")
@RequiredArgsConstructor
public class GuideApplicationController {

    private final GuideApplicationService guideApplicationService;

    @PostMapping
    public ApiResponse<GuideApplicationStatusDto> submit(@RequestBody CreateGuideApplicationRequest req) {
        return ApiResponse.ok(
                "Đã gửi hồ sơ đăng ký Hướng dẫn viên. Vui lòng lưu lại mã hồ sơ để tra cứu.",
                guideApplicationService.submit(req)
        );
    }

    @PostMapping("/lookup")
    public ApiResponse<GuideApplicationStatusDto> lookup(@RequestBody LookupGuideApplicationRequest req) {
        return ApiResponse.ok(guideApplicationService.lookup(req));
    }
}
