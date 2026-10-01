'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { RecruitmentDriveDto, DriveStatus } from '@placement/shared';

type DriveWithApplicants = RecruitmentDriveDto & { applicantCount: number };

export default function TpoDrivesPage() {
  const [drives, setDrives] = useState<DriveWithApplicants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDrives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);

      const qs = queryParams.toString();
      const url = qs ? `/tpo/drives?${qs}` : '/tpo/drives';
      const data = await api.get<DriveWithApplicants[]>(url);
      setDrives(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load recruitment drives');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrives();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDrives]);

  const handleStatusChange = async (driveId: string, newStatus: DriveStatus) => {
    try {
      await api.patch(`/tpo/drives/${driveId}/status`, { status: newStatus });
      await fetchDrives();
    } catch (err: any) {
      alert(err?.message || 'Failed to update drive status');
    }
  };

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
            <span className="text-primary font-bold">Recruitment Drives</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            LDCE Recruitment Drives Management
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Publish placement drives for LDCE engineering cohorts, configure branch criteria, inspect eligible candidates, and monitor application pipelines.
          </p>
        </div>
        <Link
          href="/tpo/drives/create"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-all shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Create New Drive</span>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Drives' },
            { id: 'ACTIVE', label: 'Active / Open' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-label-md text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or role..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-[13px] text-on-surface"
          />
        </div>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-3 font-label-md text-on-surface-variant text-[13px]">Loading recruitment drives...</p>
        </div>
      ) : error ? (
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-error/20 text-center space-y-2">
          <span className="material-symbols-outlined text-[32px] text-error">error</span>
          <p className="font-body-md text-on-surface font-semibold">{error}</p>
          <button
            onClick={fetchDrives}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
          >
            Retry
          </button>
        </div>
      ) : drives.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-space-xl border border-outline-variant/30 text-center space-y-2">
          <span className="material-symbols-outlined text-outline text-[36px]">business_center</span>
          <h3 className="font-headline-sm text-on-surface font-bold text-[16px]">No Drives Found</h3>
          <p className="font-body-md text-on-surface-variant text-[13px] max-w-sm mx-auto">
            {search ? 'Try clearing search filters.' : 'Get started by creating your first campus placement drive.'}
          </p>
        </div>
      ) : (
        <div className="space-y-space-md">
          {drives.map((drive) => {
            const isClosed = drive.status !== 'ACTIVE' || new Date() > new Date(drive.deadline);

            return (
              <div
                key={drive.id}
                className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg border border-outline-variant/30 hover:border-primary/40 hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md"
              >
                {/* Company & Role Details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-[20px] shrink-0 shadow-xs">
                    {drive.company?.name?.[0] || 'C'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-headline-sm text-primary font-bold text-[16px]">
                        {drive.company?.name}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-[11px] font-semibold border border-outline-variant/30">
                        {drive.driveType.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          drive.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : drive.status === 'COMPLETED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {drive.status}
                      </span>
                    </div>

                    <h2 className="font-headline-md text-on-surface font-extrabold text-[17px]">
                      {drive.jobRole}
                    </h2>
                    <p className="font-body-sm text-on-surface-variant text-[12px]">{drive.title}</p>

                    {/* Metric chips */}
                    <div className="flex items-center gap-3 text-[12px] text-on-surface-variant pt-1 flex-wrap">
                      <span className="font-bold text-primary">
                        {drive.packageLpa ? `₹${drive.packageLpa} LPA` : drive.stipendMonthly ? `₹${drive.stipendMonthly}/mo` : 'TBA'}
                      </span>
                      <span>•</span>
                      <span>{drive.location || 'Multiple / Remote'}</span>
                      <span>•</span>
                      <span>
                        Deadline: {new Date(drive.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Criteria & Action Bar */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-outline-variant/20">
                  {/* Criteria Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant bg-surface-container-low/60 p-2 rounded-xl">
                    <span>Min CGPA: <strong>{drive.eligibility?.minCgpa || 0}</strong></span>
                    <span>•</span>
                    <span>Max Backlogs: <strong>{drive.eligibility?.maxActiveBacklogs ?? 0}</strong></span>
                    <span>•</span>
                    <span>10th: <strong>{drive.eligibility?.minTenthPercentage || 0}%</strong></span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/tpo/drives/${drive.id}`}
                      className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[12px] border border-outline-variant/30 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>View &amp; Edit</span>
                    </Link>

                    <Link
                      href={`/tpo/drives/${drive.id}/applicants`}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-[12px] hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">groups</span>
                      <span>Manage Applicants ({drive.applicantCount})</span>
                    </Link>

                    {/* Status Dropdown / Action */}
                    {drive.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleStatusChange(drive.id, 'COMPLETED' as DriveStatus)}
                        className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-semibold text-[12px] transition-colors border border-outline-variant/30"
                      >
                        Mark Completed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(drive.id, 'ACTIVE' as DriveStatus)}
                        className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[12px] transition-colors border border-outline-variant/30"
                      >
                        Reopen Drive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
