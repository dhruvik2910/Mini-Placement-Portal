'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, downloadCsv } from '../../../lib/api';
import type { ApplicationDto, ApplicationStatus } from '@placement/shared';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  APPLIED: {
    label: 'Under Review',
    badgeClass: 'bg-primary-fixed text-on-primary-fixed font-bold',
    icon: 'hourglass_empty',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    badgeClass: 'bg-amber-100 text-amber-800 font-bold',
    icon: 'star',
  },
  SELECTED: {
    label: 'Selected / Offer',
    badgeClass: 'bg-emerald-100 text-emerald-800 font-bold',
    icon: 'verified',
  },
  REJECTED: {
    label: 'Not Selected',
    badgeClass: 'bg-surface-container text-on-surface-variant font-medium',
    icon: 'cancel',
  },
};

export default function TpoAllApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);

      const qs = queryParams.toString();
      const url = qs ? `/tpo/applications?${qs}` : '/tpo/applications';
      const data = await api.get<ApplicationDto[]>(url);
      setApplications(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchApplications]);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await api.patch(`/tpo/applications/${appId}/status`, { status: newStatus });
      await fetchApplications();
    } catch (err: any) {
      alert(err?.message || 'Failed to update application status');
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      setExportError(null);
      setExportSuccess(null);
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);

      const qs = queryParams.toString();
      const endpoint = `/tpo/applications/export-csv${qs ? `?${qs}` : ''}`;
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `LDCE_Applications_${statusFilter}_${timestamp}.csv`;

      await downloadCsv(endpoint, filename);
      setExportSuccess('Candidate applications CSV exported successfully with active filters.');
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to export applications CSV.');
    } finally {
      setExporting(false);
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
            <span className="text-primary font-bold">Applications Pipeline</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            LDCE Candidate Applications Master List
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Cross-drive applicant tracking across all participating recruiting partners and LDCE engineering branches.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            id="tpo-export-applications-csv-btn"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-[#13357b] font-label-md text-[13px] font-bold shadow-xs hover:bg-[#13357b] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export filtered applications as CSV"
          >
            {exporting ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">file_download</span>
            )}
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-[#13357b] font-label-md text-[13px] font-bold shadow-xs">
            <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
            <span>{applications.length} Total Submissions</span>
          </span>
        </div>
      </div>

      {/* Export Notifications */}
      {exportSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            {exportSuccess}
          </span>
          <button
            onClick={() => setExportSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-[12px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
      {exportError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
            {exportError}
          </span>
          <button
            onClick={() => setExportError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold text-[12px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, GTU roll number, company, or job role..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none text-[13px] text-on-surface"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'APPLIED', label: 'Under Review' },
            { id: 'SHORTLISTED', label: 'Shortlisted' },
            { id: 'SELECTED', label: 'Selected' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-label-md text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#13357b] text-white shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-space-xl flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <span className="text-[13px] text-on-surface-variant">Loading application submissions...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-space-xl text-center space-y-2">
            <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
            <h3 className="font-bold text-on-surface text-[15px]">No Applications Found</h3>
            <p className="text-[13px] text-on-surface-variant">
              No student applications matched your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-outline font-bold">
                  <th className="py-3 px-4 whitespace-nowrap">Student Candidate</th>
                  <th className="py-3 px-4 whitespace-nowrap">Branch &amp; Academics</th>
                  <th className="py-3 px-4 whitespace-nowrap">Recruitment Drive</th>
                  <th className="py-3 px-4 whitespace-nowrap">Submission Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Current Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {applications.map((app) => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG['APPLIED'];
                  const profile = app.studentProfile;
                  const drive = app.recruitmentDrive;

                  return (
                    <tr key={app.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <Link
                            href={`/tpo/students/${profile?.id}`}
                            className="font-bold text-[#13357b] hover:underline"
                          >
                            {profile?.firstName} {profile?.lastName}
                          </Link>
                          <span className="text-outline text-[11px] font-mono">
                            {profile?.enrollmentNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface">{profile?.department}</span>
                          <span className="text-[11px] text-outline">
                            CGPA: <strong className="text-on-surface">{profile?.currentCgpa.toFixed(2)}</strong> • Backlogs:{' '}
                            <strong className={profile?.activeBacklogs ? 'text-error' : 'text-on-surface'}>
                              {profile?.activeBacklogs}
                            </strong>
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">{drive?.company?.name}</span>
                          <span className="text-[12px] text-on-surface-variant">{drive?.jobRole}</span>
                          {drive?.packageLpa && (
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              ₹{drive.packageLpa} LPA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-on-surface-variant whitespace-nowrap">
                        {new Date(app.appliedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] ${cfg.badgeClass}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">{cfg.icon}</span>
                          <span>{cfg.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                            className="px-2 py-1 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[11px] font-bold text-[#13357b] focus:outline-none cursor-pointer"
                          >
                            <option value="APPLIED">Under Review</option>
                            <option value="SHORTLISTED">Shortlist</option>
                            <option value="SELECTED">Select / Offer</option>
                            <option value="REJECTED">Reject</option>
                          </select>
                          <Link
                            href={`/tpo/drives/${drive?.id}/applicants`}
                            className="p-1 rounded-lg text-outline hover:text-[#13357b] hover:bg-surface-container transition-colors"
                            title="Open Drive Applicants Pipeline"
                          >
                            <span className="material-symbols-outlined text-[18px]">launch</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
