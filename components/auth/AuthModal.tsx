'use client';

import React, { useState } from 'react';
import { X, User, Lock, Mail, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(t.auth.invalidEmail);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success(t.auth.authSuccess, { description: `Logged in as ${email}` });
      } else {
        await register(email, password, fullName);
        toast.success(t.auth.authSuccess, { description: `Account created for ${email}` });
      }
      onClose();
    } catch {
      toast.error(t.auth.authError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (targetRole: 'customer' | 'admin') => {
    setIsLoading(true);
    const demoEmail = targetRole === 'admin' ? 'admin@bioluxe.io' : 'customer@bioluxe.io';
    const demoPassword = targetRole === 'admin' ? 'Admin123!' : 'Customer123!';
    const demoName = targetRole === 'admin' ? 'Store Admin' : 'Jane Doe';

    try {
      try {
        await login(demoEmail, demoPassword);
      } catch (_) {
        await register(demoEmail, demoPassword, demoName);
      }

      toast.success(t.auth.authSuccess, {
        description: targetRole === 'admin' ? 'Signed in as Store Admin' : 'Signed in as Customer',
      });
      onClose();
    } catch {
      toast.error(t.auth.authError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#FDFBF7] border border-[#C6DFD1] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#2E5A44] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-[#C6DFD1] uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.auth.memberAccess}</span>
          </div>
          <h3 className="font-serif text-2xl font-bold">
            {mode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
          </h3>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-[#EAF2ED] bg-[#EAF2ED]/40">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-xs font-semibold tracking-wide text-center border-b-2 transition-all ${
              mode === 'login'
                ? 'border-[#2E5A44] text-[#2E5A44] bg-[#FDFBF7]'
                : 'border-transparent text-gray-500 hover:text-[#111827]'
            }`}
          >
            {t.auth.signInBtn}
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 text-xs font-semibold tracking-wide text-center border-b-2 transition-all ${
              mode === 'register'
                ? 'border-[#2E5A44] text-[#2E5A44] bg-[#FDFBF7]'
                : 'border-transparent text-gray-500 hover:text-[#111827]'
            }`}
          >
            {t.auth.signUpBtn}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {t.auth.fullNameLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#C6DFD1] rounded-xl text-xs font-sans focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] outline-none"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t.auth.emailLabel}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#C6DFD1] rounded-xl text-xs font-sans focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] outline-none"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t.auth.passwordLabel}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#C6DFD1] rounded-xl text-xs font-sans focus:ring-2 focus:ring-[#2E5A44]/30 focus:border-[#2E5A44] outline-none"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#2E5A44] hover:bg-[#234735] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : mode === 'login' ? t.auth.signInBtn : t.auth.signUpBtn}
          </button>
        </form>

        {/* Dev / Demo Quick Access Section */}
        <div className="bg-[#EAF2ED]/60 p-6 border-t border-[#C6DFD1]/60 space-y-3">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#2E5A44] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.auth.devQuickAccess}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('customer')}
              className="py-2.5 px-3 bg-white hover:bg-gray-50 border border-[#C6DFD1] rounded-xl text-xs font-medium text-gray-800 flex items-center justify-center space-x-1.5 transition-all shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#2E5A44]" />
              <span>{t.auth.demoCustomerBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="py-2.5 px-3 bg-[#111827] hover:bg-gray-900 text-white rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.auth.demoAdminBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
