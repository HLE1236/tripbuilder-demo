import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler, type User } from '../api';
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

  const handleLoginSuccess = useCallback(
    (newToken: string, loggedInUser: User) => {
      setSession(newToken, loggedInUser);
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
