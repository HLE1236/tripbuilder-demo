import { useState, type FormEvent } from 'react';
import type { AuthResponse } from '../api/types';
import { useLoginMutation } from './api';

export function useLoginForm(onSuccess: (data: AuthResponse, rememberMe: boolean) => void) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const loginMutation = useLoginMutation();

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
        rememberMe,
      });
      onSuccess(data, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    loading: loginMutation.isPending,
    error,
    handleLoginSubmit,
  };
}
