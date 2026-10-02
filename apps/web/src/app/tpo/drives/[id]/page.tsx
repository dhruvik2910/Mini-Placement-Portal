'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '../../../../lib/api';
import type {
  RecruitmentDriveDto,
  DriveStatus,
  DriveType,
  StudentType,
  EligibilityPreviewResult,
} from '@placement/shared';

type DriveDetails = RecruitmentDriveDto & { applicantCount: number };

const LDCE_DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Artificial Intelligence and Machine Learning',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Instrumentation & Control',
  'Automobile Engineering',
  'Biomedical Engineering',
  'Robotics and Automation',
];

export default function TpoDriveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const driveId = params.id as string;

  const [drive, setDrive] = useState<DriveDetails | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityPreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchDriveDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<DriveDetails>(`/tpo/drives/${driveId}`);
      setDrive(data);

      // Populate edit form defaults
      setEditForm({
        title: data.title,
        jobRole: data.jobRole,
        packageLpa: data.packageLpa ?? '',
        stipendMonthly: data.stipendMonthly ?? '',
        location: data.location ?? '',
        description: data.description ?? '',
        deadline: data.deadline ? data.deadline.slice(0, 10) : '',
        driveDate: data.driveDate ? data.driveDate.slice(0, 10) : '',
        requiredSkills: data.requiredSkills?.join(', ') ?? '',
        minCgpa: data.eligibility?.minCgpa ?? 0,
        minTenthPercentage: data.eligibility?.minTenthPercentage ?? 0,
        minTwelfthOrDiplomaPercentage: data.eligibility?.minTwelfthOrDiplomaPercentage ?? 0,
        maxActiveBacklogs: data.eligibility?.maxActiveBacklogs ?? 0,
        allowedDepartments: data.eligibility?.allowedDepartments ?? [],
        allowedStudentTypes: data.eligibility?.allowedStudentTypes ?? ['REGULAR', 'D2D'],
      });

      // Fetch live eligibility preview reusing same Prompt 2A engine
      try {
        const preview = await api.post<EligibilityPreviewResult>(`/tpo/drives/${driveId}/eligibility-preview`, {});
        setEligibility(preview);
      } catch (e) {
        console.error('Failed to load eligibility preview', e);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load drive details');
    } finally {
      setLoading(false);
    }
  }, [driveId]);

  useEffect(() => {
    fetchDriveDetails();
  }, [fetchDriveDetails]);

  const handleStatusChange = async (newStatus: DriveStatus) => {
    try {
      await api.patch(`/tpo/drives/${driveId}/status`, { status: newStatus });
      await fetchDriveDetails();
    } catch (err: any) {
      alert(err?.message || 'Failed to update drive status');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEditSubmitting(true);
      setEditError(null);

      const payload = {
        title: editForm.title,
        jobRole: editForm.jobRole,
        packageLpa: editForm.packageLpa ? Number(editForm.packageLpa) : null,
        stipendMonthly: editForm.stipendMonthly ? Number(editForm.stipendMonthly) : null,
        location: editForm.location || null,
        description: editForm.description || null,
        deadline: new Date(editForm.deadline).toISOString(),
        driveDate: editForm.driveDate ? new Date(editForm.driveDate).toISOString() : null,
        requiredSkills: editForm.requiredSkills
          ? editForm.requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        minCgpa: Number(editForm.minCgpa || 0),
        minTenthPercentage: Number(editForm.minTenthPercentage || 0),
        minTwelfthOrDiplomaPercentage: Number(editForm.minTwelfthOrDiplomaPercentage || 0),
        maxActiveBacklogs: Number(editForm.maxActiveBacklogs || 0),
        allowedDepartments: editForm.allowedDepartments,
        allowedStudentTypes: editForm.allowedStudentTypes,
      };

      await api.put(`/tpo/drives/${driveId}`, payload);
      setIsEditing(false);
      await fetchDriveDetails();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setEditError(err.message);
      } else {
        setEditError(err?.message || 'Failed to update recruitment drive');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const toggleDept = (dept: string) => {
    const list = [...(editForm.allowedDepartments || [])];
    const index = list.indexOf(dept);
    if (index >= 0) list.splice(index, 1);
    else list.push(dept);
    setEditForm({ ...editForm, allowedDepartments: list });
  };

  const toggleTrack = (type: string) => {
    const list = [...(editForm.allowedStudentTypes || [])];
    const index = list.indexOf(type);
    if (index >= 0) list.splice(index, 1);
    else list.push(type);
    setEditForm({ ...editForm, allowedStudentTypes: list });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="font-label-md text-on-surface-variant text-[13px]">
          Retrieving LDCE recruitment drive dossier...
        </p>
      </div>
    );
  }

  if (error || !drive) {
    return (
      <div className="p-space-lg bg-surface-container-lowest rounded-2xl border border-error/20 text-center space-y-3">
        <span className="material-symbols-outlined text-[36px] text-error">error</span>
        <h2 className="font-headline-sm text-on-surface font-bold text-[18px]">Drive Not Found</h2>
        <p className="font-body-md text-on-surface-variant text-[13px]">{error}</p>
        <Link
          href="/tpo/drives"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Drives</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
            <Link href="/tpo" className="hover:text-primary transition-colors">
              LDCE Training &amp; Placement Cell
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link href="/tpo/drives" className="hover:text-primary transition-colors">
              Recruitment Drives
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold truncate max-w-[200px]">{drive.jobRole}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight">
              {drive.jobRole} — {drive.company?.name}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Institutional recruitment drive hosted for L.D. College of Engineering, Ahmedabad.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            id="tpo-drive-detail-instant-alert-btn"
            href={`/tpo/drives/${drive.id}/applicants?action=alert`}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 ring-2 ring-emerald-400/30 cursor-pointer"
            title="Dispatch instant WhatsApp & SMS alerts to shortlisted candidates"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>⚡ Instant WhatsApp &amp; SMS Alert</span>
          </Link>

          <Link
            href={`/tpo/drives/${drive.id}/applicants`}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">groups</span>
            <span>Manage Applicants ({drive.applicantCount})</span>
          </Link>

          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[13px] border border-outline-variant/30 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            <span>Edit Drive</span>
          </button>

          {drive.status === 'ACTIVE' ? (
            <button
              onClick={() => handleStatusChange('COMPLETED' as DriveStatus)}
              className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-error font-semibold text-[13px] border border-outline-variant/30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Close Drive</span>
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('ACTIVE' as DriveStatus)}
              className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-emerald-700 font-semibold text-[13px] border border-outline-variant/30 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Publish / Activate</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Drive Details Dossier & Eligibility Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Left Column: Drive Specification */}
        <div className="lg:col-span-2 space-y-space-md">
          {/* Main Specs Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-4">
            <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
              Drive Specifications &amp; Remuneration
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">Annual CTC</span>
                <span className="font-bold text-primary text-[15px]">
                  {drive.packageLpa ? `₹${drive.packageLpa} LPA` : 'TBA'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">Monthly Stipend</span>
                <span className="font-bold text-on-surface text-[15px]">
                  {drive.stipendMonthly ? `₹${drive.stipendMonthly}/mo` : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">Drive Type</span>
                <span className="font-bold text-on-surface text-[14px]">
                  {drive.driveType.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">Work Location</span>
                <span className="font-bold text-on-surface text-[14px]">
                  {drive.location || 'Pan India / Remote'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline text-[20px]">event</span>
                <div>
                  <span className="text-outline text-[11px] font-semibold block">Application Deadline</span>
                  <span className="font-bold text-on-surface">
                    {new Date(drive.deadline).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline text-[20px]">calendar_month</span>
                <div>
                  <span className="text-outline text-[11px] font-semibold block">Campus Drive Date</span>
                  <span className="font-bold text-on-surface">
                    {drive.driveDate
                      ? new Date(drive.driveDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'To Be Announced'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-outline-variant/15">
              <span className="text-outline text-[11px] font-semibold uppercase block mb-1">
                Job Description &amp; Candidate Responsibilities
              </span>
              <p className="font-body-sm text-on-surface text-[13px] leading-relaxed whitespace-pre-line">
                {drive.description || 'No detailed job description provided.'}
              </p>
            </div>

            {/* Required Skills */}
            {drive.requiredSkills && drive.requiredSkills.length > 0 && (
              <div className="pt-2 border-t border-outline-variant/15">
                <span className="text-outline text-[11px] font-semibold uppercase block mb-1.5">
                  Required Competencies &amp; Technical Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {drive.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-low text-primary text-[12px] font-semibold border border-outline-variant/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Eligibility Rules Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-4">
            <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">rule</span>
              Eligibility Benchmarks &amp; Cutoffs
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">Minimum CGPA</span>
                <span className="font-bold text-primary font-mono text-[16px]">
                  {drive.eligibility?.minCgpa ? Number(drive.eligibility.minCgpa).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">Max Active Backlogs</span>
                <span className="font-bold text-on-surface font-mono text-[16px]">
                  {drive.eligibility?.maxActiveBacklogs ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">10th Std. Cutoff</span>
                <span className="font-bold text-on-surface font-mono text-[16px]">
                  {drive.eligibility?.minTenthPercentage || 0}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="text-outline text-[11px] font-semibold block">12th / Diploma Cutoff</span>
                <span className="font-bold text-on-surface font-mono text-[16px]">
                  {drive.eligibility?.minTwelfthOrDiplomaPercentage || 0}%
                </span>
              </div>
            </div>

            {/* Allowed Tracks */}
            <div className="pt-2 border-t border-outline-variant/15 text-[13px]">
              <span className="text-outline text-[11px] font-semibold uppercase block mb-1">
                Eligible Student Tracks
              </span>
              <div className="flex gap-2">
                {drive.eligibility?.allowedStudentTypes?.map((track) => (
                  <span
                    key={track}
                    className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface font-semibold text-[12px] border border-outline-variant/30"
                  >
                    {track === 'D2D' ? 'Lateral Entry (D2D)' : 'Regular 4-Year B.Tech'}
                  </span>
                ))}
              </div>
            </div>

            {/* Allowed Departments */}
            <div className="pt-2 border-t border-outline-variant/15 text-[13px]">
              <span className="text-outline text-[11px] font-semibold uppercase block mb-1.5">
                Eligible LDCE Engineering Branches ({drive.eligibility?.allowedDepartments?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {drive.eligibility?.allowedDepartments?.map((dept) => (
                  <span
                    key={dept}
                    className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-[12px] font-medium border border-outline-variant/30"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Company Partner & Live Eligibility Simulation */}
        <div className="space-y-space-md">
          {/* Recruiter Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-3">
            <h3 className="font-headline-sm text-primary font-bold text-[16px]">
              Recruiting Partner
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-[18px] shrink-0">
                {drive.company?.name?.[0] || 'C'}
              </div>
              <div>
                <h4 className="font-headline-sm text-on-surface font-bold text-[16px] leading-tight">
                  {drive.company?.name}
                </h4>
                {drive.company?.industry && (
                  <span className="text-[12px] text-on-surface-variant font-medium">
                    {drive.company.industry}
                  </span>
                )}
              </div>
            </div>

            {drive.company?.description && (
              <p className="font-body-sm text-on-surface-variant text-[12px] leading-relaxed">
                {drive.company.description}
              </p>
            )}

            <div className="space-y-1.5 pt-2 border-t border-outline-variant/15 text-[12px]">
              {drive.company?.contactPerson && (
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-[15px] text-outline">badge</span>
                  <span>{drive.company.contactPerson}</span>
                </div>
              )}
              {drive.company?.contactEmail && (
                <div className="flex items-center gap-1.5 text-on-surface-variant truncate">
                  <span className="material-symbols-outlined text-[15px] text-outline">mail</span>
                  <span className="truncate">{drive.company.contactEmail}</span>
                </div>
              )}
              {drive.company?.website && (
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-[15px]">public</span>
                  <a
                    href={drive.company.website.startsWith('http') ? drive.company.website : `https://${drive.company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline truncate"
                  >
                    {drive.company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Cohort Eligibility Simulation (Reusing Prompt 2A Engine) */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">analytics</span>
                Cohort Eligibility Preview
              </h3>
              <span className="text-[11px] font-semibold text-outline uppercase">PROMPT 2A ENGINE</span>
            </div>

            {eligibility ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-surface-container-low text-center space-y-1">
                  <span className="text-[11px] text-outline font-semibold uppercase block">
                    Institutional Eligibility Rate
                  </span>
                  <span className="font-headline-xl font-extrabold text-[#13357b] text-[30px] block leading-none">
                    {eligibility.eligibilityPercentage}%
                  </span>
                  <span className="text-[12px] text-on-surface-variant font-medium">
                    <strong>{eligibility.eligibleCount}</strong> eligible of {eligibility.totalStudents} total students
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-[12px]">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="block font-bold text-[16px]">{eligibility.eligibleCount}</span>
                    <span className="text-[11px] font-semibold">Eligible Pool</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="block font-bold text-[16px]">{eligibility.ineligibleCount}</span>
                    <span className="text-[11px] font-semibold">Ineligible Pool</span>
                  </div>
                </div>

                {/* Inspect Ineligibility Reasons */}
                {eligibility.ineligibleCount > 0 && (
                  <div className="pt-2 border-t border-outline-variant/15 space-y-2">
                    <span className="text-[11px] text-outline font-semibold uppercase block">
                      Ineligibility Disqualifications
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-2 text-[12px] pr-1">
                      {eligibility.students
                        .filter((s) => !s.isEligible)
                        .slice(0, 5)
                        .map((s) => (
                          <div
                            key={s.student.id}
                            className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/20 space-y-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-primary">
                                {s.student.firstName} {s.student.lastName}
                              </span>
                              <span className="font-mono text-outline text-[11px]">
                                {s.student.department}
                              </span>
                            </div>
                            <ul className="text-[11px] text-error list-disc pl-4 space-y-0.5">
                              {s.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-on-surface-variant">Calculating cohort eligibility...</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Drive Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-space-lg shadow-2xl border border-outline-variant/30 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline-sm text-primary font-bold text-[17px]">
                Edit Recruitment Drive: {drive.jobRole}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container text-[12px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Job Role *</label>
                  <input
                    type="text"
                    required
                    value={editForm.jobRole}
                    onChange={(e) => setEditForm({ ...editForm, jobRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Drive Title *</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Package (CTC LPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.packageLpa}
                    onChange={(e) => setEditForm({ ...editForm, packageLpa: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Monthly Stipend</label>
                  <input
                    type="number"
                    value={editForm.stipendMonthly}
                    onChange={(e) => setEditForm({ ...editForm, stipendMonthly: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Application Deadline *</label>
                  <input
                    type="date"
                    required
                    value={editForm.deadline}
                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Campus Drive Date</label>
                  <input
                    type="date"
                    value={editForm.driveDate}
                    onChange={(e) => setEditForm({ ...editForm, driveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={editForm.requiredSkills}
                  onChange={(e) => setEditForm({ ...editForm, requiredSkills: e.target.value })}
                  placeholder="Java, Python, SQL, React"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface"
                />
              </div>

              {/* Cutoff criteria */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-outline-variant/20">
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface mb-1">Min CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.minCgpa}
                    onChange={(e) => setEditForm({ ...editForm, minCgpa: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[12px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface mb-1">Max Backlogs</label>
                  <input
                    type="number"
                    value={editForm.maxActiveBacklogs}
                    onChange={(e) => setEditForm({ ...editForm, maxActiveBacklogs: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[12px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface mb-1">10th Cutoff %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.minTenthPercentage}
                    onChange={(e) => setEditForm({ ...editForm, minTenthPercentage: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[12px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface mb-1">12th/Dip. Cutoff %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.minTwelfthOrDiplomaPercentage}
                    onChange={(e) => setEditForm({ ...editForm, minTwelfthOrDiplomaPercentage: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[12px]"
                  />
                </div>
              </div>

              {/* Eligible Departments */}
              <div className="pt-2 border-t border-outline-variant/20">
                <label className="block font-semibold text-on-surface text-[12px] mb-1">
                  Eligible LDCE Departments
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  {LDCE_DEPARTMENTS.map((dept) => {
                    const checked = editForm.allowedDepartments?.includes(dept);
                    return (
                      <label key={dept} className="flex items-center gap-2 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDept(dept)}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>{dept}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-container transition-colors disabled:opacity-50"
                >
                  {editSubmitting ? 'Updating...' : 'Save Drive Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
