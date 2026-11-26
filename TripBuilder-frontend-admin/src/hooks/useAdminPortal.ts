import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logoutApi, setUnauthorizedHandler, type AuthResponse } from '../api';
import { getRefreshToken } from '../config/storage/auth-storage';
import { useAdminUiStore, useAuthStore, useThemeStore } from '../stores';
import { useMeQuery } from './api/useAuthQueries';

export function useAdminPortal() {
  const queryClient = useQueryClient();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const bootstrapping = useAuthStore((s) => s.bootstrapping);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);
  const clearSession = useAuthStore((s) => s.clearSession);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const activeTab = useAdminUiStore((s) => s.activeTab);
  const setActiveTab = useAdminUiStore((s) => s.setActiveTab);
  const resetUiState = useAdminUiStore((s) => s.resetUiState);

  const shouldBootstrap = Boolean(token) && !user;
  const meQuery = useMeQuery(shouldBootstrap);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleLogout = useCallback(() => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      void logoutApi({ refreshToken }).catch(() => {});
    }
    clearSession();
    resetUiState();
    queryClient.clear();
  }, [clearSession, resetUiState, queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
    return () => setUnauthorizedHandler(null);
  }, [handleLogout]);

  useEffect(() => {
    if (!shouldBootstrap) {
      if (bootstrapping) {
        setBootstrapping(false);
      }
      return;
    }

    if (meQuery.isSuccess) {
      if (meQuery.data.role === 'ADMIN') {
        setUser(meQuery.data);
        setBootstrapping(false);
      } else {
        clearSession();
      }
    } else if (meQuery.isError) {
      clearSession();
    }
  }, [
    shouldBootstrap,
    bootstrapping,
    meQuery.isSuccess,
    meQuery.isError,
    meQuery.data,
    setUser,
    setBootstrapping,
    clearSession,
  ]);

  const applyingPopstateRef = useRef(false);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const applyFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab === 'overview' || urlTab === 'users' || urlTab === 'operations' || urlTab === 'catalog') {
        applyingPopstateRef.current = true;
        setActiveTab(urlTab);
        queueMicrotask(() => {
          applyingPopstateRef.current = false;
        });
      }
    };
    applyFromUrl();
    window.addEventListener('popstate', applyFromUrl);
    return () => window.removeEventListener('popstate', applyFromUrl);
  }, [user, setActiveTab]);

  useEffect(() => {
    if (!user || typeof window === 'undefined' || applyingPopstateRef.current) return;
    const params = new URLSearchParams();
    if (activeTab !== 'overview') params.set('tab', activeTab);
    const qs = params.toString();
    const targetUrl = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    if (targetUrl !== currentUrl) {
      window.history.pushState({}, '', targetUrl);
    }
  }, [user, activeTab]);

  const handleLoginSuccess = useCallback(
    (auth: AuthResponse, rememberMe: boolean) => {
      setSession(auth, rememberMe);
    },
    [setSession]
  );

  return {
    user,
    bootstrapping,
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    handleLoginSuccess,
    handleLogout,
  };
}
