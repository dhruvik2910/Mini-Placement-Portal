'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '../../../../lib/api';
import type { CompanyDto, EligibilityPreviewResult } from '@placement/shared';

const DEPARTMENTS = [
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

export default function CreateDrivePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    companyId: '',
    title: '',
    jobRole: '',
    driveType: 'FULL_TIME',
    packageLpa: '12.00',
    stipendMonthly: '',
    location: 'Bangalore / Pune / Hyderabad',
    description: '',
    deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    driveDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    requiredSkills: 'React, Node.js, SQL, Problem Solving',
    minCgpa: '7.00',
    maxActiveBacklogs: '0',
    minTenthPercentage: '65',
    minTwelfthOrDiplomaPercentage: '65',
    allowedStudentTypes: ['REGULAR', 'D2D'],
    allowedDepartments: ['Computer Engineering', 'Information Technology'],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Eligibility Preview State
  const [preview, setPreview] = useState<EligibilityPreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showIneligibleList, setShowIneligibleList] = useState(false);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await api.get<CompanyDto[]>('/tpo/companies');
        setCompanies(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, companyId: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    }
    loadCompanies();
  }, []);

  const calculatePreview = useCallback(async () => {
    try {
      setLoadingPreview(true);
      const payload = {
        minCgpa: Number(formData.minCgpa) || 0,
        maxActiveBacklogs: Number(formData.maxActiveBacklogs) || 0,
        minTenthPercentage: Number(formData.minTenthPercentage) || 0,
        minTwelfthOrDiplomaPercentage: Number(formData.minTwelfthOrDiplomaPercentage) || 0,
        allowedStudentTypes: formData.allowedStudentTypes,
        allowedDepartments: formData.allowedDepartments,
      };
      const result = await api.post<EligibilityPreviewResult>(
        '/tpo/drives/eligibility-preview',
        payload
      );
      setPreview(result);
    } catch (err) {
      console.error('Failed to compute eligibility preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  }, [
    formData.minCgpa,
    formData.maxActiveBacklogs,
    formData.minTenthPercentage,
    formData.minTwelfthOrDiplomaPercentage,
    formData.allowedStudentTypes,
    formData.allowedDepartments,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculatePreview();
    }, 400);
    return () => clearTimeout(timer);
  }, [calculatePreview]);

  const handleDepartmentToggle = (dept: string) => {
    setFormData((prev) => {
      const exists = prev.allowedDepartments.includes(dept);
      const updated = exists
        ? prev.allowedDepartments.filter((d) => d !== dept)
        : [...prev.allowedDepartments, dept];
      return { ...prev, allowedDepartments: updated };
    });
  };

  const handleTrackToggle = (track: string) => {
    setFormData((prev) => {
      const exists = prev.allowedStudentTypes.includes(track);
      const updated = exists
        ? prev.allowedStudentTypes.filter((t) => t !== track)
        : [...prev.allowedStudentTypes, track];
      return { ...prev, allowedStudentTypes: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId) {
      setError('Please select a recruiting partner');
      return;
    }
    if (formData.allowedDepartments.length === 0) {
      setError('Select at least one eligible department');
      return;
    }
    if (formData.allowedStudentTypes.length === 0) {
      setError('Select at least one eligible student track');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        companyId: formData.companyId,
        title: formData.title || `${formData.jobRole} Campus Recruitment`,
        jobRole: formData.jobRole,
        driveType: formData.driveType,
        status: 'ACTIVE',
        packageLpa: formData.packageLpa ? Number(formData.packageLpa) : null,
        stipendMonthly: formData.stipendMonthly ? Number(formData.stipendMonthly) : null,
        location: formData.location || null,
        description: formData.description || null,
        deadline: new Date(`${formData.deadline}T23:59:59.000Z`).toISOString(),
        driveDate: formData.driveDate ? new Date(`${formData.driveDate}T09:00:00.000Z`).toISOString() : null,
        requiredSkills: formData.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        minCgpa: Number(formData.minCgpa) || 0,
        minTenthPercentage: Number(formData.minTenthPercentage) || 0,
        minTwelfthOrDiplomaPercentage: Number(formData.minTwelfthOrDiplomaPercentage) || 0,
        maxActiveBacklogs: Number(formData.maxActiveBacklogs) || 0,
        allowedStudentTypes: formData.allowedStudentTypes,
        allowedDepartments: formData.allowedDepartments,
      };

      await api.post('/tpo/drives', payload);
      router.push('/tpo/drives');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || 'Failed to publish recruitment drive');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
            <Link href="/tpo/drives" className="hover:text-primary transition-colors">
              LDCE Recruitment Drives
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">New Drive Specification</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            Publish LDCE Recruitment Drive
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Configure role details and academic criteria. The backend will evaluate the live LDCE student cohort eligibility in real-time.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-error-container text-on-error-container text-[13px] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-Column Form Layout: Left (Form) / Right (Live Eligibility Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left (8 Cols): Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-space-md">
          {/* Section 1: Role & Company */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-3 text-[13px]">
            <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">apartment</span>
              Company &amp; Role Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Recruiting Company *</label>
                {loadingCompanies ? (
                  <div className="h-10 bg-surface-container-low rounded-xl animate-pulse"></div>
                ) : (
                  <select
                    required
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.industry ? `(${c.industry})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Job Role / Designation *</label>
                <input
                  type="text"
                  required
                  value={formData.jobRole}
                  onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  placeholder="e.g. Software Engineer, Associate Consultant"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Drive Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Graduate Engineering Trainee Program 2025"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Drive Engagement Type</label>
                <select
                  value={formData.driveType}
                  onChange={(e) => setFormData({ ...formData, driveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                >
                  <option value="FULL_TIME">Full-Time (FTE)</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="INTERN_PLUS_FTE">Internship + Pre-Placement Offer (PPO)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Annual CTC (LPA)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.packageLpa}
                  onChange={(e) => setFormData({ ...formData, packageLpa: e.target.value })}
                  placeholder="12.00"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Job Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Bangalore, Hyderabad, Remote"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">Job Description &amp; Role Details</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Responsibilities, interview rounds, probation period..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1">Required Competencies (Comma Separated)</label>
              <input
                type="text"
                value={formData.requiredSkills}
                onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                placeholder="Python, React, Data Structures, System Design"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
              />
            </div>
          </div>

          {/* Section 2: Eligibility Rules */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-3 text-[13px]">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                Eligibility Constraints
              </h2>
              <span className="text-[11px] text-outline">Enforced Server-Side</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Min. CGPA</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  value={formData.minCgpa}
                  onChange={(e) => setFormData({ ...formData, minCgpa: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Max Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.maxActiveBacklogs}
                  onChange={(e) => setFormData({ ...formData, maxActiveBacklogs: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Min. 10th Marks (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minTenthPercentage}
                  onChange={(e) => setFormData({ ...formData, minTenthPercentage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Min. 12th/Diploma (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minTwelfthOrDiplomaPercentage}
                  onChange={(e) => setFormData({ ...formData, minTwelfthOrDiplomaPercentage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>
            </div>

            {/* Allowed Tracks */}
            <div>
              <label className="block font-semibold text-on-surface mb-1.5">Eligible Student Tracks</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowedStudentTypes.includes('REGULAR')}
                    onChange={() => handleTrackToggle('REGULAR')}
                    className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span>Regular 4-Year B.Tech</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowedStudentTypes.includes('D2D')}
                    onChange={() => handleTrackToggle('D2D')}
                    className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span>Lateral D2D Diploma Entry</span>
                </label>
              </div>
            </div>

            {/* Allowed Departments */}
            <div>
              <label className="block font-semibold text-on-surface mb-1.5">Eligible Academic Departments</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEPARTMENTS.map((dept) => (
                  <label key={dept} className="inline-flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-surface-container-low/50">
                    <input
                      type="checkbox"
                      checked={formData.allowedDepartments.includes(dept)}
                      onChange={() => handleDepartmentToggle(dept)}
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span>{dept}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Key Deadlines */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-3 text-[13px]">
            <h2 className="font-headline-sm text-primary font-bold text-[16px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              Drive Schedule &amp; Deadlines
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Application Deadline *</label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Drive / Assessment Date</label>
                <input
                  type="date"
                  value={formData.driveDate}
                  onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[13px]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/tpo/drives"
              className="px-5 py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold text-[13px] hover:bg-surface-container transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>
              )}
              <span>Publish Placement Drive</span>
            </button>
          </div>
        </form>

        {/* Right (4 Cols): Live Eligibility Preview Widget */}
        <div className="lg:col-span-4 space-y-space-md sticky top-20">
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-outline-variant/30 shadow-sm space-y-space-md">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <h3 className="font-headline-sm text-primary font-bold text-[15px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">rule</span>
                Live Eligibility Preview
              </h3>
              {loadingPreview && (
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
              )}
            </div>

            <p className="font-body-sm text-on-surface-variant text-[12px] leading-relaxed">
              Evaluating criteria against the real registered student cohort using the backend eligibility engine.
            </p>

            {preview && (
              <div className="space-y-3">
                {/* Stats Metric */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="font-headline-md font-bold text-emerald-800 text-[22px] block">
                      {preview.eligibleCount}
                    </span>
                    <span className="text-[11px] text-emerald-900 font-semibold uppercase">
                      Eligible Students
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="font-headline-md font-bold text-outline text-[22px] block">
                      {preview.ineligibleCount}
                    </span>
                    <span className="text-[11px] text-outline font-semibold uppercase">
                      Ineligible
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-semibold mb-1">
                    <span>Cohort Coverage</span>
                    <span>{preview.eligibilityPercentage}% Eligible</span>
                  </div>
                  <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${preview.eligibilityPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Ineligible Students Inspection */}
                <div className="pt-2 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setShowIneligibleList(!showIneligibleList)}
                    className="w-full py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-[12px] flex items-center justify-between px-3 transition-colors"
                  >
                    <span>Inspect Candidate Reasons ({preview.students.length})</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {showIneligibleList ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {showIneligibleList && (
                    <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-outline-variant/15 text-[11px] border border-outline-variant/20 rounded-xl p-2 bg-surface-container-low/40">
                      {preview.students.map((item) => (
                        <div key={item.student.id} className="py-2 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-on-surface">
                              {item.student.firstName} {item.student.lastName} ({item.student.enrollmentNumber})
                            </span>
                            <span
                              className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                                item.isEligible
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-error-container text-on-error-container'
                              }`}
                            >
                              {item.isEligible ? 'Eligible' : 'Ineligible'}
                            </span>
                          </div>
                          {!item.isEligible && item.reasons.length > 0 && (
                            <ul className="text-error list-disc pl-3 text-[10px] space-y-0.5">
                              {item.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
