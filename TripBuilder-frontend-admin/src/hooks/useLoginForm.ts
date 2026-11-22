import { useState, type FormEvent } from 'react';
import type { DemoAccount, User } from '../api';
import { useDemoAccountsQuery, useLoginMutation } from './api/useAuthQueries';

export function useLoginForm(onSuccess: (token: string, user: User) => void) {
  const [email, setEmail] = useState('admin@tripbuilder.vn');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);

  const demoAccountsQuery = useDemoAccountsQuery('ADMIN');
  const loginMutation = useLoginMutation();

  async function submitLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    try {
      const res = await loginMutation.mutateAsync({
        email: loginEmail.trim(),
        password: loginPassword,
        expectedRole: 'ADMIN',
      });
      if (res.user.role !== 'ADMIN') {
        setError('Tài khoản này không có quyền Quản trị hệ thống.');
        return;
      }
      onSuccess(res.token, res.user);
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

  function handleQuickLogin(acc: DemoAccount) {
    setEmail(acc.email);
    setPassword('123456');
    void submitLogin(acc.email, '123456');
  }

  return {
    accounts: demoAccountsQuery.data ?? [],
    loadingAccounts: demoAccountsQuery.isLoading,
    email,
    setEmail,
    password,
    setPassword,
    submitting: loginMutation.isPending,
    error,
    handleFormSubmit,
    handleQuickLogin,
  };
}
