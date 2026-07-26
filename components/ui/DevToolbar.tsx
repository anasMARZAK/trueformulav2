'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Mail,
  Zap,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export function DevToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [simMode, setSimMode] = useState<'always_success' | 'force_failure'>('always_success');
  const [isLoadingSim, setIsLoadingSim] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Fetch initial simulation mode on mount
  useEffect(() => {
    fetch('/api/dev/simulation-mode')
      .then((res) => res.json())
      .then((data) => {
        if (data.mode) {
          setSimMode(data.mode);
        }
      })
      .catch((err) => console.error('[DEV TOOLBAR] Failed to fetch simulation mode:', err));
  }, []);

  const handleToggleSimMode = async (newMode: 'always_success' | 'force_failure') => {
    if (newMode === simMode) return;
    setIsLoadingSim(true);
    try {
      const res = await fetch('/api/dev/simulation-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
      const data = await res.json();
      if (data.success) {
        setSimMode(data.mode);
        toast.success(
          newMode === 'always_success'
            ? 'Payment Mode: Always Success'
            : 'Payment Mode: Force Payment Failure',
          {
            description:
              newMode === 'always_success'
                ? 'Mock payments will authorize instantly.'
                : 'All mock checkout attempts will now be declined.',
          }
        );
      } else {
        toast.error('Failed to change simulation mode', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Error changing simulation mode', { description: err.message });
    } finally {
      setIsLoadingSim(false);
    }
  };

  const handleFastForward = async () => {
    setIsFastForwarding(true);
    try {
      const res = await fetch('/api/dev/fast-forward-subscriptions', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Subscription Dates Fast-Forwarded', {
          description: data.message || `Updated active subscriptions to past billing date.`,
        });
      } else {
        toast.error('Fast-Forward Failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Fast-Forward Error', { description: err.message });
    } finally {
      setIsFastForwarding(false);
    }
  };

  const handleRunRenewalCron = async () => {
    setIsRunningCron(true);
    try {
      const res = await fetch('/api/cron/renew-subscriptions', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        const count = data.processedCount || 0;
        if (count > 0) {
          toast.success(`Renewal Cron Complete: ${count} Subscription(s) Renewed`, {
            description: `Generated order IDs: ${data.orderIds ? data.orderIds.join(', ') : 'None'}`,
          });
        } else {
          toast.info('Renewal Cron Executed', {
            description: 'No active subscriptions were due for renewal. Click "Fast-Forward Subscription Dates" first to make subscriptions due.',
          });
        }
      } else {
        toast.error('Renewal Cron Execution Failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Renewal Cron Error', { description: err.message });
    } finally {
      setIsRunningCron(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/dev/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'customer@example.com', language: 'en' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Test Email Dispatched', {
          description: `Dispatched to customer@example.com (Log ID: ${data.id})`,
        });
      } else {
        toast.error('Test Email Failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Test Email Error', { description: err.message });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Collapsible Panel */}
      {isOpen ? (
        <div className="bg-[#111827] text-white border border-[#2E5A44] rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Toolbar Header */}
          <div className="bg-[#1E293B] px-4 py-3 border-b border-[#2E5A44]/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-serif font-bold text-sm tracking-wide text-[#EAF2ED]">
                Dev Engine Toolbar
              </span>
              <span className="text-[10px] bg-[#2E5A44] text-white font-mono px-1.5 py-0.5 rounded">
                R3 / M4
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-700/60 rounded-lg text-gray-400 hover:text-white transition-colors"
              aria-label="Minimize toolbar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Toolbar Body */}
          <div className="p-4 space-y-4 text-xs">
            {/* Payment Simulation Mode */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-between">
                <span>Payment Simulation Mode</span>
                {simMode === 'force_failure' ? (
                  <span className="text-red-400 font-semibold flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>FORCE FAIL</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>SUCCESS</span>
                  </span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-2 bg-[#0F172A] p-1 rounded-xl border border-gray-800">
                <button
                  type="button"
                  disabled={isLoadingSim}
                  onClick={() => handleToggleSimMode('always_success')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    simMode === 'always_success'
                      ? 'bg-emerald-600 text-white shadow-md font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Always Success</span>
                </button>

                <button
                  type="button"
                  disabled={isLoadingSim}
                  onClick={() => handleToggleSimMode('force_failure')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    simMode === 'force_failure'
                      ? 'bg-red-600 text-white shadow-md font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Force Failure</span>
                </button>
              </div>
            </div>

            <hr className="border-gray-800" />

            {/* Quick Actions */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                Subscription & Renewal Actions
              </label>

              <div className="space-y-2">
                {/* Fast-Forward Subscriptions */}
                <button
                  type="button"
                  disabled={isFastForwarding}
                  onClick={handleFastForward}
                  className="w-full py-2.5 px-3 bg-[#1E293B] hover:bg-[#2A374D] border border-gray-700/60 rounded-xl text-left text-xs font-semibold text-gray-200 hover:text-white flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    {isFastForwarding ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400" />
                    )}
                    <span>Fast-Forward Subscription Dates</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Set to past</span>
                </button>

                {/* Force Run Renewal Cron */}
                <button
                  type="button"
                  disabled={isRunningCron}
                  onClick={handleRunRenewalCron}
                  className="w-full py-2.5 px-3 bg-[#2E5A44]/30 hover:bg-[#2E5A44]/50 border border-[#2E5A44]/60 rounded-xl text-left text-xs font-semibold text-emerald-200 hover:text-white flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    {isRunningCron ? (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Force Run Renewal Cron</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-mono">/api/cron</span>
                </button>
              </div>
            </div>

            <hr className="border-gray-800" />

            {/* Email Test */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                Email Notification Service
              </label>

              <button
                type="button"
                disabled={isSendingEmail}
                onClick={handleSendTestEmail}
                className="w-full py-2.5 px-3 bg-[#1E293B] hover:bg-[#2A374D] border border-gray-700/60 rounded-xl text-left text-xs font-semibold text-gray-200 hover:text-white flex items-center justify-between transition-colors disabled:opacity-50"
              >
                <div className="flex items-center space-x-2">
                  {isSendingEmail ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 text-blue-400" />
                  )}
                  <span>Send Test Email</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Resend API</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Floating Trigger */
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#111827] hover:bg-[#1E293B] text-white border border-[#2E5A44] px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-bold transition-all hover:scale-105"
        >
          <Wrench className="w-4 h-4 text-emerald-400" />
          <span>Dev Engine Toolbar</span>
          <span
            className={`w-2 h-2 rounded-full ${
              simMode === 'force_failure' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          />
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}
