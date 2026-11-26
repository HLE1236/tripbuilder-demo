import { useState, type FormEvent } from 'react';
import type { AuthResponse } from '../api';
import { useLoginMutation } from './api/useAuthQueries';

export function useLoginForm(
  onSuccess: (auth: AuthResponse, rememberMe: boolean) => void
) {
  const [email, setEmail] = useState('admin@tripbuilder.vn');
  const [password, setPassword] = useState('123456');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLoginMutation();

  async function submitLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    try {
      const res = await loginMutation.mutateAsync({
        email: loginEmail.trim(),
        password: loginPassword,
        expectedRole: 'ADMIN',
        rememberMe,
      });
      if (res.user.role !== 'ADMIN') {
        setError('Tài khoản này không có quyền Quản trị hệ thống.');
        return;
      }
      onSuccess(res, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    void submitLogin(email, password);
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    showPassword,
    setShowPassword,
    submitting: loginMutation.isPending,
    error,
    handleFormSubmit,
  };
}
