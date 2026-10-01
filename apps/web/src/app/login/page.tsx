'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-space-md">
        {/* Crest & Header */}
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-14 h-14 rounded-2xl bg-[#13357b] flex items-center justify-center text-white font-extrabold text-[20px] shadow-sm tracking-tighter mb-2">
            <span>LDCE</span>
          </div>
          <span className="font-label-sm uppercase tracking-wider text-outline text-[11px] font-bold">
            Training &amp; Placement Cell
          </span>
          <h1 className="font-headline-lg text-[#13357b] font-extrabold text-[26px]">
            LDCE Placement Portal
          </h1>
          <p className="font-body-sm text-on-surface-variant text-[13px]">
            L.D. College of Engineering, Ahmedabad (GTU Code: 028)
          </p>
          <p className="font-body-sm text-outline text-[12px] max-w-sm mt-0.5">
            Sign in with your LDCE institutional credentials to access placement drives, manage eligibility, and review applications.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
          {error && (
            <div className="p-3 rounded-lg bg-error-container/30 border border-error/20 flex items-center gap-2 text-error text-[13px] font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                Institutional Student Email
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                  mail
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.mehta@student.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[14px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                  lock
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[14px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-11 px-4 rounded-xl bg-secondary text-on-secondary hover:bg-secondary-container transition-colors shadow-sm font-label-md text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
              <span>{loading ? 'Authenticating...' : 'Sign In to Student Portal'}</span>
            </button>
          </form>

          {/* Registration link */}
          <div className="text-center text-[13px] text-on-surface-variant pt-2 border-t border-outline-variant/20">
            Don&apos;t have a student account?{' '}
            <Link href="/register" className="text-secondary font-semibold hover:underline">
              Register Academic Account
            </Link>
          </div>
        </div>

        {/* Demo Quick-Fill Accounts */}
        <div className="bg-surface-container-low/70 rounded-xl p-space-sm border border-outline-variant/20 flex flex-col gap-2">
          <span className="font-label-sm uppercase tracking-wider text-outline text-[10px] font-bold text-center">
            Demo Credentials (1-Click Fill)
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => fillDemoAccount('tpo@placement.edu')}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-left text-[12px] flex items-center justify-between border border-amber-300 transition-colors cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
                  Prof. A. S. Sharma (Convener, TPO LDCE)
                </span>
                <span className="text-amber-800 text-[11px]">LDCE Training &amp; Placement Cell • TPO Access</span>
              </div>
              <span className="material-symbols-outlined text-amber-700 text-[16px]">touch_app</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('rahul.mehta@student.edu')}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-left text-[12px] flex items-center justify-between border border-outline-variant/20 transition-colors cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-primary">Rahul Mehta (LDCE Computer Engg)</span>
                <span className="text-on-surface-variant text-[11px]">Regular • CGPA 8.85 • Profile Locked &amp; Verified</span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[16px]">touch_app</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('priya.patel@student.edu')}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-left text-[12px] flex items-center justify-between border border-outline-variant/20 transition-colors cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-primary">Priya Patel (LDCE Information Tech)</span>
                <span className="text-on-surface-variant text-[11px]">D2D Lateral • CGPA 7.65 • Profile Draft</span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[16px]">touch_app</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('amit.kumar@student.edu')}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-left text-[12px] flex items-center justify-between border border-outline-variant/20 transition-colors cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-primary">Amit Kumar (LDCE Electronics &amp; Comm)</span>
                <span className="text-on-surface-variant text-[11px]">Regular • CGPA 6.40 • 2 Active Backlogs</span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[16px]">touch_app</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
