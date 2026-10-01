'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import type { ApplicationDto, ApplicationStatus } from '@placement/shared';

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: string; bgSoft: string; borderClass: string }
> = {
  APPLIED: {
    label: 'Under Review',
    badgeClass: 'bg-primary-fixed text-on-primary-fixed font-bold',
    icon: 'hourglass_empty',
    bgSoft: 'bg-primary-fixed/20',
    borderClass: 'border-primary/20',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    badgeClass: 'bg-amber-100 text-amber-800 font-bold',
    icon: 'star',
    bgSoft: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
  SELECTED: {
    label: 'Selected / Offered',
    badgeClass: 'bg-emerald-100 text-emerald-800 font-bold',
    icon: 'verified',
    bgSoft: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  REJECTED: {
    label: 'Not Selected',
    badgeClass: 'bg-surface-container text-on-surface-variant font-medium',
    icon: 'cancel',
    bgSoft: 'bg-surface-container-low',
    borderClass: 'border-outline-variant/30',
  },
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApplicationDto | null>(null);

  const fetchApplications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = statusFilter === 'ALL' ? '/applications' : `/applications?status=${statusFilter}`;
      const data = await api.get<ApplicationDto[]>(url);
      setApplications(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const companyName = app.recruitmentDrive?.company?.name?.toLowerCase() || '';
    const jobRole = app.recruitmentDrive?.jobRole?.toLowerCase() || '';
    const title = app.recruitmentDrive?.title?.toLowerCase() || '';
    return companyName.includes(q) || jobRole.includes(q) || title.includes(q);
  });

  // Calculate high-level summary counters
  const totalCount = applications.length;
  const appliedCount = applications.filter((a) => a.status === 'APPLIED').length;
  const shortlistedCount = applications.filter((a) => a.status === 'SHORTLISTED').length;
  const selectedCount = applications.filter((a) => a.status === 'SELECTED').length;

  return (
    <div className="w-full flex flex-col gap-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant/20">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
            <Link href="/" className="hover:text-primary transition-colors">
              LDCE Placement Portal
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#13357b] font-bold">Applications Tracker</span>
          </div>
          <h1 className="font-headline-lg text-[#13357b] font-extrabold text-[24px] sm:text-[28px] tracking-tight">
            My LDCE Applications
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px]">
            Monitor real-time progress, interview schedules, and recruiter selection statuses across LDCE placement drives.
          </p>
        </div>
        <Link
          href="/drives"
          className="h-10 px-4 rounded-xl bg-primary text-on-primary font-semibold text-[13px] hover:bg-primary-container transition-colors shadow-xs inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">travel_explore</span>
          <span>Browse LDCE Drives</span>
        </Link>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <div className="p-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">assignment</span>
          </div>
          <div>
            <span className="font-label-sm text-outline text-[11px] block">Total Applied</span>
            <span className="font-headline-sm text-primary font-extrabold text-[20px]">{totalCount}</span>
          </div>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">pending</span>
          </div>
          <div>
            <span className="font-label-sm text-outline text-[11px] block">Under Review</span>
            <span className="font-headline-sm text-on-surface font-extrabold text-[20px]">{appliedCount}</span>
          </div>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">star</span>
          </div>
          <div>
            <span className="font-label-sm text-outline text-[11px] block">Shortlisted</span>
            <span className="font-headline-sm text-amber-700 font-extrabold text-[20px]">{shortlistedCount}</span>
          </div>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">verified</span>
          </div>
          <div>
            <span className="font-label-sm text-outline text-[11px] block">Offers / Selected</span>
            <span className="font-headline-sm text-emerald-700 font-extrabold text-[20px]">{selectedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-sm rounded-2xl border border-outline-variant/30 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'APPLIED', label: 'Under Review' },
            { id: 'SHORTLISTED', label: 'Shortlisted' },
            { id: 'SELECTED', label: 'Selected' },
            { id: 'REJECTED', label: 'Not Selected' },
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

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or role..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none text-[13px] text-on-surface"
          />
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-3 font-label-md text-on-surface-variant text-[13px]">
            Loading your placement applications...
          </p>
        </div>
      ) : error ? (
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-error/20 text-center space-y-2">
          <span className="material-symbols-outlined text-[32px] text-error">error</span>
          <p className="font-body-md text-on-surface font-semibold">{error}</p>
          <button
            onClick={fetchApplications}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
          >
            Retry
          </button>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-space-xl border border-outline-variant/30 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mx-auto text-outline">
            <span className="material-symbols-outlined text-[32px]">folder_open</span>
          </div>
          <h3 className="font-headline-sm text-on-surface font-bold text-[16px]">
            No Applications Found
          </h3>
          <p className="font-body-md text-on-surface-variant text-[13px] max-w-md mx-auto">
            {searchQuery
              ? `No applications matched "${searchQuery}". Try clearing search filters.`
              : statusFilter !== 'ALL'
              ? `You currently do not have any applications in "${statusFilter}" state.`
              : 'You have not submitted applications to any placement drives yet.'}
          </p>
          {applications.length === 0 && (
            <div className="pt-2">
              <Link
                href="/drives"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                <span>Explore Eligible Drives</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-space-sm">
          {filteredApplications.map((app) => {
            const drive = app.recruitmentDrive;
            const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED;

            return (
              <div
                key={app.id}
                className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg border border-outline-variant/30 hover:border-primary/40 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md"
              >
                {/* Company & Role */}
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-[18px] flex-shrink-0 shadow-xs">
                    {drive?.company?.name?.[0] || 'C'}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-headline-sm text-primary font-bold text-[15px]">
                        {drive?.company?.name || 'Recruiting Partner'}
                      </span>
                      {drive?.driveType && (
                        <span className="inline-flex items-center px-2 py-0.2 rounded-full bg-surface-container-low text-on-surface-variant text-[10px] font-semibold border border-outline-variant/20">
                          {drive.driveType.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <h2 className="font-headline-sm text-on-surface font-extrabold text-[16px]">
                      {drive?.jobRole || 'Engineer'}
                    </h2>
                    <div className="flex items-center gap-3 text-[12px] text-on-surface-variant flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-outline">payments</span>
                        {drive?.packageLpa ? `₹${drive.packageLpa} LPA` : drive?.stipendMonthly ? `₹${drive.stipendMonthly}/mo` : 'Disclosed during round'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-outline">location_on</span>
                        {drive?.location || 'Pan India'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-outline">calendar_today</span>
                        Applied {new Date(app.appliedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Inspect Action */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] ${statusConfig.badgeClass}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{statusConfig.icon}</span>
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3.5 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-[12px] transition-colors border border-outline-variant/30 flex items-center gap-1"
                    >
                      <span>Details</span>
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    {drive && (
                      <Link
                        href={`/drives/${drive.id}`}
                        className="p-1.5 rounded-xl text-outline hover:text-primary hover:bg-surface-container-low transition-colors"
                        title="View Drive"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Detail Inspection Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-space-lg md:p-space-xl shadow-2xl border border-outline-variant/30 space-y-space-md animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <span className="font-label-sm text-outline text-[11px] block uppercase tracking-wider">
                  Application Record
                </span>
                <h3 className="font-headline-md text-on-surface font-extrabold text-[18px]">
                  {selectedApp.recruitmentDrive?.jobRole}
                </h3>
                <span className="font-body-sm text-primary font-semibold text-[13px]">
                  {selectedApp.recruitmentDrive?.company?.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Status Timeline */}
            <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-sm font-bold text-outline text-[11px] uppercase tracking-wider block">
                  Official Selection Stage
                </span>
                <span className="font-label-sm text-outline text-[12px]">
                  Updated: {new Date(selectedApp.updatedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Visual Pipeline Bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className={`p-2 rounded-lg font-bold border transition-colors ${
                  selectedApp.status === 'APPLIED' || selectedApp.status === 'SHORTLISTED' || selectedApp.status === 'SELECTED'
                    ? 'bg-blue-50 border-blue-300 text-[#13357b]'
                    : 'bg-surface-container-low border-outline-variant/20 text-outline'
                }`}>
                  <span className="block text-[14px]">1</span>
                  <span>Applied</span>
                </div>
                <div className={`p-2 rounded-lg font-bold border transition-colors ${
                  selectedApp.status === 'SHORTLISTED' || selectedApp.status === 'SELECTED'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : selectedApp.status === 'REJECTED'
                    ? 'bg-surface-container-low border-outline-variant/20 text-outline'
                    : 'bg-surface-container-low border-outline-variant/20 text-outline'
                }`}>
                  <span className="block text-[14px]">2</span>
                  <span>Shortlisted</span>
                </div>
                <div className={`p-2 rounded-lg font-bold border transition-colors ${
                  selectedApp.status === 'SELECTED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : selectedApp.status === 'REJECTED'
                    ? 'bg-red-50 border-red-200 text-error'
                    : 'bg-surface-container-low border-outline-variant/20 text-outline'
                }`}>
                  <span className="block text-[14px]">3</span>
                  <span>{selectedApp.status === 'REJECTED' ? 'Not Selected' : 'Selected'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] ${
                    STATUS_CONFIG[selectedApp.status]?.badgeClass
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {STATUS_CONFIG[selectedApp.status]?.icon}
                  </span>
                  <span>{STATUS_CONFIG[selectedApp.status]?.label}</span>
                </span>
              </div>
            </div>

            {/* Details Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="p-2.5 rounded-xl bg-surface-container-low/40">
                <span className="font-label-sm text-outline text-[11px] block">Compensation / CTC</span>
                <span className="font-semibold text-primary font-mono text-[14px]">
                  {selectedApp.recruitmentDrive?.packageLpa
                    ? `₹${selectedApp.recruitmentDrive.packageLpa} LPA`
                    : selectedApp.recruitmentDrive?.stipendMonthly
                    ? `₹${selectedApp.recruitmentDrive.stipendMonthly}/mo`
                    : 'Disclosed in round'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low/40">
                <span className="font-label-sm text-outline text-[11px] block">Drive / Interview Date</span>
                <span className="font-semibold text-on-surface text-[13px]">
                  {selectedApp.recruitmentDrive?.driveDate
                    ? new Date(selectedApp.recruitmentDrive.driveDate).toLocaleDateString()
                    : 'To Be Announced'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low/40">
                <span className="font-label-sm text-outline text-[11px] block">Submission Timestamp</span>
                <span className="font-semibold text-on-surface text-[13px]">
                  {new Date(selectedApp.appliedAt).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low/40">
                <span className="font-label-sm text-outline text-[11px] block">Job Location</span>
                <span className="font-semibold text-on-surface text-[13px]">
                  {selectedApp.recruitmentDrive?.location || 'Pan India'}
                </span>
              </div>
            </div>

            {/* Candidate Cover Note */}
            {selectedApp.notes && (
              <div className="p-3 rounded-xl bg-surface-container-low/40 border border-outline-variant/20">
                <span className="font-label-sm text-outline text-[11px] block mb-1">
                  Candidate Note Submitted
                </span>
                <p className="font-body-sm text-on-surface text-[13px] italic">
                  &ldquo;{selectedApp.notes}&rdquo;
                </p>
              </div>
            )}

            {/* Footer with actions */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
              {selectedApp.recruitmentDrive && (
                <Link
                  href={`/drives/${selectedApp.recruitmentDrive.id}`}
                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-label-md text-[13px]"
                >
                  <span>View Original Job Posting</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              )}
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold text-[13px] hover:bg-surface-container transition-colors ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
