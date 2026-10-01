'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { TpoAnalyticsDto } from '@placement/shared';

export default function TpoAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TpoAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<TpoAnalyticsDto>('/tpo/analytics');
      setAnalytics(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load placement analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="font-label-md text-on-surface-variant text-[14px]">Compiling LDCE Placement Analytics &amp; Reports...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-space-xl bg-surface-container-lowest rounded-2xl border border-error/20 text-center space-y-3">
        <span className="material-symbols-outlined text-[40px] text-error">error</span>
        <h2 className="font-headline-sm text-on-surface font-bold text-[18px]">Analytics Unavailable</h2>
        <p className="font-body-md text-on-surface-variant text-[13px]">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
        >
          Retry
        </button>
      </div>
    );
  }

  const funnel = analytics.statusFunnel;
  const totalFunnel = (funnel.applied + funnel.shortlisted + funnel.selected + funnel.rejected) || 1;

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
            <span className="text-primary font-bold">Placement Analytics</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            LDCE Placement Analytics &amp; Reports
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Official placement statistics, branch performance benchmarks, corporate recruitment ratios, and selection conversions for L.D. College of Engineering, Ahmedabad.
          </p>
        </div>
      </div>

      {/* 4 Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-outline text-[11px] font-semibold uppercase">Overall Placement Rate</span>
          <div className="my-2">
            <span className="font-headline-xl text-emerald-700 font-extrabold text-[32px]">
              {analytics.placementRate}%
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15">
            Placed: <strong>{analytics.placedStudents}</strong> of {analytics.totalStudents}
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-outline text-[11px] font-semibold uppercase">Average Package</span>
          <div className="my-2">
            <span className="font-headline-xl text-primary font-extrabold text-[32px]">
              ₹{analytics.averagePackageLpa}
            </span>
            <span className="text-[12px] text-on-surface-variant ml-1 font-medium">LPA</span>
          </div>
          <span className="text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15">
            Mean of confirmed offers
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-outline text-[11px] font-semibold uppercase">Highest Package</span>
          <div className="my-2">
            <span className="font-headline-xl text-purple-700 font-extrabold text-[32px]">
              ₹{analytics.highestPackageLpa}
            </span>
            <span className="text-[12px] text-on-surface-variant ml-1 font-medium">LPA</span>
          </div>
          <span className="text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15">
            Premier corporate tier
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-outline text-[11px] font-semibold uppercase">Total Selections</span>
          <div className="my-2">
            <span className="font-headline-xl text-primary font-extrabold text-[32px]">
              {analytics.statusFunnel.selected}
            </span>
            <span className="text-[12px] text-on-surface-variant ml-1 font-medium">Offers</span>
          </div>
          <span className="text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15">
            Across {analytics.companyStats.length} recruiting partners
          </span>
        </div>
      </div>

      {/* Department-wise Placement Table */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
        <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">school</span>
          Department Placement Benchmarks
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-outline uppercase tracking-wider text-[11px] font-bold">
                <th className="py-2.5 px-4">Department Track</th>
                <th className="py-2.5 px-4 text-center">Cohort Size</th>
                <th className="py-2.5 px-4 text-center">Placed</th>
                <th className="py-2.5 px-4 text-center">Average CGPA</th>
                <th className="py-2.5 px-4 text-right">Placement %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-on-surface">
              {analytics.departmentStats.map((d) => (
                <tr key={d.department} className="hover:bg-surface-container-low/40">
                  <td className="py-3 px-4 font-semibold text-primary">{d.department}</td>
                  <td className="py-3 px-4 text-center font-mono">{d.total}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-800">{d.placed}</td>
                  <td className="py-3 px-4 text-center font-mono">{d.avgCgpa}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 bg-surface-container-low h-2 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${d.placementRate}%` }}
                        ></div>
                      </div>
                      <span className="font-mono font-bold text-[13px]">{d.placementRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic Distribution Row: Regular vs D2D, CGPA Spectrum, and Backlog Spectrum */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Regular vs D2D */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-outline text-[11px] font-semibold uppercase">Cohort Composition</span>
            <span className="material-symbols-outlined text-primary text-[18px]">group</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <span className="font-headline-md font-bold text-primary text-[20px] block">
                {analytics.studentsByType?.regular ?? 0}
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">Regular 4-Year</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <span className="font-headline-md font-bold text-secondary text-[20px] block">
                {analytics.studentsByType?.d2d ?? 0}
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">Lateral D2D</span>
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant text-center pt-1 border-t border-outline-variant/15">
            Total {analytics.totalStudents} enrolled LDCE engineering candidates
          </p>
        </div>

        {/* CGPA Distribution */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-outline text-[11px] font-semibold uppercase">CGPA Distribution</span>
            <span className="material-symbols-outlined text-primary text-[18px]">grade</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {analytics.cgpaDistribution?.map((item) => {
              const pct = analytics.totalStudents > 0 ? (item.count / analytics.totalStudents) * 100 : 0;
              return (
                <div key={item.range} className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between font-medium">
                    <span className="text-on-surface">{item.range}</span>
                    <span className="text-primary font-bold">{item.count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Backlog Distribution */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-outline text-[11px] font-semibold uppercase">Backlog Distribution</span>
            <span className="material-symbols-outlined text-primary text-[18px]">history_edu</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {analytics.backlogDistribution?.map((item) => {
              const pct = analytics.totalStudents > 0 ? (item.count / analytics.totalStudents) * 100 : 0;
              return (
                <div key={item.range} className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between font-medium">
                    <span className="text-on-surface">{item.range}</span>
                    <span className="text-emerald-800 font-bold">{item.count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.range.includes('Clear')
                          ? 'bg-emerald-600'
                          : item.range.includes('1 - 2')
                          ? 'bg-amber-500'
                          : 'bg-error'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Columns: Recruiter Performance & Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Recruiter Hiring Table */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
          <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">leaderboard</span>
            Corporate Hiring Performance
          </h2>

          <div className="space-y-2">
            {analytics.companyStats.map((c) => (
              <div
                key={c.companyName}
                className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex items-center justify-between gap-3 text-[13px]"
              >
                <div>
                  <span className="font-bold text-primary block leading-tight">{c.companyName}</span>
                  <span className="text-[11px] text-on-surface-variant">
                    {c.drivesCount} Drive(s) • {c.applicationsCount} Applications
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-emerald-800 text-[15px] block">
                    {c.selectionsCount}
                  </span>
                  <span className="text-[10px] text-outline font-semibold uppercase">Offers Confirmed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selection Funnel */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
          <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">filter_alt</span>
            Candidate Conversion Funnel
          </h2>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                <span>1. Total Applications Received</span>
                <span className="font-mono text-primary font-bold">{funnel.applied}</span>
              </div>
              <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full w-full"></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                <span>2. Candidates Shortlisted</span>
                <span className="font-mono text-amber-700 font-bold">{funnel.shortlisted}</span>
              </div>
              <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${((funnel.shortlisted / totalFunnel) * 100).toFixed(1)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[12px] font-semibold mb-1">
                <span>3. Final Corporate Offers</span>
                <span className="font-mono text-emerald-700 font-bold">{funnel.selected}</span>
              </div>
              <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${((funnel.selected / totalFunnel) * 100).toFixed(1)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
