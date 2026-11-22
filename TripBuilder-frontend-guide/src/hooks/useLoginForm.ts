import { useState, type FormEvent } from 'react';
import type { User } from '@/api/types';
import { useDemoAccountsQuery, useLoginMutation } from '@/hooks/api';

interface UseLoginFormOptions {
  onSuccess: (token: string, user: User) => void;
}

export function useLoginForm({ onSuccess }: UseLoginFormOptions) {
  const [email, setEmail] = useState('binh.guide@tripbuilder.vn');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const { data: demos = [] } = useDemoAccountsQuery();
  const loginMutation = useLoginMutation();

  const submitLogin = async (targetEmail: string, targetPassword: string) => {
    setError('');
    try {
      const data = await loginMutation.mutateAsync({
        email: targetEmail.trim(),
        password: targetPassword,
      });
      onSuccess(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitLogin(email, password);
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    void submitLogin(demoEmail, '123456');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    demos,
    loading: loginMutation.isPending,
    error,
    handleSubmit,
    handleDemoLogin,
  };
}
