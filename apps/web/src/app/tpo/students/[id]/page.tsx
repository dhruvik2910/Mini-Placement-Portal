'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '../../../../lib/api';
import type { StudentProfileDto, ApplicationDto, VerificationStatus } from '@placement/shared';

type DetailedStudent = StudentProfileDto & {
  user: { email: string; isActive: boolean };
  applications: ApplicationDto[];
  verifications: Array<{
    id: string;
    status: VerificationStatus;
    remarks: string | null;
    verifiedAt: string;
    verifiedBy: string;
  }>;
};

export default function TpoStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<DetailedStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verification state
  const [verifRemarks, setVerifRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchStudentDossier = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<DetailedStudent>(`/tpo/students/${id}`);
      setStudent(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load student dossier');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchStudentDossier();
    }
  }, [id, fetchStudentDossier]);

  const handleVerify = async (status: VerificationStatus) => {
    try {
      setVerifying(true);
      setActionSuccess(null);
      await api.post(`/tpo/students/${id}/verify`, {
        status,
        remarks: verifRemarks.trim() || undefined,
      });
      setActionSuccess(
        status === 'VERIFIED'
          ? 'Student academic records officially verified & approved.'
          : 'Compliance feedback and correction notice sent to student.'
      );
      setVerifRemarks('');
      await fetchStudentDossier();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || 'Failed to update verification status');
      }
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="font-label-md text-on-surface-variant text-[14px]">Loading student compliance dossier...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-3xl mx-auto p-space-xl bg-surface-container-lowest rounded-2xl border border-error/20 text-center space-y-3">
        <span className="material-symbols-outlined text-[40px] text-error">error</span>
        <h2 className="font-headline-sm text-on-surface font-bold text-[18px]">Student Dossier Not Found</h2>
        <p className="font-body-md text-on-surface-variant text-[13px]">{error}</p>
        <Link
          href="/tpo/students"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-[13px]"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Student Directory</span>
        </Link>
      </div>
    );
  }

  const isLocked = student.status === 'LOCKED';
  const isVerified = student.verificationStatus === 'VERIFIED';
  const isRejected = student.verificationStatus === 'REJECTED';

  return (
    <div className="space-y-space-lg">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/tpo/students"
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary font-label-md text-[13px] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Student Directory</span>
        </Link>
        <span className="font-mono text-outline text-[12px]">Enrollment: {student.enrollmentNumber}</span>
      </div>

      {/* Hero Dossier Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg sm:p-space-xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-space-md">
        <div className="flex items-start gap-space-md">
          <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-[24px] shrink-0 shadow-sm">
            {student.firstName[0]}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight">
                {student.firstName} {student.middleName || ''} {student.lastName}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[#13357b] text-[11px] font-bold border border-blue-200">
                LDCE • {student.studentType === 'D2D' ? 'D2D Lateral' : 'Regular 4-Year B.E.'}
              </span>
            </div>
            <p className="font-body-md text-on-surface-variant text-[13px]">
              L.D. College of Engineering, Ahmedabad • Department of {student.department} • Batch {student.batchYear} • Sem {student.currentSemester}
            </p>
            <div className="flex items-center gap-4 text-[12px] text-on-surface-variant pt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
                {student.user.email}
              </span>
              {student.phone && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                  {student.phone}
                </span>
              )}
              {student.gender && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-outline">person</span>
                  {student.gender}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-row md:flex-col items-start md:items-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20">
          <div className="flex items-center gap-1.5">
            <span className="font-label-sm text-outline text-[11px] uppercase">Lock:</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isLocked
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : 'bg-secondary-fixed text-on-secondary-fixed'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isLocked ? 'lock' : 'edit_document'}
              </span>
              <span>{isLocked ? 'SEALED & LOCKED' : 'DRAFT'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-label-sm text-outline text-[11px] uppercase">Compliance:</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isVerified
                  ? 'bg-emerald-100 text-emerald-800'
                  : isRejected
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isVerified ? 'verified' : isRejected ? 'cancel' : 'pending'}
              </span>
              <span>{student.verificationStatus}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Col Layout: Left (Academic & Skills) / Right (TPO Verification Action) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 Cols): Academic Records & Dossier */}
        <div className="lg:col-span-8 space-y-space-md">
          {/* Academic Overview Box */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              Academic Performance &amp; Standing
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px]">
              <div className="p-3 rounded-xl bg-surface-container-low/50">
                <span className="font-label-sm text-outline text-[11px] block">Verified CGPA</span>
                <span className="font-headline-sm text-primary font-bold font-mono text-[20px]">
                  {student.currentCgpa ? Number(student.currentCgpa).toFixed(2) : '0.00'}
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">Scale of 10.00</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low/50">
                <span className="font-label-sm text-outline text-[11px] block">Active Backlogs</span>
                <span
                  className={`font-headline-sm font-bold font-mono text-[20px] ${
                    student.activeBacklogs > 0 ? 'text-error' : 'text-emerald-700'
                  }`}
                >
                  {student.activeBacklogs}
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Total Backlogs: {student.totalBacklogs}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low/50">
                <span className="font-label-sm text-outline text-[11px] block">Semester Standing</span>
                <span className="font-headline-sm text-on-surface font-bold text-[20px]">
                  Sem {student.currentSemester}
                </span>
                <span className="text-[11px] text-on-surface-variant block mt-0.5">
                  Expected Graduation: {student.batchYear}
                </span>
              </div>
            </div>
          </div>

          {/* 10th Standard Marks & Subject Breakdown */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">menu_book</span>
                Secondary (10th Standard) Records
              </h2>
              {student.tenthMarks && (
                <span className="font-headline-sm font-mono text-primary font-bold text-[15px]">
                  {student.tenthMarks.percentage}%
                </span>
              )}
            </div>

            {student.tenthMarks ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[12px] bg-surface-container-low/40 p-2.5 rounded-xl">
                  <div>
                    <span className="text-outline text-[11px] block">Board Name:</span>
                    <span className="font-semibold">{student.tenthMarks.board}</span>
                  </div>
                  <div>
                    <span className="text-outline text-[11px] block">Passing Year:</span>
                    <span className="font-semibold">{student.tenthMarks.passingYear}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-outline text-[11px] block">School Name:</span>
                    <span className="font-semibold">{student.tenthMarks.schoolName}</span>
                  </div>
                </div>

                {/* Subject-wise Marks Table */}
                {student.tenthMarks.subjectWiseMarks?.length > 0 && (
                  <div>
                    <span className="font-label-sm uppercase tracking-wider text-outline text-[11px] font-bold block mb-1.5">
                      Subject-Wise Marks Breakdown
                    </span>
                    <div className="border border-outline-variant/20 rounded-xl overflow-hidden text-[12px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-surface-container-low/70 text-outline uppercase text-[10px] font-bold">
                            <th className="py-2 px-3">Subject Name</th>
                            <th className="py-2 px-3 text-center">Marks Obtained</th>
                            <th className="py-2 px-3 text-center">Max Marks</th>
                            <th className="py-2 px-3 text-right">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15">
                          {student.tenthMarks.subjectWiseMarks.map((subj, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-medium text-on-surface">{subj.subject}</td>
                              <td className="py-2 px-3 text-center font-mono">{subj.marksObtained}</td>
                              <td className="py-2 px-3 text-center font-mono">{subj.maxMarks}</td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-primary">
                                {((subj.marksObtained / subj.maxMarks) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-outline italic">No 10th standard record submitted yet.</p>
            )}
          </div>

          {/* 12th or D2D Details */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">school</span>
              {student.studentType === 'REGULAR'
                ? 'Higher Secondary (12th Standard) Records'
                : 'Diploma Engineering (D2D Track) Records'}
            </h2>

            {student.studentType === 'REGULAR' && student.twelfthDetails ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] bg-surface-container-low/40 p-3 rounded-xl">
                <div>
                  <span className="text-outline text-[11px] block">Board:</span>
                  <span className="font-semibold">{student.twelfthDetails.board}</span>
                </div>
                <div>
                  <span className="text-outline text-[11px] block">Stream:</span>
                  <span className="font-semibold">{student.twelfthDetails.stream}</span>
                </div>
                <div>
                  <span className="text-outline text-[11px] block">Passing Year:</span>
                  <span className="font-semibold">{student.twelfthDetails.passingYear}</span>
                </div>
                <div>
                  <span className="text-outline text-[11px] block">Percentage:</span>
                  <span className="font-bold text-primary font-mono text-[14px]">
                    {student.twelfthDetails.percentage}%
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-4 pt-1 border-t border-outline-variant/15">
                  <span className="text-outline text-[11px] block">School Name:</span>
                  <span className="font-semibold">{student.twelfthDetails.schoolName}</span>
                </div>
              </div>
            ) : student.studentType === 'D2D' && student.d2dDetails ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[12px] bg-surface-container-low/40 p-3 rounded-xl">
                <div>
                  <span className="text-outline text-[11px] block">Diploma College:</span>
                  <span className="font-semibold">{student.d2dDetails.diplomaCollege}</span>
                </div>
                <div>
                  <span className="text-outline text-[11px] block">University:</span>
                  <span className="font-semibold">{student.d2dDetails.diplomaUniversity}</span>
                </div>
                <div>
                  <span className="text-outline text-[11px] block">Branch:</span>
                  <span className="font-semibold">{student.d2dDetails.diplomaBranch}</span>
                </div>
                <div>
                  <span className="text-outline text-[11px] block">Diploma CGPA:</span>
                  <span className="font-bold text-primary font-mono text-[14px]">
                    {student.d2dDetails.diplomaCgpa}
                  </span>
                </div>
                <div>
                  <span className="text-outline text-[11px] block">Percentage:</span>
                  <span className="font-bold font-mono">
                    {student.d2dDetails.diplomaPercentage ? `${student.d2dDetails.diplomaPercentage}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-outline text-[11px] block">Completion Year:</span>
                  <span className="font-semibold">{student.d2dDetails.passingYear}</span>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-outline italic">No secondary academic credentials recorded.</p>
            )}
          </div>

          {/* Technical & Soft Skills */}
          {student.skills && (
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
              <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">code</span>
                Skills &amp; Competencies
              </h2>
              <div className="space-y-2.5 text-[12px]">
                {student.skills.technical?.length > 0 && (
                  <div>
                    <span className="text-outline text-[11px] block mb-1 font-semibold uppercase">
                      Technical Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {student.skills.technical.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-primary-fixed/40 text-on-primary-fixed font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {student.skills.soft?.length > 0 && (
                  <div>
                    <span className="text-outline text-[11px] block mb-1 font-semibold uppercase">
                      Soft Skills &amp; Leadership
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {student.skills.soft.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applications History */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
              Placement Applications ({student.applications.length})
            </h2>

            {student.applications.length === 0 ? (
              <p className="text-[13px] text-outline italic">No applications submitted yet by this student.</p>
            ) : (
              <div className="space-y-2">
                {student.applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div>
                      <span className="font-bold text-primary block leading-tight">
                        {app.recruitmentDrive?.company?.name} — {app.recruitmentDrive?.jobRole}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        Applied on {new Date(app.appliedAt).toLocaleDateString()} • Package:{' '}
                        {app.recruitmentDrive?.packageLpa ? `${app.recruitmentDrive.packageLpa} LPA` : 'Disclosed during round'}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        app.status === 'SELECTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'SHORTLISTED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-primary-fixed text-on-primary-fixed'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 Cols): TPO Verification & Resume Action */}
        <div className="lg:col-span-4 space-y-space-md sticky top-20">
          {/* Compliance & Verification Action Box */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-primary font-bold text-[15px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Compliance Action
              </h3>
              <span className="text-[11px] text-outline">Central TPO</span>
            </div>

            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0">check_circle</span>
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Current State Info */}
            <div className="p-3 rounded-xl bg-surface-container-low/50 space-y-1 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Profile Status:</span>
                <span className="font-bold">{student.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">TPO Verification:</span>
                <span className="font-bold text-primary">{student.verificationStatus}</span>
              </div>
            </div>

            {/* Remarks Input */}
            <div>
              <label className="block text-on-surface text-[12px] font-semibold mb-1">
                TPO Verification Notes / Remarks
              </label>
              <textarea
                rows={3}
                value={verifRemarks}
                onChange={(e) => setVerifRemarks(e.target.value)}
                placeholder="Enter feedback, marksheet verification note, or correction request..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none text-[12px] text-on-surface"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleVerify('VERIFIED' as VerificationStatus)}
                disabled={verifying}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[13px] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px]">verified</span>
                <span>Approve &amp; Verify Profile</span>
              </button>

              <button
                type="button"
                onClick={() => handleVerify('REJECTED' as VerificationStatus)}
                disabled={verifying}
                className="w-full py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-error font-semibold text-[13px] border border-outline-variant/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px]">warning</span>
                <span>Request Correction / Reject</span>
              </button>
            </div>
          </div>

          {/* Institutional Resume Box */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <h3 className="font-headline-sm text-primary font-bold text-[15px] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">description</span>
              Institutional Resume
            </h3>

            {student.resumeUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low text-[12px]">
                  <span className="material-symbols-outlined text-primary text-[24px]">picture_as_pdf</span>
                  <div className="min-w-0">
                    <span className="font-semibold text-primary block truncate">
                      {student.resumeName || 'Uploaded Resume.pdf'}
                    </span>
                    <span className="text-outline text-[10px]">
                      Updated: {student.resumeUpdatedAt ? new Date(student.resumeUpdatedAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                </div>
                <a
                  href={`http://localhost:5000${student.resumeUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-on-primary font-semibold text-[12px] hover:bg-primary-container transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>View / Download Resume PDF</span>
                </a>
              </div>
            ) : (
              <p className="text-[12px] text-outline italic">No PDF resume uploaded yet.</p>
            )}
          </div>

          {/* Verification Audit Log History */}
          {student.verifications?.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-space-md border border-outline-variant/30 shadow-sm space-y-2">
              <h4 className="font-label-sm uppercase tracking-wider text-outline text-[11px] font-bold">
                Verification Audit History
              </h4>
              <div className="space-y-2 text-[12px]">
                {student.verifications.map((v) => (
                  <div key={v.id} className="p-2 rounded-lg bg-surface-container-low/40 border border-outline-variant/15 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{v.status}</span>
                      <span className="text-[10px] text-outline">
                        {new Date(v.verifiedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {v.remarks && <p className="text-on-surface-variant text-[11px] italic">&ldquo;{v.remarks}&rdquo;</p>}
                    <span className="text-outline text-[10px] block">Officer: {v.verifiedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
