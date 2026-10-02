'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';
import { StudentType } from '@placement/shared';

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    enrollmentNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    department: 'Computer Engineering',
    batchYear: 2025,
    studentType: StudentType.REGULAR,
    phone: '9876543210',
    currentSemester: 7,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-xl flex flex-col gap-space-md">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-14 h-14 rounded-2xl bg-[#13357b] flex items-center justify-center text-white font-extrabold text-[20px] shadow-sm tracking-tighter mb-1">
            <span>LDCE</span>
          </div>
          <span className="font-label-sm uppercase tracking-wider text-outline text-[11px] font-bold">
            Training &amp; Placement Cell
          </span>
          <h1 className="font-headline-lg text-[#13357b] font-extrabold text-[24px]">
            LDCE Student Registration
          </h1>
          <p className="font-body-sm text-on-surface-variant text-[13px]">
            L.D. College of Engineering, Ahmedabad • GTU College Code: 028
          </p>
          <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#13357b] text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            <span>Permanent Institution: L.D. College of Engineering (LDCE)</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
          {error && (
            <div className="p-3 rounded-lg bg-error-container/30 border border-error/20 flex items-center gap-2 text-error text-[13px] font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
            {/* Student Admission Type Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                Admission Track / Student Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, studentType: StudentType.REGULAR })}
                  className={`py-2 px-3 rounded-lg border text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    formData.studentType === StudentType.REGULAR
                      ? 'bg-primary-container text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">school</span>
                  <span>Regular Entry (10th + 12th)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, studentType: StudentType.D2D })}
                  className={`py-2 px-3 rounded-lg border text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    formData.studentType === StudentType.D2D
                      ? 'bg-primary-container text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">alt_route</span>
                  <span>D2D Lateral (Diploma to Degree)</span>
                </button>
              </div>
            </div>

            {/* Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface focus:outline-none focus:border-secondary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                  Middle Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. K."
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface focus:outline-none focus:border-secondary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mehta"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface focus:outline-none focus:border-secondary transition-all"
                />
              </div>
            </div>

            {/* Enrollment and Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                  Enrollment / Roll Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 210280107042 (GTU Format)"
                  value={formData.enrollmentNumber}
                  onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface uppercase focus:outline-none focus:border-secondary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                  LDCE Engineering Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface focus:outline-none focus:border-secondary transition-all"
                >
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence &amp; ML</option>
                  <option value="Electronics & Communication">Electronics &amp; Communication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Instrumentation & Control">Instrumentation &amp; Control</option>
                  <option value="Automobile Engineering">Automobile Engineering</option>
                  <option value="Biomedical Engineering">Biomedical Engineering</option>
                  <option value="Robotics and Automation">Robotics &amp; Automation</option>
                </select>
              </div>
            </div>

            {/* Email and Batch Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                  Student Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@student.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface focus:outline-none focus:border-secondary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                  Graduation Batch Year *
                </label>
                <select
                  value={formData.batchYear}
                  onChange={(e) => setFormData({ ...formData, batchYear: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface focus:outline-none focus:border-secondary transition-all"
                >
                  <option value={2025}>2025 (Final Year)</option>
                  <option value={2026}>2026 (Pre-Final Year)</option>
                  <option value={2024}>2024 (Passout)</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant font-medium text-[12px]">
                Account Password * (Minimum 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-[13px] text-on-surface focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-11 px-4 rounded-xl bg-secondary text-on-secondary hover:bg-secondary-container transition-colors shadow-sm font-label-md text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
              <span>{loading ? 'Creating Account...' : 'Complete Registration & Proceed'}</span>
            </button>
          </form>

          <div className="text-center text-[13px] text-on-surface-variant pt-2 border-t border-outline-variant/20">
            Already registered?{' '}
            <Link href="/login" className="text-secondary font-semibold hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
