'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError, downloadCsv } from '../../../../../lib/api';
import type { ApplicationDto, RecruitmentDriveDto, ApplicationStatus } from '@placement/shared';

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: 'APPLIED' as ApplicationStatus, label: 'Under Review' },
  { value: 'SHORTLISTED' as ApplicationStatus, label: 'Shortlisted' },
  { value: 'SELECTED' as ApplicationStatus, label: 'Selected / Offer' },
  { value: 'REJECTED' as ApplicationStatus, label: 'Not Selected' },
];

export default function DriveApplicantsPage() {
  const { id: driveId } = useParams<{ id: string }>();
  const [drive, setDrive] = useState<RecruitmentDriveDto | null>(null);
  const [applicants, setApplicants] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & selection
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk action modal state
  const [bulkActionTarget, setBulkActionTarget] = useState<ApplicationStatus | null>(null);
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const fetchDriveAndApplicants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [driveData, appsData] = await Promise.all([
        api.get<RecruitmentDriveDto>(`/tpo/drives/${driveId}`),
        api.get<ApplicationDto[]>(
          statusFilter !== 'ALL'
            ? `/tpo/drives/${driveId}/applicants?status=${statusFilter}`
            : `/tpo/drives/${driveId}/applicants`
        ),
      ]);
      setDrive(driveData);
      setApplicants(appsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load drive applicants');
    } finally {
      setLoading(false);
    }
  }, [driveId, statusFilter]);

  useEffect(() => {
    if (driveId) {
      fetchDriveAndApplicants();
    }
  }, [driveId, fetchDriveAndApplicants]);

  const handleSingleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await api.patch(`/tpo/applications/${appId}/status`, { status: newStatus });
      await fetchDriveAndApplicants();
    } catch (err: any) {
      alert(err?.message || 'Failed to update candidate status');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredApplicants.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkSubmit = async () => {
    if (!bulkActionTarget || selectedIds.length === 0) return;
    try {
      setBulkSubmitting(true);
      const res = await api.post<{ updatedCount: number }>('/tpo/applications/bulk-status', {
        applicationIds: selectedIds,
        status: bulkActionTarget,
        notes: bulkNotes.trim() || undefined,
      });
      setBulkSuccessMsg(`Updated ${res.updatedCount} applications to ${bulkActionTarget}`);
      setSelectedIds([]);
      setBulkActionTarget(null);
      setBulkNotes('');
      await fetchDriveAndApplicants();
    } catch (err: any) {
      alert(err?.message || 'Bulk transition failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!driveId) return;
    try {
      setExporting(true);
      setExportError(null);
      setExportSuccess(null);
      const queryParams = new URLSearchParams();
      queryParams.set('driveId', driveId);
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (search.trim()) queryParams.set('search', search.trim());

      const qs = queryParams.toString();
      const endpoint = `/tpo/applications/export-csv?${qs}`;
      const safeCompany = (drive?.company?.name || 'Drive').replace(/[^a-zA-Z0-9_-]/g, '_');
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `LDCE_${safeCompany}_Applicants_${statusFilter}_${timestamp}.csv`;

      await downloadCsv(endpoint, filename);
      setExportSuccess('Applicants CSV exported successfully.');
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to export applicants CSV.');
    } finally {
      setExporting(false);
    }
  };

  const filteredApplicants = applicants.filter((app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = `${app.studentProfile?.firstName} ${app.studentProfile?.lastName}`.toLowerCase();
    const enr = app.studentProfile?.enrollmentNumber?.toLowerCase() || '';
    return name.includes(q) || enr.includes(q);
  });

  const appliedCount = applicants.filter((a) => a.status === 'APPLIED').length;
  const shortlistedCount = applicants.filter((a) => a.status === 'SHORTLISTED').length;
  const selectedCount = applicants.filter((a) => a.status === 'SELECTED').length;
  const rejectedCount = applicants.filter((a) => a.status === 'REJECTED').length;

  return (
    <div className="space-y-space-lg">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
            <Link href="/tpo/drives" className="hover:text-primary transition-colors">
              LDCE Recruitment Drives
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Candidate Pipeline</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            {drive ? `${drive.company?.name} — ${drive.jobRole}` : 'Applicant Pipeline'}
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            {drive?.title} • CTC: {drive?.packageLpa ? `₹${drive.packageLpa} LPA` : 'TBA'} • LDCE Engineering Cohort
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            id="tpo-export-drive-applicants-csv-btn"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-[#13357b] font-label-md text-[13px] font-bold shadow-xs hover:bg-[#13357b] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export filtered applicants as CSV"
          >
            {exporting ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[16px]">file_download</span>
            )}
            <span>{exporting ? 'Exporting...' : 'Export Applicants CSV'}</span>
          </button>
          <Link
            href="/tpo/drives"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-[13px] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>All Drives</span>
          </Link>
        </div>
      </div>

      {/* Export Notifications */}
      {exportSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex items-center justify-between shadow-xs">
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
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-center justify-between shadow-xs">
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

      {bulkSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">task_alt</span>
            {bulkSuccessMsg}
          </span>
          <button onClick={() => setBulkSuccessMsg(null)} className="text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="text-outline text-[11px] font-semibold uppercase block">Under Review</span>
          <span className="font-headline-sm font-mono text-primary font-bold text-[22px]">{appliedCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="text-outline text-[11px] font-semibold uppercase block">Shortlisted</span>
          <span className="font-headline-sm font-mono text-amber-700 font-bold text-[22px]">{shortlistedCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="text-outline text-[11px] font-semibold uppercase block">Offers / Selected</span>
          <span className="font-headline-sm font-mono text-emerald-700 font-bold text-[22px]">{selectedCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <span className="text-outline text-[11px] font-semibold uppercase block">Not Selected</span>
          <span className="font-headline-sm font-mono text-outline font-bold text-[22px]">{rejectedCount}</span>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'ALL', label: `All (${applicants.length})` },
              { id: 'APPLIED', label: `Applied (${appliedCount})` },
              { id: 'SHORTLISTED', label: `Shortlisted (${shortlistedCount})` },
              { id: 'SELECTED', label: `Selected (${selectedCount})` },
              { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setSelectedIds([]);
                }}
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
          <div className="relative min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name or roll no..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-[13px] text-on-surface"
            />
          </div>
        </div>

        {/* Floating Bulk Action Bar (when selected) */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-xl bg-primary-fixed/60 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in duration-150">
            <span className="font-semibold text-primary text-[13px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_box</span>
              <span>{selectedIds.length} candidate(s) selected</span>
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setBulkActionTarget('SHORTLISTED' as ApplicationStatus)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[12px] transition-colors"
              >
                Shortlist Selected
              </button>
              <button
                onClick={() => setBulkActionTarget('SELECTED' as ApplicationStatus)}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[12px] transition-colors"
              >
                Extend Offer (Select)
              </button>
              <button
                onClick={() => setBulkActionTarget('REJECTED' as ApplicationStatus)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-error-container text-error font-semibold text-[12px] border border-outline-variant/30 transition-colors"
              >
                Reject Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-1.5 text-on-surface-variant hover:text-on-surface text-[12px]"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Applicants Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-3 font-label-md text-on-surface-variant text-[13px]">Loading drive applications...</p>
        </div>
      ) : error ? (
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-error/20 text-center space-y-2">
          <span className="material-symbols-outlined text-[32px] text-error">error</span>
          <p className="font-body-md text-on-surface font-semibold">{error}</p>
          <button
            onClick={fetchDriveAndApplicants}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
          >
            Retry
          </button>
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-space-xl border border-outline-variant/30 text-center space-y-2">
          <span className="material-symbols-outlined text-outline text-[36px]">folder_open</span>
          <h3 className="font-headline-sm text-on-surface font-bold text-[16px]">No Applicants Found</h3>
          <p className="font-body-md text-on-surface-variant text-[13px] max-w-sm mx-auto">
            {search ? 'Try clearing search.' : 'No candidates have submitted applications matching this status.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-outline uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-3 w-10 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Student Candidate</th>
                  <th className="py-3 px-3 whitespace-nowrap">Department &amp; Track</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Academic Standing</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Applied Date</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Current Status</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Resume</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Officer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                {filteredApplicants.map((app) => {
                  const student = app.studentProfile;
                  const isChecked = selectedIds.includes(app.id);

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-surface-container-low/40 transition-colors ${
                        isChecked ? 'bg-primary-fixed/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(app.id)}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Candidate */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Link
                          href={`/tpo/students/${student?.id}`}
                          className="font-bold text-primary hover:underline block leading-tight"
                        >
                          {student?.firstName} {student?.lastName}
                        </Link>
                        <span className="font-mono text-outline text-[11px]">
                          {student?.enrollmentNumber}
                        </span>
                      </td>

                      {/* Dept & Track */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium block leading-tight">{student?.department}</span>
                        <span className="text-[11px] text-on-surface-variant">
                          {student?.studentType === 'D2D' ? 'D2D Lateral' : 'Regular 4-Yr'}
                        </span>
                      </td>

                      {/* Academic metrics */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-primary block leading-tight">
                          {student?.currentCgpa ? Number(student.currentCgpa).toFixed(2) : '0.00'} CGPA
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            (student?.activeBacklogs || 0) > 0 ? 'text-error' : 'text-outline'
                          }`}
                        >
                          {student?.activeBacklogs ? `${student.activeBacklogs} Backlogs` : '0 Backlogs'}
                        </span>
                      </td>

                      {/* Applied Date */}
                      <td className="py-3 px-3 text-center font-mono text-[12px] text-on-surface-variant whitespace-nowrap">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            app.status === 'SELECTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'SHORTLISTED'
                              ? 'bg-amber-100 text-amber-800'
                              : app.status === 'REJECTED'
                              ? 'bg-surface-container text-on-surface-variant'
                              : 'bg-primary-fixed text-on-primary-fixed'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      {/* Resume link */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {student?.resumeUrl ? (
                          <a
                            href={`http://localhost:5000${student.resumeUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-[12px] font-semibold"
                            title="View PDF Resume"
                          >
                            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                            <span>Resume</span>
                          </a>
                        ) : (
                          <span className="text-outline text-[11px] italic">Profile CV</span>
                        )}
                      </td>

                      {/* Action Dropdown */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <select
                          value={app.status}
                          onChange={(e) => handleSingleStatusChange(app.id, e.target.value as ApplicationStatus)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/40 font-semibold text-[12px] text-on-surface focus:border-primary"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {bulkActionTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg shadow-2xl border border-outline-variant/30 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-headline-sm text-primary font-bold text-[17px]">
              Confirm Bulk Status Update
            </h3>
            <p className="font-body-md text-on-surface-variant text-[13px] leading-relaxed">
              You are about to transition <strong>{selectedIds.length}</strong> selected candidate(s) to{' '}
              <strong className="text-primary">{bulkActionTarget}</strong>.
            </p>
            <p className="text-[12px] text-outline">
              This action will update the placement database, emit notifications to all selected students, and update their application tracker in real time.
            </p>

            <div>
              <label className="block text-outline text-[11px] font-semibold mb-1">
                Batch Announcement Note (Optional)
              </label>
              <textarea
                rows={2}
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="e.g. Cleared Technical Round 1 with distinction..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[12px] text-on-surface"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setBulkActionTarget(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold text-[13px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={bulkSubmitting}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-colors disabled:opacity-50"
              >
                {bulkSubmitting ? 'Updating...' : `Confirm (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
