package com.tripbuilder.security;

import com.tripbuilder.service.auth.AuthService;

import com.tripbuilder.entity.user.AppUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    public static final String CURRENT_USER_ATTR = "CURRENT_USER";

    private final AuthService authService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Public endpoints (catalog, health, auth flows)
        if (path.equals("/api/hello")
                || path.startsWith("/api/system/")
                || (HttpMethod.GET.matches(method) && (path.equals("/api/regions") || path.startsWith("/api/regions/")))
                || (HttpMethod.GET.matches(method) && (path.equals("/api/options") || path.startsWith("/api/options/")))
                || path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.equals("/api/auth/refresh")
                || path.equals("/api/auth/logout")
                || path.equals("/api/auth/forgot-password")
                || path.equals("/api/auth/reset-password")
                || path.equals("/api/auth/demo-accounts")
                || path.equals("/api/guide-applications")
                || path.equals("/api/guide-applications/lookup")) {
            return true;
        }
        if (path.startsWith("/api/tours") && HttpMethod.GET.matches(method)) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && !authHeader.isBlank()) {
                try {
                    AppUser user = authService.authenticateHeader(authHeader);
                    request.setAttribute(CURRENT_USER_ATTR, user);
                } catch (Exception ignored) {
                    // Public endpoint: ignore invalid token and treat as anonymous
                }
            }
            return true;
        }

        AppUser user = authService.authenticateHeader(request.getHeader("Authorization"));
        request.setAttribute(CURRENT_USER_ATTR, user);
        return true;
    }

    public static AppUser getOptionalCurrentUser(HttpServletRequest request) {
        Object attr = request.getAttribute(CURRENT_USER_ATTR);
        return (attr instanceof AppUser user) ? user : null;
    }

    public static AppUser requireCurrentUser(HttpServletRequest request) {
        Object attr = request.getAttribute(CURRENT_USER_ATTR);
        if (attr instanceof AppUser user) {
            return user;
        }
        throw new IllegalStateException("Current user missing from request context");
    }
}
