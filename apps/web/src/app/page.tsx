'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/auth-context';
import { api } from '../lib/api';
import type {
  RecruitmentDriveDto,
  ApplicationDto,
  NotificationDto,
} from '@placement/shared';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<RecruitmentDriveDto[]>([]);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [drivesData, appsData, notifsData] = await Promise.all([
          api.get<RecruitmentDriveDto[]>('/drives').catch(() => []),
          api.get<ApplicationDto[]>('/applications').catch(() => []),
          api.get<NotificationDto[]>('/student/notifications').catch(() => []),
        ]);
        setDrives(drivesData);
        setApplications(appsData);
        setNotifications(notifsData);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="font-label-md text-on-surface-variant text-[14px]">
            Loading LDCE student placement portal...
          </span>
        </div>
      </div>
    );
  }

  const profile = user.studentProfile;
  const isLocked = profile?.status === 'LOCKED';
  const isVerified = profile?.verificationStatus === 'VERIFIED';

  // Compute profile completion percentage
  let completion = 0;
  if (profile?.firstName && profile?.lastName && profile?.phone) completion += 25;
  if (profile?.tenthMarks) completion += 25;
  if (profile?.twelfthDetails || profile?.d2dDetails) completion += 25;
  if (profile?.skills?.technical?.length || profile?.resumeUrl) completion += 25;
  if (isLocked) completion = 100;

  // Application statistics
  const activeDrivesCount = drives.filter((d) => !d.isClosed).length;
  const eligibleDrivesCount = drives.filter((d) => d.isEligible && !d.isClosed).length;
  const shortlistedCount = applications.filter((a) => a.status === 'SHORTLISTED').length;
  const appliedCount = applications.length;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Top Banner / Welcome Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-space-lg sm:p-space-xl shadow-sm border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#13357b] border border-blue-200 font-label-sm text-[11px] font-bold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#13357b] animate-pulse"></span>
              LDCE • AY 2024-25
            </span>
            <span className="text-outline text-[12px]">/</span>
            <span className="font-label-sm text-on-surface-variant font-medium text-[12px]">
              L.D. College of Engineering • {profile?.department || 'Academic Registry'}
            </span>
          </div>
          <h1 className="font-headline-lg text-[#13357b] font-bold text-[24px] sm:text-[28px] tracking-tight">
            Welcome to LDCE Placement Portal, {profile?.firstName}
          </h1>
          <p className="font-body-sm text-on-surface-variant text-[13px] max-w-2xl">
            GTU Enrollment: <strong className="text-on-surface font-semibold">{profile?.enrollmentNumber}</strong> • Student Track:{' '}
            <strong className="text-secondary">{profile?.studentType === 'D2D' ? 'Lateral D2D Entry' : 'Regular 4-Year B.E.'}</strong>
          </p>
        </div>

        {/* Profile Lock Status Badge & Quick Action */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="flex flex-col items-start lg:items-end">
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-outline text-[11px] uppercase">Compliance:</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[12px] font-semibold ${
                  isLocked
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                    : 'bg-secondary-fixed text-on-secondary-fixed'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isLocked ? 'lock' : 'edit_document'}
                </span>
                <span>{isLocked ? 'Profile LOCKED' : 'Profile in DRAFT'}</span>
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5">
              {isVerified ? 'TPO Clearance: Approved' : 'TPO Clearance: Pending Review'}
            </span>
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-[13px] font-semibold transition-colors border border-outline-variant/30 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">account_box</span>
            <span>View Dossier</span>
          </Link>
        </div>
      </section>

      {/* 4-Stage Student Compliance Lifecycle Stepper */}
      <section className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm border border-outline-variant/30">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#13357b] text-[20px]">timeline</span>
            <h2 className="font-headline-sm text-[#13357b] font-bold text-[15px]">
              Placement Readiness &amp; Verification Journey
            </h2>
          </div>
          <span className="text-[12px] font-semibold text-on-surface-variant">
            {isVerified ? 'Fully Verified' : isLocked ? 'Awaiting TPO Approval' : 'Action Required: Complete Dossier'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1 */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#13357b] text-white flex items-center justify-center font-bold text-[13px] shrink-0">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
            <div className="flex flex-col text-[12px]">
              <span className="font-bold text-[#13357b]">1. LDCE Registry</span>
              <span className="text-on-surface-variant">GTU Code 028 Enrollment</span>
              <span className="text-emerald-700 font-semibold text-[11px] mt-0.5">Active Account</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-3 rounded-xl border flex items-start gap-3 ${
            completion >= 75
              ? 'bg-blue-50/60 border-blue-200/80'
              : 'bg-surface-container-low border-outline-variant/40'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
              completion >= 75 ? 'bg-[#13357b] text-white' : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {completion >= 75 ? (
                <span className="material-symbols-outlined text-[16px]">check</span>
              ) : (
                '2'
              )}
            </div>
            <div className="flex flex-col text-[12px]">
              <span className="font-bold text-primary">2. Academic Dossier</span>
              <span className="text-on-surface-variant">10th + 12th / Diploma Marks</span>
              <span className={`font-semibold text-[11px] mt-0.5 ${completion >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {completion}% Documented
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-3 rounded-xl border flex items-start gap-3 ${
            isLocked
              ? 'bg-blue-50/60 border-blue-200/80'
              : 'bg-surface-container-low border-outline-variant/40'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
              isLocked ? 'bg-[#13357b] text-white' : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {isLocked ? (
                <span className="material-symbols-outlined text-[16px]">lock</span>
              ) : (
                '3'
              )}
            </div>
            <div className="flex flex-col text-[12px]">
              <span className="font-bold text-primary">3. Profile Sealing</span>
              <span className="text-on-surface-variant">Lock Profile for Audit</span>
              <span className={`font-semibold text-[11px] mt-0.5 ${isLocked ? 'text-emerald-700' : 'text-outline'}`}>
                {isLocked ? 'Sealed & Locked' : 'Pending Final Lock'}
              </span>
            </div>
          </div>

          {/* Step 4 */}
          <div className={`p-3 rounded-xl border flex items-start gap-3 ${
            isVerified
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-surface-container-low border-outline-variant/40'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
              isVerified ? 'bg-emerald-700 text-white' : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {isVerified ? (
                <span className="material-symbols-outlined text-[16px]">verified</span>
              ) : (
                '4'
              )}
            </div>
            <div className="flex flex-col text-[12px]">
              <span className="font-bold text-primary">4. Central TPO Clearance</span>
              <span className="text-on-surface-variant">Verification &amp; Drive Approval</span>
              <span className={`font-semibold text-[11px] mt-0.5 ${isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isVerified ? 'Verified & Approved' : 'In Review Queue'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Draft Alert Banner (if profile not locked) */}
      {!isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">lock_open</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-amber-950 font-bold text-[14px]">
                Your placement profile is currently unlocked (DRAFT)
              </span>
              <span className="font-body-sm text-amber-900 text-[12px]">
                Please review your 10th/12th/diploma marks, add technical skills, upload resume, and lock your profile to qualify for recruiter shortlisting.
              </span>
            </div>
          </div>
          <Link
            href="/profile"
            className="shrink-0 px-4 py-2 rounded-xl bg-[#13357b] text-white hover:bg-primary text-[13px] font-semibold transition-colors text-center shadow-xs"
          >
            Complete &amp; Lock Profile
          </Link>
        </div>
      )}

      {/* 4 Bento Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Metric 1: CGPA */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between text-outline text-[12px] font-semibold uppercase">
            <span>Academic Standing</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">analytics</span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-headline-xl text-primary font-bold text-[32px]">
              {profile?.currentCgpa ? Number(profile.currentCgpa).toFixed(2) : '0.00'}
            </span>
            <span className="text-[13px] text-on-surface-variant font-medium">/ 10.00 CGPA</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-outline-variant/15 text-on-surface-variant">
            <span>Active Backlogs: <strong className={profile?.activeBacklogs ? 'text-error' : 'text-primary'}>{profile?.activeBacklogs || 0}</strong></span>
            <span>Sem {profile?.currentSemester || 7}</span>
          </div>
        </div>

        {/* Metric 2: Profile Completion */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between text-outline text-[12px] font-semibold uppercase">
            <span>Dossier Completion</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">fact_check</span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-headline-xl text-primary font-bold text-[32px]">{completion}%</span>
            <span className="text-[12px] text-on-surface-variant font-medium">
              {completion === 100 ? 'Verified Complete' : 'Sections Pending'}
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completion === 100 ? 'bg-emerald-500' : 'bg-secondary'
              }`}
              style={{ width: `${completion}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Active Drives */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between text-outline text-[12px] font-semibold uppercase">
            <span>Live Recruitment</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">business_center</span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-headline-xl text-primary font-bold text-[32px]">{activeDrivesCount}</span>
            <span className="text-[12px] text-on-surface-variant font-medium">Active Drives</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-outline-variant/15 text-on-surface-variant">
            <span>Eligible for you: <strong className="text-secondary font-bold">{eligibleDrivesCount}</strong></span>
            <Link href="/drives" className="text-secondary hover:underline font-semibold">Browse →</Link>
          </div>
        </div>

        {/* Metric 4: Applications Submitted */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between text-outline text-[12px] font-semibold uppercase">
            <span>My Applications</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">assignment_turned_in</span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-headline-xl text-primary font-bold text-[32px]">{appliedCount}</span>
            <span className="text-[12px] text-on-surface-variant font-medium">Applied Drives</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-outline-variant/15 text-on-surface-variant">
            <span>Shortlisted: <strong className="text-primary font-bold">{shortlistedCount}</strong></span>
            <Link href="/applications" className="text-secondary hover:underline font-semibold">Track →</Link>
          </div>
        </div>
      </div>

      {/* Main Two-Column Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: Active Drives for this Student (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">corporate_fare</span>
                <h2 className="font-headline-sm text-primary font-bold text-[17px]">
                  Featured Recruitment Drives
                </h2>
              </div>
              <Link
                href="/drives"
                className="text-secondary hover:underline font-label-md text-[13px] font-semibold flex items-center gap-1"
              >
                <span>View All ({drives.length})</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>

            {drives.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[40px] text-outline">business_center</span>
                <h3 className="font-bold text-primary text-[15px]">No Placement Drives Available</h3>
                <p className="text-on-surface-variant text-[13px] max-w-sm">
                  The Central Training &amp; Placement Office is currently coordinating upcoming corporate recruitment schedules. Check back soon.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {drives.slice(0, 4).map((drive) => (
                  <div
                    key={drive.id}
                    className="p-4 rounded-xl bg-surface-container-low/40 hover:bg-surface-container-low transition-colors border border-outline-variant/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center font-bold text-primary shrink-0 shadow-xs text-[16px]">
                        {drive.company?.name?.[0]}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-headline-sm text-primary font-bold text-[15px] truncate">
                            {drive.company?.name}
                          </span>
                          <span className="text-outline text-[12px]">•</span>
                          <span className="font-label-sm text-on-surface-variant font-medium text-[13px]">
                            {drive.jobRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-on-surface-variant mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-semibold text-primary">
                            <span className="material-symbols-outlined text-[15px] text-secondary">payments</span>
                            {drive.packageLpa ? `₹${drive.packageLpa} LPA` : `${drive.stipendMonthly}/mo`}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-outline">location_on</span>
                            {drive.location || 'Pan-India'}
                          </span>
                          <span>•</span>
                          <span className="text-outline">
                            Deadline: {new Date(drive.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Badge & Action */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {drive.hasApplied ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[12px] font-semibold">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Applied
                        </span>
                      ) : drive.isClosed ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container-high text-outline font-label-sm text-[12px]">
                          Closed
                        </span>
                      ) : drive.isEligible ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-[12px] font-bold border border-emerald-200">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 font-label-sm text-[12px] font-medium border border-red-200">
                          <span className="material-symbols-outlined text-[14px]">block</span>
                          Ineligible
                        </span>
                      )}

                      <Link
                        href={`/drives/${drive.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-primary font-label-md text-[13px] font-semibold border border-outline-variant/40 transition-colors shadow-xs"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Applications Tracker & Notification Activity (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          {/* Quick Applications Tracker */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">send</span>
                Recent Applications
              </h2>
              <Link href="/applications" className="text-secondary text-[12px] hover:underline font-semibold">
                View All
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-outline">description</span>
                <span className="text-[13px] text-on-surface-variant font-medium">
                  No applications submitted yet.
                </span>
                <p className="text-[12px] text-outline max-w-xs">
                  Review active drives and submit applications matching your eligibility criteria.
                </p>
                <Link
                  href="/drives"
                  className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-primary text-[12px] font-semibold hover:bg-surface-container-high transition-colors"
                >
                  <span>Explore Drives</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {applications.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex items-center justify-between"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-semibold text-[13px] text-primary truncate">
                        {app.recruitmentDrive?.company?.name}
                      </span>
                      <span className="text-on-surface-variant text-[11px] truncate">
                        {app.recruitmentDrive?.jobRole}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                        app.status === 'SHORTLISTED'
                          ? 'bg-amber-100 text-amber-800'
                          : app.status === 'SELECTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-surface-container text-on-surface-variant'
                          : 'bg-blue-50 text-[#13357b]'
                      }`}
                    >
                      {app.status === 'APPLIED' ? 'Under Review' : app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity / Notification Feed */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">notifications_active</span>
                Recent Placement Activity
              </h2>
              <Link href="/notifications" className="text-secondary text-[12px] hover:underline font-semibold">
                All Alerts
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-outline">notifications_off</span>
                <span className="text-[13px] text-on-surface-variant font-medium">
                  No active notifications.
                </span>
                <p className="text-[12px] text-outline max-w-xs">
                  You will receive real-time alerts when TPO verifies your profile or companies update interview shortlists.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 text-[12px] p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0"></div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-primary">{n.title}</span>
                      <span className="text-on-surface-variant leading-tight">{n.message}</span>
                      <span className="text-outline text-[10px] mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
