import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { apiClient, setupInterceptors } from './api';
import { queryClient } from './config/query-client';
import './styles/index.css';
import App from './App';

setupInterceptors(apiClient);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
