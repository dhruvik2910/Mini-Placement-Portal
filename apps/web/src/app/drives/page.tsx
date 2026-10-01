'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';
import { api } from '../../lib/api';
import type { RecruitmentDriveDto } from '@placement/shared';

export default function PlacementDrivesPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<RecruitmentDriveDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ELIGIBLE' | 'FULL_TIME' | 'INTERNSHIP'>('ALL');

  useEffect(() => {
    async function fetchDrives() {
      try {
        setLoading(true);
        const data = await api.get<RecruitmentDriveDto[]>('/drives');
        setDrives(data);
      } catch (err) {
        console.error('Failed to load drives:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDrives();
    }
  }, [user]);

  // Client-side filtering
  const filteredDrives = drives.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.jobRole.toLowerCase().includes(search.toLowerCase()) ||
      d.company?.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.location && d.location.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'ELIGIBLE') {
      return d.isEligible && !d.isClosed && !d.hasApplied;
    }
    if (filterTab === 'FULL_TIME') {
      return d.driveType === 'FULL_TIME';
    }
    if (filterTab === 'INTERNSHIP') {
      return d.driveType === 'INTERNSHIP' || d.driveType === 'INTERN_PLUS_FTE';
    }
    return true;
  });

  const eligibleCount = drives.filter((d) => d.isEligible && !d.isClosed && !d.hasApplied).length;

  return (
    <div className="w-full flex flex-col gap-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-outline-variant/20">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
            <Link href="/" className="hover:text-primary transition-colors">
              LDCE Placement Portal
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#13357b] font-bold">Recruitment Drives</span>
          </div>
          <h1 className="font-headline-lg text-[#13357b] font-bold text-[24px] sm:text-[28px] tracking-tight mt-1">
            LDCE Campus Placement Drives
          </h1>
          <p className="font-body-sm text-on-surface-variant text-[13px] max-w-3xl mt-0.5">
            Explore active recruitment opportunities coordinated by the Training &amp; Placement Cell of L.D. College of Engineering, evaluated dynamically against branch cutoffs and backlogs.
          </p>
        </div>

        {/* Live Active Drives Badge */}
        <div className="self-start sm:self-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-primary font-label-md text-[13px] font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{drives.filter((d) => !d.isClosed).length} Active Drives</span>
          </span>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by company, role, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface focus:outline-none focus:border-secondary transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 text-outline hover:text-on-surface text-[16px]"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'ALL'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            All Drives ({drives.length})
          </button>
          <button
            onClick={() => setFilterTab('ELIGIBLE')}
            className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterTab === 'ELIGIBLE'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">verified</span>
            <span>Eligible for Me ({eligibleCount})</span>
          </button>
          <button
            onClick={() => setFilterTab('FULL_TIME')}
            className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'FULL_TIME'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Full-Time FTE
          </button>
          <button
            onClick={() => setFilterTab('INTERNSHIP')}
            className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterTab === 'INTERNSHIP'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Internship
          </button>
        </div>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="font-label-md text-on-surface-variant text-[14px]">
            Evaluating student eligibility criteria across LDCE drives...
          </span>
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[36px]">business_center</span>
          </div>
          <h3 className="font-headline-sm text-primary font-bold text-[17px]">
            {filterTab === 'ELIGIBLE'
              ? 'No Eligible Placement Drives Currently Available'
              : 'No Placement Drives Match the Selected Filters'}
          </h3>
          <p className="text-on-surface-variant text-[13px] max-w-md leading-relaxed">
            {filterTab === 'ELIGIBLE'
              ? 'None of the active drives currently match your CGPA, backlog count, or department criteria. You can explore all scheduled corporate visits under "All Drives".'
              : search
              ? `No recruitment drives were found matching "${search}". Please try different keywords or reset your search.`
              : 'No recruitment drives are currently available under this category.'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface font-semibold text-[13px] hover:bg-surface-container transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
            {filterTab !== 'ALL' && (
              <button
                onClick={() => setFilterTab('ALL')}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-[13px] hover:bg-primary-container transition-colors cursor-pointer shadow-xs"
              >
                View All Drives
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {filteredDrives.map((drive) => {
            return (
              <div
                key={drive.id}
                className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm border border-outline-variant/30 hover:border-secondary/40 transition-all flex flex-col justify-between gap-space-sm card-hover"
              >
                {/* Card Header: Company, Role & Eligibility Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-center font-bold text-primary text-[18px] shrink-0 shadow-xs">
                      {drive.company?.name?.[0]}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline-sm text-primary font-bold text-[17px] truncate leading-tight">
                        {drive.company?.name}
                      </span>
                      <span className="font-label-md text-secondary font-semibold text-[14px]">
                        {drive.jobRole}
                      </span>
                      <span className="text-outline text-[11px] uppercase tracking-wide mt-0.5">
                        {drive.driveType.replace(/_/g, ' ')} • {drive.location || 'Pan-India'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {drive.hasApplied ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[12px] font-semibold">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        Applied
                      </span>
                    ) : drive.isClosed ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container-high text-outline font-label-sm text-[12px]">
                        Closed
                      </span>
                    ) : drive.isEligible ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-[12px] font-bold border border-emerald-200">
                        <span className="material-symbols-outlined text-[15px]">verified</span>
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 font-label-sm text-[12px] font-medium border border-red-200">
                        <span className="material-symbols-outlined text-[15px]">block</span>
                        Ineligible
                      </span>
                    )}
                  </div>
                </div>

                {/* Compensation & Important Dates */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/15 text-[12px]">
                  <div>
                    <span className="text-outline block text-[11px]">CTC Package / Stipend</span>
                    <span className="font-headline-sm font-bold text-primary text-[14px]">
                      {drive.packageLpa ? `₹${drive.packageLpa} LPA` : `${drive.stipendMonthly}/mo`}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline block text-[11px]">Application Deadline</span>
                    <span className="font-medium text-on-surface">
                      {new Date(drive.deadline).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Criteria Snippet */}
                <div className="flex flex-col gap-1 text-[12px]">
                  <div className="flex items-center gap-2 flex-wrap text-on-surface-variant">
                    <span className="font-semibold text-primary">Criteria:</span>
                    <span className="px-2 py-0.5 rounded-md bg-surface-container text-[11px]">
                      Min CGPA: <strong>{drive.eligibility.minCgpa || 'None'}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-surface-container text-[11px]">
                      Max Backlogs: <strong>{drive.eligibility.maxActiveBacklogs}</strong>
                    </span>
                    {drive.eligibility.minTenthPercentage > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container text-[11px]">
                        10th: <strong>{drive.eligibility.minTenthPercentage}%</strong>
                      </span>
                    )}
                  </div>

                  {/* Ineligibility Reason Note (if ineligible) */}
                  {!drive.isEligible && drive.ineligibilityReasons?.length ? (
                    <div className="text-[11px] text-error font-medium flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      <span className="truncate">{drive.ineligibilityReasons[0]}</span>
                    </div>
                  ) : null}
                </div>

                {/* Required Skills Chips */}
                {drive.requiredSkills?.length ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {drive.requiredSkills.slice(0, 4).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Card Action Footer */}
                <div className="pt-2.5 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="text-[11px] text-outline">
                    Coordinated by LDCE TPO Office
                  </span>
                  <Link
                    href={`/drives/${drive.id}`}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-[13px] font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>View &amp; Apply</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
