'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import type { TpoDashboardStats } from '@placement/shared';

export default function TpoDashboardPage() {
  const [stats, setStats] = useState<TpoDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<TpoDashboardStats>('/tpo/dashboard');
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load TPO dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="font-label-md text-on-surface-variant text-[14px]">
          Loading LDCE TPO Dashboard Metrics...
        </p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-space-xl bg-surface-container-lowest rounded-2xl border border-error/20 text-center space-y-3">
        <span className="material-symbols-outlined text-[40px] text-error">error</span>
        <h2 className="font-headline-sm text-on-surface font-bold text-[18px]">
          Unable to Load Placement Metrics
        </h2>
        <p className="font-body-md text-on-surface-variant text-[13px]">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
        >
          Retry
        </button>
      </div>
    );
  }

  const appStatus = stats.applicationsByStatus;
  const totalApps = stats.totalApplications || 1; // avoid divide by zero

  return (
    <div className="space-y-space-lg">
      {/* Top Banner / Hero */}
      <section className="bg-surface-container-lowest rounded-2xl p-space-lg sm:p-space-xl shadow-sm border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-[#13357b] border border-blue-200 font-label-sm text-[11px] font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#13357b] animate-pulse"></span>
              LDCE Training &amp; Placement Cell
            </span>
            <span className="text-outline text-[12px]">•</span>
            <span className="font-label-sm text-on-surface-variant font-medium text-[12px]">
              L.D. College of Engineering, Ahmedabad (Code: 028)
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight">
            LDCE TPO Dashboard
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] max-w-2xl">
            Executive placement oversight for L.D. College of Engineering: student compliance verification, eligible cohorts, campus recruitment drives, and corporate offers.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/tpo/drives/create"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Post New Drive</span>
          </Link>
          <Link
            href="/tpo/companies"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-[13px] border border-outline-variant/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">apartment</span>
            <span>Add Company</span>
          </Link>
        </div>
      </section>

      {/* Bento Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Metric 1: Total Students */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-semibold uppercase">
            <span>Registered Cohort</span>
            <span className="material-symbols-outlined text-primary text-[20px]">school</span>
          </div>
          <div className="my-2">
            <span className="font-headline-xl text-primary font-extrabold text-[28px]">
              {stats.totalStudents}
            </span>
            <span className="text-[11px] text-on-surface-variant ml-1 font-medium">Students</span>
          </div>
          <div className="text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15 flex items-center justify-between">
            <span>Regular: {stats.studentsByType.regular}</span>
            <span>D2D: {stats.studentsByType.d2d}</span>
          </div>
        </div>

        {/* Metric 2: Locked Profiles */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-semibold uppercase">
            <span>Locked Dossiers</span>
            <span className="material-symbols-outlined text-emerald-700 text-[20px]">lock</span>
          </div>
          <div className="my-2">
            <span className="font-headline-xl text-emerald-700 font-extrabold text-[28px]">
              {stats.lockedProfiles}
            </span>
            <span className="text-[11px] text-on-surface-variant ml-1 font-medium">Verified Sealed</span>
          </div>
          <div className="text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15">
            <span>Incomplete: <strong className="text-amber-700">{stats.incompleteProfiles}</strong></span>
          </div>
        </div>

        {/* Metric 3: Active Drives */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-semibold uppercase">
            <span>Live Recruitment</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">business_center</span>
          </div>
          <div className="my-2">
            <span className="font-headline-xl text-secondary font-extrabold text-[28px]">
              {stats.activeDrives}
            </span>
            <span className="text-[11px] text-on-surface-variant ml-1 font-medium">Active Drives</span>
          </div>
          <div className="text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15 flex items-center justify-between">
            <span>{stats.totalCompanies} Companies</span>
            <Link href="/tpo/drives" className="text-secondary font-semibold hover:underline">
              Manage →
            </Link>
          </div>
        </div>

        {/* Metric 4: Selections & Offers */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-semibold uppercase">
            <span>Offers Extended</span>
            <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
          </div>
          <div className="my-2">
            <span className="font-headline-xl text-primary font-extrabold text-[28px]">
              {stats.selectedStudents}
            </span>
            <span className="text-[11px] text-on-surface-variant ml-1 font-medium">Selections</span>
          </div>
          <div className="text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15 flex items-center justify-between">
            <span>Shortlisted: {stats.shortlistedStudents}</span>
            <Link href="/tpo/analytics" className="text-primary font-semibold hover:underline">
              Reports →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (7 Cols): Applications Funnel & Department Distribution */}
        <div className="lg:col-span-7 space-y-space-md">
          {/* Applications by Status Funnel */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">funnel</span>
                Application Pipeline &amp; Conversion
              </h2>
              <span className="font-label-sm text-outline text-[12px]">
                {stats.totalApplications} Total Applications
              </span>
            </div>

            {/* Pipeline Stage Bars */}
            <div className="space-y-3">
              {/* Applied */}
              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                  <span className="text-on-surface flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Applied / Initial Review
                  </span>
                  <span className="font-mono text-on-surface">
                    {appStatus.applied} ({((appStatus.applied / totalApps) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${(appStatus.applied / totalApps) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Shortlisted */}
              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                  <span className="text-amber-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Shortlisted for Technical/HR Rounds
                  </span>
                  <span className="font-mono text-amber-800">
                    {appStatus.shortlisted} ({((appStatus.shortlisted / totalApps) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${(appStatus.shortlisted / totalApps) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Selected */}
              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    Final Selection / Offer Issued
                  </span>
                  <span className="font-mono text-emerald-800">
                    {appStatus.selected} ({((appStatus.selected / totalApps) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${(appStatus.selected / totalApps) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Rejected */}
              <div>
                <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                  <span className="text-outline flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                    Not Selected in Current Cycle
                  </span>
                  <span className="font-mono text-outline">
                    {appStatus.rejected} ({((appStatus.rejected / totalApps) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gray-400 h-full rounded-full transition-all"
                    style={{ width: `${(appStatus.rejected / totalApps) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Students by Department */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">domain</span>
                LDCE Cohort by Engineering Department
              </h2>
              <Link href="/tpo/students" className="text-secondary font-semibold text-[12px] hover:underline">
                View All Students
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {Object.entries(stats.studentsByDepartment).map(([dept, count]) => (
                <div
                  key={dept}
                  className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex items-center justify-between"
                >
                  <span className="font-label-md text-on-surface font-semibold text-[13px] truncate">
                    {dept}
                  </span>
                  <span className="font-headline-sm text-primary font-mono font-bold text-[14px]">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Real-time TPO Activity Stream */}
        <div className="lg:col-span-5 space-y-space-md">
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">stream</span>
                LDCE Placement Activity &amp; Audit Log
              </h2>
              <Link href="/tpo/notifications" className="font-label-sm text-secondary hover:underline text-[11px] font-bold">
                View All
              </Link>
            </div>

            {stats.recentActivity.length === 0 ? (
              <p className="text-center text-outline text-[13px] py-8">No recent activity events recorded.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((act) => {
                  let icon = 'notifications';
                  let iconBg = 'bg-primary-fixed text-on-primary-fixed';
                  if (act.type === 'APPLICATION') {
                    icon = 'assignment';
                    iconBg = 'bg-blue-100 text-blue-800';
                  } else if (act.type === 'DRIVE') {
                    icon = 'business_center';
                    iconBg = 'bg-purple-100 text-purple-800';
                  } else if (act.type === 'COMPANY') {
                    icon = 'apartment';
                    iconBg = 'bg-amber-100 text-amber-800';
                  }

                  return (
                    <div key={act.id} className="flex items-start gap-3 text-[12px] p-2 rounded-xl hover:bg-surface-container-low/40 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                        <span className="material-symbols-outlined text-[17px]">{icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-primary text-[13px]">{act.title}</span>
                        <p className="text-on-surface-variant leading-snug mt-0.5">{act.description}</p>
                        <span className="text-outline text-[10px] mt-1">
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
