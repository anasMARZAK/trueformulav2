'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/storefront/Header';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useCartStore } from '@/lib/store/useCartStore';
import { toast } from 'sonner';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  RefreshCw,
  Award,
} from 'lucide-react';

export default function LoginPage() {
  const { t, language } = useLanguage();
  const { login, register, switchRole } = useAuth();
  const openCart = useCartStore((state) => state.openCart);
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(language === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success(language === 'fr' ? 'Connexion réussie' : 'Welcome Back!', {
          description: language === 'fr' ? `Connecté en tant que ${email}` : `Signed in as ${email}`,
        });
      } else {
        await register(email, password, fullName);
        toast.success(language === 'fr' ? 'Compte créé avec succès' : 'Account Created!', {
          description: language === 'fr' ? `Bienvenue chez TRUE FORMULA, ${fullName || email}` : `Welcome to TRUE FORMULA, ${fullName || email}`,
        });
      }
      router.push('/account');
    } catch (err: any) {
      toast.error(language === 'fr' ? 'Erreur d’authentification' : 'Authentication Error', {
        description: err.message || (language === 'fr' ? 'Identifiants invalides' : 'Invalid email or password'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (role: 'customer' | 'admin') => {
    setIsLoading(true);
    const demoEmail = role === 'admin' ? 'admin@proteinshop.com' : 'customer@proteinshop.com';
    const demoPassword = role === 'admin' ? 'Admin123!' : 'Customer123!';
    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      await login(demoEmail, demoPassword);
      toast.success(language === 'fr' ? 'Connexion réussie' : 'Demo Access Granted', {
        description: role === 'admin' ? 'Signed in as Store Administrator' : 'Signed in as Customer',
      });
      router.push(role === 'admin' ? '/admin' : '/account');
    } catch (err: any) {
      // Fallback role switch if auth service offline
      switchRole(role);
      toast.success(language === 'fr' ? 'Mode démo activé' : 'Demo Mode Active', {
        description: role === 'admin' ? 'Signed in as Store Administrator' : 'Signed in as Member',
      });
      router.push(role === 'admin' ? '/admin' : '/account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#111827] flex flex-col justify-between">
      <div>
        <Header onOpenCart={openCart} />

        {/* Main Authentication Studio Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] border border-[#EAF2ED] shadow-luxe overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Column — Editorial Brand Hero Panel */}
            <div className="lg:col-span-5 bg-[#2E5A44] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#C6DFD1]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-[#C6DFD1]" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C6DFD1]">
                    {language === 'fr' ? 'ESPACE MEMBRE ÉLITE' : 'MEMBER ACCESS'}
                  </span>
                </div>

                <div className="space-y-3">
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#FDFBF7]">
                    TRUE FORMULA
                  </h1>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#C6DFD1] font-semibold">
                    PHARMACEUTICAL-GRADE NUTRITION
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-[#EAF2ED]/85 leading-relaxed font-light">
                  {language === 'fr'
                    ? 'Accédez à vos abonnements, suivez vos commandes en temps réel et profitez de 20% de remise exclusive.'
                    : 'Manage your monthly subscriptions, track orders in real-time, and unlock 20% off every recurring formulation.'}
                </p>
              </div>

              {/* Member Perks List */}
              <div className="space-y-3.5 my-8 relative z-10 border-t border-b border-white/15 py-6">
                {[
                  { icon: Zap, label: language === 'fr' ? '20% de remise automatique sur abonnements' : '20% automatic discount on all subscriptions' },
                  { icon: ShieldCheck, label: language === 'fr' ? 'Suivi de commande & historique en 1 clic' : 'Real-time order tracking & portal access' },
                  { icon: Award, label: language === 'fr' ? 'Accès prioritaire aux nouveautés bio-luxe' : 'Priority access to native formulation drops' },
                ].map((perk, i) => (
                  <div key={i} className="flex items-center space-x-3 text-xs text-[#EAF2ED]">
                    <perk.icon className="w-4 h-4 text-[#C6DFD1] shrink-0" />
                    <span>{perk.label}</span>
                  </div>
                ))}
              </div>

              {/* Security Seal */}
              <div className="flex items-center space-x-2 text-[11px] text-[#C6DFD1] opacity-80 relative z-10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{language === 'fr' ? 'Connexion 100% sécurisée Supabase SSL' : '100% Encrypted Supabase SSL Authentication'}</span>
              </div>
            </div>

            {/* Right Column — Auth Form Panel */}
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-[#FDFBF7]">
              <div>
                {/* Form Mode Selector Tabs */}
                <div className="flex items-center space-x-2 bg-white p-1.5 rounded-full border border-[#EAF2ED] mb-8 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
                      mode === 'login'
                        ? 'bg-[#111827] text-white shadow-md'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    {language === 'fr' ? 'Se Connecter' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
                      mode === 'register'
                        ? 'bg-[#111827] text-white shadow-md'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    {language === 'fr' ? 'Créer un Compte' : 'Create Account'}
                  </button>
                </div>

                <div className="space-y-2 mb-6">
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#111827] font-bold">
                    {mode === 'login'
                      ? (language === 'fr' ? 'Bienvenue à nouveau' : 'Welcome Back')
                      : (language === 'fr' ? 'Rejoindre TRUE FORMULA' : 'Join TRUE FORMULA')}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4B5563]">
                    {mode === 'login'
                      ? (language === 'fr' ? 'Entrez vos identifiants pour accéder à votre profil' : 'Enter your credentials to access your account')
                      : (language === 'fr' ? 'Créez votre compte en quelques secondes' : 'Set up your member account in seconds')}
                  </p>
                </div>

                {/* Form Inputs */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                        {language === 'fr' ? 'Nom Complet' : 'Full Name'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Marcus Vance"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-[#C6DFD1] rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E5A44]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                      {language === 'fr' ? 'Adresse Email' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#C6DFD1] rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E5A44]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                      {language === 'fr' ? 'Mot de passe' : 'Password'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#C6DFD1] rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E5A44]"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-[#111827] hover:bg-[#1f2937] text-white font-bold rounded-xl shadow-luxe transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer mt-6 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-[#C6DFD1]" />
                    ) : (
                      <>
                        <span>
                          {mode === 'login'
                            ? (language === 'fr' ? 'Se Connecter' : 'Sign In to Account')
                            : (language === 'fr' ? 'Créer mon Compte' : 'Create Member Account')}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#C6DFD1]" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Demo Sign-In Quick Access Panel */}
              <div className="mt-8 pt-6 border-t border-[#EAF2ED]">
                <p className="text-[11px] text-[#4B5563] uppercase tracking-wider font-bold mb-3">
                  {language === 'fr' ? 'Accès Démo Rapide' : 'Quick Demo Access Options'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDemoSignIn('customer')}
                    className="px-3.5 py-2.5 bg-white border border-[#C6DFD1] hover:border-[#2E5A44] hover:bg-[#EAF2ED] text-[#111827] rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    👤 {language === 'fr' ? 'Démo Client' : 'Customer Demo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoSignIn('admin')}
                    className="px-3.5 py-2.5 bg-[#2E5A44] hover:bg-[#234735] text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-2xs"
                  >
                    🛡️ {language === 'fr' ? 'Démo Admin' : 'Admin Demo'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
