import { useState, type FormEvent } from 'react';
import type { User } from '../api/types';
import { useDemoAccountsQuery, useLoginMutation, useRegisterMutation } from './api';

export type AuthTab = 'login' | 'register';

export function useLoginForm(onSuccess: (token: string, user: User) => void) {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Login form state
  const [email, setEmail] = useState('an.nguyen@gmail.com');
  const [password, setPassword] = useState('123456');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: demos = [] } = useDemoAccountsQuery();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const loading = loginMutation.isPending || registerMutation.isPending;

  const submitLogin = async (targetEmail: string, targetPassword: string) => {
    setError('');
    setSwitchingEmail(targetEmail);
    try {
      const data = await loginMutation.mutateAsync({
        email: targetEmail.trim(),
        password: targetPassword,
      });
      onSuccess(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setSwitchingEmail(null);
    }
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitLogin(email, password);
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    void submitLogin(demoEmail, '123456');
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await registerMutation.mutateAsync({
        fullName,
        email: regEmail,
        phone: phone.trim() || undefined,
        password: regPassword,
      });
      onSuccess(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký tài khoản thất bại');
    }
  };

  const switchTab = (nextTab: AuthTab) => {
    setActiveTab(nextTab);
    setError('');
  };

  return {
    activeTab,
    switchTab,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    regEmail,
    setRegEmail,
    phone,
    setPhone,
    regPassword,
    setRegPassword,
    demos,
    loading,
    switchingEmail,
    error,
    handleLoginSubmit,
    handleDemoLogin,
    handleRegisterSubmit,
  };
}
