import { useState, type FormEvent } from 'react';
import type { AuthResponse } from '@/api/types';
import { useLoginMutation } from '@/hooks/api';

interface UseLoginFormOptions {
  onSuccess: (auth: AuthResponse, rememberMe: boolean) => void;
}

export function useLoginForm({ onSuccess }: UseLoginFormOptions) {
  const [email, setEmail] = useState('binh.guide@tripbuilder.vn');
  const [password, setPassword] = useState('123456');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useLoginMutation();

  const submitLogin = async (targetEmail: string, targetPassword: string) => {
    setError('');
    try {
      const data = await loginMutation.mutateAsync({
        email: targetEmail.trim(),
        password: targetPassword,
        rememberMe,
      });
      onSuccess(data, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitLogin(email, password);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    loading: loginMutation.isPending,
    error,
    handleSubmit,
  };
}
