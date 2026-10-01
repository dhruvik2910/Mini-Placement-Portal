'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, downloadCsv } from '../../../lib/api';
import type { StudentProfileDto } from '@placement/shared';

type StudentWithCount = StudentProfileDto & { applicationsCount: number };

export default function TpoStudentsDirectoryPage() {
  const [students, setStudents] = useState<StudentWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Export states
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verifFilter, setVerifFilter] = useState('ALL');
  const [backlogFilter, setBacklogFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [semFilter, setSemFilter] = useState('ALL');
  const [cgpaFilter, setCgpaFilter] = useState('ALL');

  const resetAllFilters = () => {
    setSearch('');
    setDeptFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setVerifFilter('ALL');
    setBacklogFilter('ALL');
    setBatchFilter('ALL');
    setSemFilter('ALL');
    setCgpaFilter('ALL');
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      setExportError(null);
      setExportSuccess(null);
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (deptFilter !== 'ALL') queryParams.set('department', deptFilter);
      if (typeFilter !== 'ALL') queryParams.set('studentType', typeFilter);
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (verifFilter !== 'ALL') queryParams.set('verificationStatus', verifFilter);
      if (backlogFilter !== 'ALL') queryParams.set('backlogStatus', backlogFilter);
      if (batchFilter !== 'ALL') queryParams.set('batchYear', batchFilter);
      if (semFilter !== 'ALL') queryParams.set('currentSemester', semFilter);
      if (cgpaFilter !== 'ALL') queryParams.set('minCgpa', cgpaFilter);

      const qs = queryParams.toString();
      const path = qs ? `/tpo/students/export-csv?${qs}` : '/tpo/students/export-csv';
      const timestamp = new Date().toISOString().slice(0, 10);
      await downloadCsv(path, `ldce-student-cohort-${timestamp}.csv`);
      setExportSuccess('Student cohort directory exported to CSV successfully.');
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to export student cohort CSV');
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setExporting(false);
    }
  };

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (search.trim()) queryParams.set('search', search.trim());
      if (deptFilter !== 'ALL') queryParams.set('department', deptFilter);
      if (typeFilter !== 'ALL') queryParams.set('studentType', typeFilter);
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (verifFilter !== 'ALL') queryParams.set('verificationStatus', verifFilter);
      if (backlogFilter !== 'ALL') queryParams.set('backlogStatus', backlogFilter);
      if (batchFilter !== 'ALL') queryParams.set('batchYear', batchFilter);
      if (semFilter !== 'ALL') queryParams.set('currentSemester', semFilter);
      if (cgpaFilter !== 'ALL') queryParams.set('minCgpa', cgpaFilter);

      const qs = queryParams.toString();
      const url = qs ? `/tpo/students?${qs}` : '/tpo/students';
      const data = await api.get<StudentWithCount[]>(url);
      setStudents(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load students directory');
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, typeFilter, statusFilter, verifFilter, backlogFilter, batchFilter, semFilter, cgpaFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

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
            <span className="text-primary font-bold">LDCE Students</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            LDCE Student Cohort &amp; Compliance Directory
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Audit student academic credentials, verify 10th/12th/diploma marksheets, inspect sealed dossiers, and track application volumes across all LDCE branches.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-[#13357b] font-label-md text-[13px] font-bold shadow-xs">
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>{students.length} LDCE Students</span>
          </span>
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#13357b] border border-blue-200 font-label-md text-[13px] font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export filtered student cohort directory to CSV"
          >
            <span className={`material-symbols-outlined text-[18px] ${exporting ? 'animate-spin' : ''}`}>
              {exporting ? 'refresh' : 'download'}
            </span>
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Export Status Alerts */}
      {exportSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex items-center justify-between animate-in fade-in duration-150">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{exportSuccess}</span>
          </span>
          <button onClick={() => setExportSuccess(null)} className="text-emerald-900 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {exportError && (
        <div className="p-3 rounded-xl bg-error-container text-on-error-container text-[13px] flex items-center justify-between animate-in fade-in duration-150">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{exportError}</span>
          </span>
          <button onClick={() => setExportError(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
        {/* Top search & quick count */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, GTU enrollment number (e.g. 210280107042)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none text-[13px] text-on-surface"
            />
          </div>
          <button
            onClick={resetAllFilters}
            className="px-3 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-outline hover:text-primary text-[12px] font-semibold border border-outline-variant/30 transition-colors flex items-center justify-center gap-1 shrink-0"
            title="Reset All Filters"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Dropdowns Grid (Row 1 & 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[12px]">
          {/* 1. Department */}
          <div>
            <label className="block text-outline text-[10px] uppercase font-bold mb-1">LDCE Branch</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[11px]"
            >
              <option value="ALL">All Branches</option>
              <option value="Computer Engineering">Computer</option>
              <option value="Information Technology">IT</option>
              <option value="Artificial Intelligence and Machine Learning">AI &amp; ML</option>
              <option value="Electronics & Communication">EC</option>
              <option value="Electrical Engineering">Electrical</option>
              <option value="Mechanical Engineering">Mechanical</option>
              <option value="Civil Engineering">Civil</option>
              <option value="Chemical Engineering">Chemical</option>
              <option value="Instrumentation & Control">IC</option>
            </select>
          </div>

          {/* 2. Batch */}
          <div>
            <label className="block text-outline text-[10px] uppercase font-bold mb-1">Batch Year</label>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[11px]"
            >
              <option value="ALL">All Batches</option>
              <option value="2024">2024 (Final Year)</option>
              <option value="2025">2025 (Pre-final)</option>
              <option value="2026">2026 (Sophomore)</option>
            </select>
          </div>

          {/* 3. Semester */}
          <div>
            <label className="block text-outline text-[10px] uppercase font-bold mb-1">Current Sem</label>
            <select
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[11px]"
            >
              <option value="ALL">All Semesters</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
            </select>
          </div>

          {/* 4. Student Track */}
          <div>
            <label className="block text-outline text-[10px] uppercase font-bold mb-1">Track</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[11px]"
            >
              <option value="ALL">All Tracks</option>
              <option value="REGULAR">Regular 4-Yr</option>
              <option value="D2D">Lateral D2D</option>
            </select>
          </div>

          {/* 5. CGPA Threshold */}
          <div>
            <label className="block text-outline text-[10px] uppercase font-bold mb-1">Min CGPA</label>
            <select
              value={cgpaFilter}
              onChange={(e) => setCgpaFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[11px]"
            >
              <option value="ALL">Any CGPA</option>
              <option value="8.5">≥ 8.5 CGPA</option>
              <option value="8.0">≥ 8.0 CGPA</option>
              <option value="7.5">≥ 7.5 CGPA</option>
              <option value="7.0">≥ 7.0 CGPA</option>
              <option value="6.0">≥ 6.0 CGPA</option>
            </select>
          </div>

          {/* 6. Backlogs */}
          <div>
            <label className="block text-outline text-[10px] uppercase font-bold mb-1">Backlogs</label>
            <select
              value={backlogFilter}
              onChange={(e) => setBacklogFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[11px]"
            >
              <option value="ALL">All Backlog Status</option>
              <option value="ZERO_BACKLOGS">0 (Clear Only)</option>
              <option value="HAS_BACKLOGS">Has Backlogs</option>
            </select>
          </div>

          {/* 7. Lock Status */}
          <div>
            <label className="block text-outline text-[10px] uppercase font-bold mb-1">Lock Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[11px]"
            >
              <option value="ALL">All Profiles</option>
              <option value="LOCKED">Sealed / Locked</option>
              <option value="DRAFT">Unlocked (DRAFT)</option>
            </select>
          </div>

          {/* 8. Verification Status */}
          <div>
            <label className="block text-outline text-[10px] uppercase font-bold mb-1">Verification</label>
            <select
              value={verifFilter}
              onChange={(e) => setVerifFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface text-[11px]"
            >
              <option value="ALL">All Verifications</option>
              <option value="PENDING">Pending Review</option>
              <option value="VERIFIED">TPO Verified</option>
              <option value="REJECTED">Correction Req.</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-3 font-label-md text-on-surface-variant text-[13px]">
            Filtering student cohort records...
          </p>
        </div>
      ) : error ? (
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-error/20 text-center space-y-2">
          <span className="material-symbols-outlined text-[32px] text-error">error</span>
          <p className="font-body-md text-on-surface font-semibold">{error}</p>
          <button
            onClick={fetchStudents}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
          >
            Retry
          </button>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-space-xl border border-outline-variant/30 text-center space-y-2">
          <span className="material-symbols-outlined text-outline text-[36px]">search_off</span>
          <h3 className="font-headline-sm text-on-surface font-bold text-[16px]">
            No Students Matched Criteria
          </h3>
          <p className="font-body-md text-on-surface-variant text-[13px] max-w-sm mx-auto">
            Try adjusting your search query or reset the filter dropdowns above.
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-outline uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4 whitespace-nowrap">Student Name &amp; Enrollment</th>
                  <th className="py-3 px-4 whitespace-nowrap">Department &amp; Track</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Academic Standing</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Lock Status</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">TPO Verification</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Apps</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                {students.map((student) => {
                  const isLocked = student.status === 'LOCKED';
                  const isVerified = student.verificationStatus === 'VERIFIED';
                  const isRejected = student.verificationStatus === 'REJECTED';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-surface-container-low/40 transition-colors"
                    >
                      {/* Name & Enrollment */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-primary-fixed/40 text-primary font-bold flex items-center justify-center text-[13px] shrink-0">
                            {student.firstName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-primary block leading-tight">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="font-mono text-outline text-[11px]">
                              {student.enrollmentNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Track */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold block leading-tight">{student.department}</span>
                        <span className="text-[11px] text-on-surface-variant">
                          {student.studentType === 'D2D' ? 'Lateral D2D' : 'Regular 4-Yr'} • Batch {student.batchYear}
                        </span>
                      </td>

                      {/* Academic CGPA & Backlogs */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-primary text-[14px] block leading-tight">
                          {student.currentCgpa ? Number(student.currentCgpa).toFixed(2) : '0.00'}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            student.activeBacklogs > 0 ? 'text-error' : 'text-outline'
                          }`}
                        >
                          {student.activeBacklogs > 0 ? `${student.activeBacklogs} Backlogs` : 'Clear (0)'}
                        </span>
                      </td>

                      {/* Lock Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
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
                          <span>{isLocked ? 'LOCKED' : 'DRAFT'}</span>
                        </span>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
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
                      </td>

                      {/* Applications Count */}
                      <td className="py-3 px-4 text-center font-mono font-semibold whitespace-nowrap">
                        {student.applicationsCount}
                      </td>

                      {/* Action Link */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/tpo/students/${student.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[12px] border border-outline-variant/30 transition-colors"
                        >
                          <span>Inspect</span>
                          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
