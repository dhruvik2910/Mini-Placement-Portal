'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/auth-context';
import { api, ApiError } from '../../../lib/api';
import type { RecruitmentDriveDto, StudentProfileDto } from '@placement/shared';

export default function DriveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [drive, setDrive] = useState<RecruitmentDriveDto | null>(null);
  const [profile, setProfile] = useState<StudentProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyNotes, setApplyNotes] = useState('');
  const [confirmedDeclaration, setConfirmedDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const fetchDriveAndProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [driveData, profileData] = await Promise.all([
        api.get<RecruitmentDriveDto>(`/drives/${id}`),
        api.get<StudentProfileDto>('/student/profile').catch(() => null),
      ]);
      setDrive(driveData);
      setProfile(profileData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load drive details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDriveAndProfile();
    }
  }, [id, fetchDriveAndProfile]);

  const handleApply = async () => {
    if (!confirmedDeclaration) return;
    try {
      setSubmitting(true);
      setApplyError(null);
      await api.post('/applications', {
        recruitmentDriveId: id,
        notes: applyNotes.trim() || undefined,
      });
      setApplySuccess(true);
      // Refresh drive details to update status
      const updatedDrive = await api.get<RecruitmentDriveDto>(`/drives/${id}`);
      setDrive(updatedDrive);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setApplyError(err.message);
      } else {
        setApplyError(err?.message || 'Failed to submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="font-label-md text-on-surface-variant text-[14px]">Loading drive specifications &amp; eligibility...</p>
      </div>
    );
  }

  if (error || !drive) {
    return (
      <div className="w-full max-w-xl mx-auto py-12">
        <div className="bg-surface-container-lowest p-space-xl rounded-2xl border border-error/20 shadow-sm text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-2">error</span>
          <h2 className="font-headline-sm text-on-surface font-bold text-[18px]">Drive Not Found</h2>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-2 mb-6">
            {error || 'The requested placement drive could not be located or may have been retired.'}
          </p>
          <Link
            href="/drives"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-[13px] hover:bg-primary-container transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Placement Drives</span>
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = drive.isClosed || new Date() > new Date(drive.deadline);
  const isApplied = drive.hasApplied;
  const isEligible = drive.isEligible;
  const ineligibilityReasons = drive.ineligibilityReasons || [];

  return (
    <div className="w-full flex flex-col gap-space-lg">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/drives"
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary font-label-md text-[13px] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Placement Drives</span>
        </Link>
        <span className="font-label-sm text-outline text-[12px]">Drive ID: {drive.id.slice(0, 8)}</span>
      </div>

      {/* Hero Banner */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg md:p-space-xl border border-outline-variant/30 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-[24px] shadow-sm flex-shrink-0">
              {drive.company?.name?.[0] || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-headline-sm text-primary font-bold text-[15px]">
                  {drive.company?.name || 'Recruiting Partner'}
                </span>
                {drive.company?.industry && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-[11px] font-medium border border-outline-variant/30">
                    {drive.company.industry}
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">
                  {drive.driveType.replace('_', ' ')}
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-1">
                {drive.jobRole}
              </h1>
              <p className="font-body-md text-on-surface-variant mt-0.5">{drive.title}</p>
            </div>
          </div>

          {/* Quick Metrics Badge in Header */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 md:text-right pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20">
            <div>
              <span className="font-label-sm text-outline text-[11px] block">Compensation / CTC</span>
              <span className="font-headline-sm text-primary font-extrabold text-[22px]">
                {drive.packageLpa ? `₹${drive.packageLpa} LPA` : drive.stipendMonthly ? `₹${drive.stipendMonthly}/mo` : 'Disclosed during round'}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface-variant font-label-sm text-[12px]">
              <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
              {drive.location || 'Pan India / Multiple'}
            </div>
          </div>
        </div>

        {/* Key Dates Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm mt-space-lg pt-space-md border-t border-outline-variant/20">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-low/50">
            <span className="material-symbols-outlined text-primary text-[20px]">event</span>
            <div>
              <span className="font-label-sm text-outline text-[11px] block">Drive / Interview Date</span>
              <span className="font-label-md text-on-surface font-semibold text-[13px]">
                {drive.driveDate ? new Date(drive.driveDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'To Be Announced'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-low/50">
            <span className="material-symbols-outlined text-error text-[20px]">timer</span>
            <div>
              <span className="font-label-sm text-outline text-[11px] block">Application Deadline</span>
              <span className="font-label-md text-on-surface font-semibold text-[13px]">
                {new Date(drive.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-low/50">
            <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
            <div>
              <span className="font-label-sm text-outline text-[11px] block">Eligibility Status</span>
              <span
                className={`font-label-md font-bold text-[13px] ${
                  isApplied ? 'text-primary' : isEligible ? 'text-green-700' : 'text-error'
                }`}
              >
                {isApplied ? 'Applied' : isClosed ? 'Closed' : isEligible ? 'Eligible to Apply' : 'Not Eligible'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Left 2 Cols: Job Details & Skills */}
        <div className="lg:col-span-2 space-y-space-lg">
          {/* Job Description */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">description</span>
              Position Description & Overview
            </h2>
            <div className="font-body-md text-on-surface-variant text-[14px] leading-relaxed whitespace-pre-line">
              {drive.description || 'No detailed description provided for this placement drive.'}
            </div>
          </div>

          {/* Required Skills & Competencies */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">code</span>
              Required Skills & Competencies
            </h2>
            {drive.requiredSkills && drive.requiredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {drive.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-fixed/40 text-on-primary-fixed font-label-md text-[13px] font-semibold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-body-sm text-outline">Open to candidates with core engineering coursework.</p>
            )}
          </div>

          {/* Company Background */}
          {drive.company && (
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
              <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                About {drive.company.name}
              </h2>
              <p className="font-body-md text-on-surface-variant text-[14px] leading-relaxed">
                {drive.company.description || 'Institutional recruiting partner.'}
              </p>
              {drive.company.website && (
                <div className="pt-2">
                  <a
                    href={drive.company.website.startsWith('http') ? drive.company.website : `https://${drive.company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-label-md text-[13px]"
                  >
                    <span>Visit Company Website</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Institutional Eligibility Card & Apply CTA */}
        <div className="space-y-space-md">
          {/* Eligibility Breakdown Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md sticky top-20">
            <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-on-surface font-bold text-[15px] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
                Eligibility Criteria
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold ${
                  isApplied
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : isClosed
                    ? 'bg-outline-variant text-on-surface-variant'
                    : isEligible
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-error-container text-on-error-container'
                }`}
              >
                {isApplied ? 'APPLIED' : isClosed ? 'CLOSED' : isEligible ? 'VERIFIED ELIGIBLE' : 'NOT ELIGIBLE'}
              </span>
            </div>

            {/* Checklist criteria */}
            <div className="space-y-2.5 text-[13px]">
              {/* CGPA */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-surface-container-low/40">
                <span className="text-on-surface-variant">Min. CGPA:</span>
                <div className="text-right">
                  <span className="font-semibold text-on-surface font-mono">{drive.eligibility?.minCgpa ?? 'N/A'}</span>
                  {profile && (
                    <span className="text-[11px] text-outline block">
                      (Your CGPA: {profile.currentCgpa ?? 'Not entered'})
                    </span>
                  )}
                </div>
              </div>

              {/* Backlogs */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-surface-container-low/40">
                <span className="text-on-surface-variant">Max Active Backlogs:</span>
                <div className="text-right">
                  <span className="font-semibold text-on-surface font-mono">{drive.eligibility?.maxActiveBacklogs ?? 'N/A'}</span>
                  {profile && (
                    <span className="text-[11px] text-outline block">
                      (Your Backlogs: {profile.activeBacklogs ?? 0})
                    </span>
                  )}
                </div>
              </div>

              {/* 10th Marks */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-surface-container-low/40">
                <span className="text-on-surface-variant">10th Std Marks:</span>
                <div className="text-right">
                  <span className="font-semibold text-on-surface font-mono">{drive.eligibility?.minTenthPercentage ?? 0}%</span>
                  {profile && profile.tenthMarks && (
                    <span className="text-[11px] text-outline block">
                      (Yours: {profile.tenthMarks.percentage}%)
                    </span>
                  )}
                </div>
              </div>

              {/* 12th / Diploma */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-surface-container-low/40">
                <span className="text-on-surface-variant">12th / Diploma Marks:</span>
                <div className="text-right">
                  <span className="font-semibold text-on-surface font-mono">{drive.eligibility?.minTwelfthOrDiplomaPercentage ?? 0}%</span>
                  {profile && (
                    <span className="text-[11px] text-outline block">
                      (Yours:{' '}
                      {profile.studentType === 'REGULAR'
                        ? `${profile.twelfthDetails?.percentage ?? 0}% (12th)`
                        : `${profile.d2dDetails?.diplomaPercentage ?? 0}% (Diploma)`})
                    </span>
                  )}
                </div>
              </div>

              {/* Departments */}
              <div className="p-2 rounded-lg bg-surface-container-low/40">
                <span className="text-on-surface-variant block mb-1">Eligible Departments:</span>
                <div className="flex flex-wrap gap-1">
                  {drive.eligibility?.allowedDepartments?.map((dept) => (
                    <span
                      key={dept}
                      className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                        profile?.department === dept
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Student Tracks */}
              <div className="p-2 rounded-lg bg-surface-container-low/40">
                <span className="text-on-surface-variant block mb-1">Eligible Student Tracks:</span>
                <div className="flex flex-wrap gap-1">
                  {drive.eligibility?.allowedStudentTypes?.map((track) => (
                    <span
                      key={track}
                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        profile?.studentType === track
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {track === 'D2D' ? 'D2D Lateral' : 'Regular 4-Year'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Ineligibility Warning Callout */}
            {!isEligible && ineligibilityReasons.length > 0 && !isApplied && (
              <div className="p-3 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[12px] text-error">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Criteria Not Satisfied
                </div>
                <ul className="list-disc pl-4 text-[12px] space-y-0.5">
                  {ineligibilityReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="pt-2">
              {isApplied ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-primary-fixed/40 border border-primary/20 text-center">
                    <span className="material-symbols-outlined text-primary text-[28px] block mb-1">check_circle</span>
                    <span className="font-label-md text-primary font-bold text-[13px] block">
                      Application Submitted
                    </span>
                    <p className="font-body-sm text-on-surface-variant text-[12px] mt-0.5">
                      Your profile and credentials are under review by the placement team.
                    </p>
                  </div>
                  <Link
                    href="/applications"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-container-low text-primary font-semibold text-[13px] border border-outline-variant/30 hover:bg-surface-container transition-colors"
                  >
                    <span>View in My Applications</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              ) : isClosed ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-surface-container-low text-outline font-semibold text-[14px] cursor-not-allowed border border-outline-variant/30 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                  Applications Closed
                </button>
              ) : isEligible ? (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-[14px] hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Apply for this Drive</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">
                    send
                  </span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-surface-container-low text-outline font-semibold text-[14px] cursor-not-allowed border border-outline-variant/30 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">block</span>
                    Not Eligible to Apply
                  </button>
                  <p className="text-center font-label-sm text-outline text-[11px]">
                    Backend validation prevents applications outside placement criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg md:p-space-xl shadow-2xl border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-150 space-y-space-md">
            {applySuccess ? (
              <div className="text-center space-y-space-md py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <span className="material-symbols-outlined text-[36px]">task_alt</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-on-surface font-extrabold text-[20px]">
                    Application Submitted!
                  </h3>
                  <p className="font-body-md text-on-surface-variant mt-2 text-[14px]">
                    Your application for <strong className="text-primary">{drive.jobRole}</strong> at{' '}
                    <strong>{drive.company?.name}</strong> has been successfully registered in the portal.
                  </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
                  <Link
                    href="/applications"
                    className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[14px] hover:bg-primary-container transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <span>View My Applications</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowApplyModal(false);
                      setApplySuccess(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold text-[14px] hover:bg-surface-container transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between border-b border-outline-variant/20 pb-3">
                  <div>
                    <h3 className="font-headline-sm text-primary font-bold text-[17px]">
                      Confirm Drive Application
                    </h3>
                    <p className="font-body-sm text-on-surface-variant text-[12px]">
                      {drive.company?.name} — {drive.jobRole}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowApplyModal(false)}
                    className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {applyError && (
                  <div className="p-3 rounded-xl bg-error-container text-on-error-container text-[13px] flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-error flex-shrink-0">error</span>
                    <span>{applyError}</span>
                  </div>
                )}

                {/* Candidate snapshot summary */}
                <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 space-y-2 text-[13px]">
                  <span className="font-label-md font-bold text-on-surface text-[12px] uppercase tracking-wider block text-outline">
                    Snapshot Shared With Recruiter
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-on-surface">
                    <div>
                      <span className="text-on-surface-variant text-[11px] block">Student Name:</span>
                      <span className="font-semibold">
                        {profile ? `${profile.firstName} ${profile.lastName}` : user?.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[11px] block">Enrollment No:</span>
                      <span className="font-semibold font-mono">{profile?.enrollmentNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[11px] block">Verified CGPA:</span>
                      <span className="font-semibold font-mono text-primary">{profile?.currentCgpa || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[11px] block">Active Backlogs:</span>
                      <span className="font-semibold font-mono">{profile?.activeBacklogs ?? 0}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-on-surface-variant text-[11px] block">Attached Resume:</span>
                      <span className="font-medium text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">description</span>
                        {profile?.resumeName || 'Institutional Academic Profile CV'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional note */}
                <div>
                  <label className="block font-label-md text-on-surface text-[13px] font-semibold mb-1">
                    Candidate Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={applyNotes}
                    onChange={(e) => setApplyNotes(e.target.value)}
                    placeholder="Briefly state your primary interest or key domain expertise..."
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none text-[13px] text-on-surface placeholder:text-outline"
                  />
                </div>

                {/* Declaration checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={confirmedDeclaration}
                    onChange={(e) => setConfirmedDeclaration(e.target.checked)}
                    className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span className="font-body-sm text-on-surface-variant text-[12px] leading-snug">
                    I confirm that all details in my student academic profile are accurate and genuine. I understand that once submitted, this application cannot be withdrawn.
                  </span>
                </label>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold text-[13px] hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!confirmedDeclaration || submitting}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {submitting && (
                      <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>
                    )}
                    <span>{submitting ? 'Submitting...' : 'Confirm & Apply'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
