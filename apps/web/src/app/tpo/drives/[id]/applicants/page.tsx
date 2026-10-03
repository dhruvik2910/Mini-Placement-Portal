'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, downloadCsv, openResume } from '../../../../../lib/api';
import type {
  ApplicationDto,
  RecruitmentDriveDto,
  ApplicationStatus,
  NotificationChannel,
  SendInterviewAlertResultDto,
} from '@placement/shared';

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: 'APPLIED' as ApplicationStatus, label: 'Under Review' },
  { value: 'SHORTLISTED' as ApplicationStatus, label: 'Shortlisted' },
  { value: 'SELECTED' as ApplicationStatus, label: 'Selected / Offer' },
  { value: 'REJECTED' as ApplicationStatus, label: 'Not Selected' },
];

const PRESET_ROUNDS = [
  'Technical Round 1',
  'Technical Round 2',
  'HR Interview',
  'Aptitude Assessment',
  'Coding Assessment',
  'Final Interview',
];

const PRESET_VENUES = [
  'LDCE Placement cell',
  'Block 2 Seminar Hall',
  'Computer Dept Lab 3',
  'Main Auditorium',
  'Google Meet / Online',
];

export default function DriveApplicantsPage() {
  const { id: driveId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
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

  // Instant WhatsApp & SMS Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTargetIds, setAlertTargetIds] = useState<string[]>([]);
  const [alertRound, setAlertRound] = useState('Technical Round 1');
  const [alertSchedule, setAlertSchedule] = useState('tomorrow at 10:30 AM');
  const [alertVenue, setAlertVenue] = useState('LDCE Placement cell');
  const [alertCustomNote, setAlertCustomNote] = useState('');
  const [alertChannels, setAlertChannels] = useState<NotificationChannel[]>([
    'WHATSAPP' as NotificationChannel,
    'SMS' as NotificationChannel,
    'EMAIL' as NotificationChannel,
  ]);
  const [alertSending, setAlertSending] = useState(false);
  const [alertResult, setAlertResult] = useState<SendInterviewAlertResultDto | null>(null);

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

  // Open alert modal automatically if query param action=alert is present
  useEffect(() => {
    if (searchParams.get('action') === 'alert') {
      setShowAlertModal(true);
    }
  }, [searchParams]);

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

  // Open instant alert modal
  const handleOpenAlertModal = (specificIds?: string[]) => {
    setAlertResult(null);
    if (specificIds && specificIds.length > 0) {
      setAlertTargetIds(specificIds);
    } else if (selectedIds.length > 0) {
      setAlertTargetIds(selectedIds);
    } else {
      // If none selected, default to all shortlisted candidates or all applicants
      const shortlisted = applicants.filter((a) => a.status === 'SHORTLISTED').map((a) => a.id);
      setAlertTargetIds(shortlisted.length > 0 ? shortlisted : applicants.map((a) => a.id));
    }
    setShowAlertModal(true);
  };

  const toggleChannel = (channel: NotificationChannel) => {
    setAlertChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleSendInstantAlert = async () => {
    if (alertTargetIds.length === 0) {
      alert('Please select at least one candidate to notify.');
      return;
    }
    if (alertChannels.length === 0) {
      alert('Please select at least one notification channel (WhatsApp, SMS, or Email).');
      return;
    }

    try {
      setAlertSending(true);
      const res = await api.post<SendInterviewAlertResultDto>('/tpo/notifications/interview-alert', {
        applicationIds: alertTargetIds,
        roundName: alertRound.trim(),
        scheduleTime: alertSchedule.trim(),
        venue: alertVenue.trim(),
        channels: alertChannels,
        customNote: alertCustomNote.trim() || undefined,
      });

      setAlertResult(res);
      setBulkSuccessMsg(
        `⚡ Instant Alerts Dispatched: Sent notifications to ${res.dispatchedCount} student(s) across ${res.channelsUsed.join(', ')}.`
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to dispatch instant alerts');
    } finally {
      setAlertSending(false);
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

  const sampleStudentName =
    applicants.find((a) => alertTargetIds.includes(a.id))?.studentProfile?.firstName || 'Rahul';
  const companyName = drive?.company?.name || 'TatvaSoft';
  const previewMessage = `Hello ${sampleStudentName}, you have been shortlisted for ${companyName} ${alertRound} ${alertSchedule} in ${alertVenue}.`;

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

        {/* Top Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* GREEN INSTANT WHATSAPP & SMS ALERT BUTTON */}
          <button
            id="tpo-instant-alert-btn"
            onClick={() => handleOpenAlertModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[13px] shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-emerald-400/30"
            title="Send Instant WhatsApp & SMS Interview Alerts to Candidates"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>⚡ Instant WhatsApp &amp; SMS Alert</span>
          </button>

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

      {/* Export & Bulk Notifications */}
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
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex items-center justify-between shadow-xs">
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
              {/* WhatsApp & SMS Alert button in floating bar */}
              <button
                onClick={() => handleOpenAlertModal(selectedIds)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Send WhatsApp / SMS Alert</span>
              </button>

              <button
                onClick={() => setBulkActionTarget('SHORTLISTED' as ApplicationStatus)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[12px] transition-colors cursor-pointer"
              >
                Shortlist Selected
              </button>
              <button
                onClick={() => setBulkActionTarget('SELECTED' as ApplicationStatus)}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[12px] transition-colors cursor-pointer"
              >
                Extend Offer (Select)
              </button>
              <button
                onClick={() => setBulkActionTarget('REJECTED' as ApplicationStatus)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-error-container text-error font-semibold text-[12px] border border-outline-variant/30 transition-colors cursor-pointer"
              >
                Reject Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-2 py-1.5 text-on-surface-variant hover:text-on-surface text-[12px] cursor-pointer"
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
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant font-label-md text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Enrollment / GTU</th>
                  <th className="py-3 px-3">Contact (WhatsApp/Phone)</th>
                  <th className="py-3 px-3">Department &amp; Track</th>
                  <th className="py-3 px-3 text-center">CGPA / Backlogs</th>
                  <th className="py-3 px-3 text-center">Applied Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Resume</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredApplicants.map((app) => {
                  const isSelected = selectedIds.includes(app.id);
                  const student = app.studentProfile;
                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-surface-container-low/60 transition-colors ${
                        isSelected ? 'bg-primary-fixed/20' : ''
                      }`}
                    >
                      {/* Select checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(app.id)}
                          className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-on-surface block">
                          {student ? `${student.firstName} ${student.lastName}` : 'Candidate'}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {student?.gender || 'Student'} • Sem {student?.currentSemester || 7}
                        </span>
                      </td>

                      {/* Roll number */}
                      <td className="py-3 px-3 font-mono font-semibold text-primary">
                        {student?.enrollmentNumber}
                      </td>

                      {/* Contact / Phone */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="material-symbols-outlined text-[13px]">chat</span>
                            <span>{student?.phone || 'No phone'}</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant truncate block max-w-[160px]">
                          {(student as any)?.user?.email || (student as any)?.email || 'LDCE Student'}
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
                          <button
                            type="button"
                            onClick={() => openResume(student.id || app.studentProfileId)}
                            className="inline-flex items-center gap-1 text-primary hover:underline text-[12px] font-semibold cursor-pointer"
                            title="View PDF Resume"
                          >
                            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                            <span>Resume</span>
                          </button>
                        ) : (
                          <span className="text-outline text-[11px] italic">Profile CV</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Row-level Instant WhatsApp Alert Button */}
                          <button
                            onClick={() => handleOpenAlertModal([app.id])}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Send instant WhatsApp/SMS alert to this student"
                          >
                            <span className="material-symbols-outlined text-[15px]">bolt</span>
                            <span className="hidden sm:inline">Alert</span>
                          </button>

                          <select
                            value={app.status}
                            onChange={(e) => handleSingleStatusChange(app.id, e.target.value as ApplicationStatus)}
                            className="px-2 py-1 rounded-lg bg-surface-container-low border border-outline-variant/40 font-semibold text-[12px] text-on-surface focus:border-primary"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
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
              <label className="font-label-md text-[12px] font-semibold text-on-surface block mb-1">
                Internal Remarks / Feedback Note (Optional):
              </label>
              <textarea
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="e.g., Shortlisted for Technical Round 1 on Friday."
                className="w-full p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface focus:border-primary"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => {
                  setBulkActionTarget(null);
                  setBulkNotes('');
                }}
                className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container font-semibold text-[13px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkSubmitting}
                onClick={handleBulkSubmit}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-[13px] shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {bulkSubmitting ? 'Updating...' : `Confirm & Notify ${selectedIds.length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INSTANT WHATSAPP & SMS ALERT GATEWAY MODAL                               */}
      {/* ========================================================================= */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-emerald-500/30 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/20">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  <span>Instant Alert Gateway</span>
                </div>
                <h2 className="font-headline-sm text-[#13357b] font-extrabold text-[19px]">
                  ⚡ Dispatch WhatsApp &amp; SMS Interview Alert
                </h2>
                <p className="text-[13px] text-on-surface-variant mt-0.5">
                  Send real-time template notifications to students for <strong>{companyName}</strong>.
                </p>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Target Summary */}
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-emerald-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-700">groups</span>
                <span>
                  Targeting <strong>{alertTargetIds.length}</strong> candidate(s)
                </span>
              </span>
              <span className="text-[11px] font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                {companyName} — {drive?.jobRole}
              </span>
            </div>

            {/* Form Controls */}
            <div className="space-y-4">
              {/* Round Selection */}
              <div>
                <label className="font-label-md text-[12px] font-bold text-on-surface block mb-1.5">
                  1. Assessment / Interview Round:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_ROUNDS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAlertRound(r)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        alertRound === r
                          ? 'bg-[#13357b] text-white shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={alertRound}
                  onChange={(e) => setAlertRound(e.target.value)}
                  placeholder="e.g., Technical Round 1"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface font-semibold focus:border-primary"
                />
              </div>

              {/* Schedule & Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-md text-[12px] font-bold text-on-surface block mb-1.5">
                    2. Interview Schedule (Time):
                  </label>
                  <input
                    type="text"
                    value={alertSchedule}
                    onChange={(e) => setAlertSchedule(e.target.value)}
                    placeholder="e.g., tomorrow at 10:30 AM"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface font-semibold focus:border-primary"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="font-label-md text-[12px] font-bold text-on-surface block mb-1.5">
                    3. Reporting Venue:
                  </label>
                  <input
                    type="text"
                    value={alertVenue}
                    onChange={(e) => setAlertVenue(e.target.value)}
                    placeholder="e.g., LDCE Placement cell"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface font-semibold focus:border-primary"
                  />
                </div>
              </div>

              {/* Venue Preset Chips */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_VENUES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAlertVenue(v)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      alertVenue === v
                        ? 'bg-emerald-700 text-white'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Channels Selection */}
              <div>
                <label className="font-label-md text-[12px] font-bold text-on-surface block mb-1.5">
                  4. Notification Channels (Select All That Apply):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* WhatsApp */}
                  <label
                    onClick={() => toggleChannel('WHATSAPP' as NotificationChannel)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      alertChannels.includes('WHATSAPP' as NotificationChannel)
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                        : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px] text-emerald-600">chat</span>
                    <span className="text-[12px]">WhatsApp API</span>
                    <span className="text-[10px] text-emerald-700 font-normal">Instant Template</span>
                  </label>

                  {/* SMS */}
                  <label
                    onClick={() => toggleChannel('SMS' as NotificationChannel)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      alertChannels.includes('SMS' as NotificationChannel)
                        ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-xs'
                        : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px] text-blue-600">sms</span>
                    <span className="text-[12px]">SMS Gateway</span>
                    <span className="text-[10px] text-blue-700 font-normal">Twilio / Gupshup</span>
                  </label>

                  {/* Email */}
                  <label
                    onClick={() => toggleChannel('EMAIL' as NotificationChannel)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      alertChannels.includes('EMAIL' as NotificationChannel)
                        ? 'bg-purple-50 border-purple-500 text-purple-800 font-bold shadow-xs'
                        : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px] text-purple-600">mail</span>
                    <span className="text-[12px]">LDCE Email</span>
                    <span className="text-[10px] text-purple-700 font-normal">Institutional Letter</span>
                  </label>
                </div>
              </div>

              {/* Optional Custom Note */}
              <div>
                <label className="font-label-md text-[12px] font-semibold text-on-surface block mb-1">
                  Additional Instructions / Notes (Optional):
                </label>
                <input
                  type="text"
                  value={alertCustomNote}
                  onChange={(e) => setAlertCustomNote(e.target.value)}
                  placeholder="e.g., Bring 2 copies of resume and GTU ID card."
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[12px] text-on-surface focus:border-primary"
                />
              </div>

              {/* LIVE MESSAGE PREVIEW */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-300 shadow-inner space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">visibility</span>
                    <span>Live Message Preview (WhatsApp / SMS)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded">
                    Standard GTU Format
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-on-surface text-[13px] leading-relaxed shadow-xs font-mono">
                  &quot;{previewMessage}&quot;
                </div>
              </div>
            </div>

            {/* Results feedback */}
            {alertResult && (
              <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-[13px] space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-[20px] text-emerald-700">check_circle</span>
                  <span>Successfully dispatched to {alertResult.dispatchedCount} candidates!</span>
                </div>
                <div className="text-[12px] text-emerald-800 space-y-1">
                  <p>Channels used: {alertResult.channelsUsed.join(' • ')}</p>
                  <p>Check the TPO Outbox / Delivery Logs tab to view message IDs and provider confirmations.</p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container font-semibold text-[13px] cursor-pointer"
              >
                {alertResult ? 'Close' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={alertSending || alertTargetIds.length === 0 || alertChannels.length === 0}
                onClick={handleSendInstantAlert}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[13px] shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {alertSending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching Alerts...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Dispatch Alerts ({alertTargetIds.length} Students)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

