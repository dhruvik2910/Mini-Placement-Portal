'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';

export default function TpoSettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
            <Link href="/tpo" className="hover:text-primary transition-colors">
              LDCE Training &amp; Placement Cell
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Portal Settings</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            TPO Office Settings &amp; Institutional Governance
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Configure placement cell parameters, review GTU Academic Year 2024-25 placement policy charters, and manage officer credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Left Column: Officer Profile Card */}
        <div className="space-y-space-md">
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-[22px] shadow-xs">
                {user?.tpoProfile?.fullName?.[0] || 'T'}
              </div>
              <div>
                <h2 className="font-headline-sm text-[#13357b] font-bold text-[17px] leading-tight">
                  {user?.tpoProfile?.fullName || 'Placement Officer'}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold mt-1">
                  {user?.tpoProfile?.designation || 'Head TPO'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-outline-variant/15 text-[13px]">
              <div>
                <span className="text-outline text-[11px] font-semibold block">Official Email</span>
                <span className="font-medium text-on-surface">{user?.email || 'tpo@placement.edu'}</span>
              </div>
              <div>
                <span className="text-outline text-[11px] font-semibold block">Department Affiliation</span>
                <span className="font-medium text-on-surface">
                  {user?.tpoProfile?.department || 'Training & Placement Cell'}
                </span>
              </div>
              <div>
                <span className="text-outline text-[11px] font-semibold block">Contact Extension</span>
                <span className="font-medium text-on-surface">{user?.tpoProfile?.phone || '+91-79-26306752'}</span>
              </div>
              <div>
                <span className="text-outline text-[11px] font-semibold block">Role Authorization</span>
                <span className="font-bold text-primary font-mono text-[12px]">CENTRAL_TPO (GTU Code 028)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/15">
              <button
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-xl bg-error-container text-on-error-container hover:bg-error hover:text-white font-bold text-[13px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign Out of Placement Cell</span>
              </button>
            </div>
          </div>

          {/* Institutional Crest Card */}
          <div className="bg-[#13357b] text-white rounded-2xl p-space-lg shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/20 text-white font-mono font-bold text-[11px]">
                CODE: 028
              </span>
              <span className="text-[12px] text-white/80 font-semibold">ESTD. 1948</span>
            </div>
            <h3 className="font-headline-sm font-bold text-[16px] text-white leading-snug">
              L.D. College of Engineering
            </h3>
            <p className="text-[12px] text-white/80 leading-relaxed">
              Opp. Gujarat University, Navrangpura, Ahmedabad - 380015, Gujarat, India.
            </p>
            <div className="pt-2 border-t border-white/10 text-[11px] text-white/70">
              Approved by AICTE • Affiliated with Gujarat Technological University (GTU)
            </div>
          </div>
        </div>

        {/* Right Columns: Placement Season Rules & Configuration */}
        <div className="lg:col-span-2 space-y-space-md">
          {/* Active Season Config */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-primary font-bold text-[17px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">tune</span>
                Active Recruitment Season Configuration
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                LIVE SEASON
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">Academic Year</span>
                <span className="font-bold text-on-surface text-[15px]">2024 – 2025</span>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Active graduating cohort: Batch 2024 &amp; 2025 across all 12 LDCE departments.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">Candidate Registration Window</span>
                <span className="font-bold text-on-surface text-[15px]">OPEN / ACTIVE</span>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Students may seal/lock profiles for TPO verification and campus drives.
                </p>
              </div>
            </div>
          </div>

          {/* LDCE Placement Policy Charter */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-4">
            <h2 className="font-headline-sm text-primary font-bold text-[17px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">gavel</span>
              LDCE Institutional Placement Policy Charter
            </h2>

            <div className="space-y-3 text-[13px] text-on-surface">
              <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">1</span>
                  <span className="font-bold text-primary">One-Student-One-Job Policy</span>
                </div>
                <p className="text-on-surface-variant text-[12px] leading-relaxed pl-7">
                  To ensure equitable opportunity across all LDCE candidates, once a student accepts a campus offer, they are automatically designated as Placed.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">2</span>
                  <span className="font-bold text-primary">Dream Offer Provision (&gt; ₹10.0 LPA)</span>
                </div>
                <p className="text-on-surface-variant text-[12px] leading-relaxed pl-7">
                  Placed students holding an offer below ₹10.0 LPA may apply for a maximum of 1 additional Dream Tier recruitment drive offering ₹10.0 LPA or higher.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">3</span>
                  <span className="font-bold text-primary">Strict Profile Locking &amp; Compliance Audit</span>
                </div>
                <p className="text-on-surface-variant text-[12px] leading-relaxed pl-7">
                  Students cannot modify academic marks (10th, 12th, D2D, CGPA) after sealing their profile. Any discrepancy detected by TPO results in immediate profile rejection and drive disqualification.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">4</span>
                  <span className="font-bold text-primary">Lateral Entry (D2D) Parity</span>
                </div>
                <p className="text-on-surface-variant text-[12px] leading-relaxed pl-7">
                  In accordance with GTU admission standards, Diploma to Degree (D2D) students are evaluated based on their Final Diploma CGPA in lieu of 12th Board marks.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-3">
            <h3 className="font-headline-sm text-primary font-bold text-[15px]">
              TPO Administrative Shortcuts
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/tpo/students"
                className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[13px] border border-outline-variant/30 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span>Student Directory</span>
              </Link>
              <Link
                href="/tpo/drives/create"
                className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[13px] border border-outline-variant/30 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Create Campus Drive</span>
              </Link>
              <Link
                href="/tpo/analytics"
                className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[13px] border border-outline-variant/30 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">insights</span>
                <span>Placement Analytics</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
