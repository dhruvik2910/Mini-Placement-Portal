'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { api } from '../../lib/api';
import type { StudentProfileDto, SubjectWiseMark } from '@placement/shared';

export default function StudentProfilePage() {
  const { user, updateLocalProfile } = useAuth();
  const [profile, setProfile] = useState<StudentProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'skills' | 'resume'>('personal');
  const [showLockModal, setShowLockModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    department: 'Computer Engineering',
    batchYear: 2025,
    currentSemester: 7,
    currentCgpa: 0,
    activeBacklogs: 0,
    totalBacklogs: 0,

    // 10th
    tenthBoard: 'CBSE',
    tenthSchool: '',
    tenthYear: 2019,
    tenthMarksObtained: 0,
    tenthTotalMarks: 500,
    tenthSubjects: [
      { subject: 'Mathematics', marksObtained: 90, maxMarks: 100 },
      { subject: 'Science', marksObtained: 85, maxMarks: 100 },
      { subject: 'English', marksObtained: 88, maxMarks: 100 },
    ] as SubjectWiseMark[],

    // 12th
    twelfthBoard: 'CBSE',
    twelfthSchool: '',
    twelfthYear: 2021,
    twelfthStream: 'Science (PCM)',
    twelfthMarksObtained: 0,
    twelfthTotalMarks: 500,

    // D2D
    diplomaCollege: '',
    diplomaUniversity: 'Gujarat Technological University (GTU)',
    diplomaBranch: 'Computer Engineering',
    diplomaYear: 2022,
    diplomaCgpa: 0,
    diplomaPercentage: 0,

    // Skills
    technicalSkills: 'React, Node.js, TypeScript, PostgreSQL',
    softSkills: 'Problem Solving, Team Communication',
    languages: 'English, Hindi',
    tools: 'Git, VS Code, Postman',
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get<StudentProfileDto>('/student/profile');
        setProfile(data);
        populateForm(data);
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const populateForm = (data: StudentProfileDto) => {
    setFormData({
      firstName: data.firstName || '',
      middleName: data.middleName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
      gender: data.gender || 'Male',
      address: data.address || '',
      department: data.department || 'Computer Engineering',
      batchYear: data.batchYear || 2025,
      currentSemester: data.currentSemester || 7,
      currentCgpa: data.currentCgpa || 0,
      activeBacklogs: data.activeBacklogs || 0,
      totalBacklogs: data.totalBacklogs || 0,

      // 10th
      tenthBoard: data.tenthMarks?.board || 'CBSE',
      tenthSchool: data.tenthMarks?.schoolName || '',
      tenthYear: data.tenthMarks?.passingYear || 2019,
      tenthMarksObtained: data.tenthMarks?.marksObtained || 0,
      tenthTotalMarks: data.tenthMarks?.totalMarks || 500,
      tenthSubjects: data.tenthMarks?.subjectWiseMarks?.length
        ? data.tenthMarks.subjectWiseMarks
        : [
            { subject: 'Mathematics', marksObtained: 90, maxMarks: 100 },
            { subject: 'Science', marksObtained: 85, maxMarks: 100 },
            { subject: 'English', marksObtained: 88, maxMarks: 100 },
          ],

      // 12th
      twelfthBoard: data.twelfthDetails?.board || 'CBSE',
      twelfthSchool: data.twelfthDetails?.schoolName || '',
      twelfthYear: data.twelfthDetails?.passingYear || 2021,
      twelfthStream: data.twelfthDetails?.stream || 'Science (PCM)',
      twelfthMarksObtained: data.twelfthDetails?.marksObtained || 0,
      twelfthTotalMarks: data.twelfthDetails?.totalMarks || 500,

      // D2D
      diplomaCollege: data.d2dDetails?.diplomaCollege || '',
      diplomaUniversity: data.d2dDetails?.diplomaUniversity || 'Gujarat Technological University (GTU)',
      diplomaBranch: data.d2dDetails?.diplomaBranch || 'Computer Engineering',
      diplomaYear: data.d2dDetails?.passingYear || 2022,
      diplomaCgpa: data.d2dDetails?.diplomaCgpa || 0,
      diplomaPercentage: data.d2dDetails?.diplomaPercentage || 0,

      // Skills
      technicalSkills: data.skills?.technical?.join(', ') || '',
      softSkills: data.skills?.soft?.join(', ') || '',
      languages: data.skills?.languages?.join(', ') || '',
      tools: data.skills?.tools?.join(', ') || '',
    });
  };

  const isLocked = profile?.status === 'LOCKED';
  const isD2D = profile?.studentType === 'D2D';

  // Real-time 10th percentage calculation
  const calculatedTenthPercentage =
    formData.tenthTotalMarks > 0
      ? ((formData.tenthMarksObtained / formData.tenthTotalMarks) * 100).toFixed(2)
      : '0.00';

  // Real-time 12th percentage calculation
  const calculatedTwelfthPercentage =
    formData.twelfthTotalMarks > 0
      ? ((formData.twelfthMarksObtained / formData.twelfthTotalMarks) * 100).toFixed(2)
      : '0.00';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setSaving(true);
    setMessage(null);

    const payload: any = {
      firstName: formData.firstName,
      middleName: formData.middleName || null,
      lastName: formData.lastName,
      phone: formData.phone || null,
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender,
      address: formData.address || null,
      department: formData.department,
      batchYear: formData.batchYear,
      currentSemester: formData.currentSemester,
      currentCgpa: Number(formData.currentCgpa),
      activeBacklogs: Number(formData.activeBacklogs),
      totalBacklogs: Number(formData.totalBacklogs),
      tenthMarks: {
        board: formData.tenthBoard,
        schoolName: formData.tenthSchool,
        passingYear: Number(formData.tenthYear),
        marksObtained: Number(formData.tenthMarksObtained),
        totalMarks: Number(formData.tenthTotalMarks),
        percentage: Number(calculatedTenthPercentage),
        subjectWiseMarks: formData.tenthSubjects,
      },
      skills: {
        technical: formData.technicalSkills.split(',').map((s) => s.trim()).filter(Boolean),
        soft: formData.softSkills.split(',').map((s) => s.trim()).filter(Boolean),
        languages: formData.languages.split(',').map((s) => s.trim()).filter(Boolean),
        tools: formData.tools.split(',').map((s) => s.trim()).filter(Boolean),
      },
    };

    if (!isD2D) {
      payload.twelfthDetails = {
        board: formData.twelfthBoard,
        schoolName: formData.twelfthSchool,
        passingYear: Number(formData.twelfthYear),
        stream: formData.twelfthStream,
        marksObtained: Number(formData.twelfthMarksObtained),
        totalMarks: Number(formData.twelfthTotalMarks),
        percentage: Number(calculatedTwelfthPercentage),
      };
    } else {
      payload.d2dDetails = {
        diplomaCollege: formData.diplomaCollege,
        diplomaUniversity: formData.diplomaUniversity,
        diplomaBranch: formData.diplomaBranch,
        passingYear: Number(formData.diplomaYear),
        diplomaCgpa: Number(formData.diplomaCgpa),
        diplomaPercentage: formData.diplomaPercentage ? Number(formData.diplomaPercentage) : null,
      };
    }

    try {
      const updated = await api.put<StudentProfileDto>('/student/profile', payload);
      setProfile(updated);
      updateLocalProfile(updated);
      setMessage({ type: 'success', text: 'Academic profile changes saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLockProfile = async () => {
    setLocking(true);
    setMessage(null);
    try {
      const updated = await api.post<StudentProfileDto>('/student/profile/lock');
      setProfile(updated);
      updateLocalProfile(updated);
      setShowLockModal(false);
      setMessage({
        type: 'success',
        text: 'Profile submitted & LOCKED successfully. Your records are now sealed for TPO compliance verification.',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to lock profile.' });
      setShowLockModal(false);
    } finally {
      setLocking(false);
    }
  };

  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;

    setUploadingResume(true);
    setMessage(null);
    try {
      const data = new FormData();
      data.append('resume', resumeFile);
      const updated = await api.post<StudentProfileDto>('/student/resume', data);
      setProfile(updated);
      updateLocalProfile(updated);
      setResumeFile(null);
      setMessage({ type: 'success', text: 'Resume PDF uploaded successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload resume.' });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm('Are you sure you want to delete your uploaded resume?')) return;
    try {
      const updated = await api.delete<StudentProfileDto>('/student/resume');
      setProfile(updated);
      updateLocalProfile(updated);
      setMessage({ type: 'success', text: 'Resume deleted.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete resume.' });
    }
  };

  const addSubjectRow = () => {
    setFormData({
      ...formData,
      tenthSubjects: [...formData.tenthSubjects, { subject: '', marksObtained: 0, maxMarks: 100 }],
    });
  };

  const updateSubjectRow = (index: number, field: keyof SubjectWiseMark, value: any) => {
    const updated = [...formData.tenthSubjects];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, tenthSubjects: updated });
  };

  const removeSubjectRow = (index: number) => {
    const updated = formData.tenthSubjects.filter((_, i) => i !== index);
    setFormData({ ...formData, tenthSubjects: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="material-symbols-outlined text-[36px] text-secondary animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-md">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
            <span>Student Dossier</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Academic Registry</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#13357b] font-semibold">TPO Compliance Clearance</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-bold tracking-tight text-[24px] sm:text-[28px]">
              LDCE Student Profile &amp; Academic Records
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#13357b] border border-blue-200 font-label-sm text-[11px] font-bold">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              L.D. College of Engineering (Code: 028)
            </span>
          </div>
        </div>

        {/* Lock/Verify Status Badges */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label-md text-[13px] font-semibold shadow-xs ${
              isLocked
                ? 'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim'
                : 'bg-secondary-fixed text-on-secondary-fixed border border-outline-variant/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isLocked ? 'lock' : 'edit_document'}
            </span>
            <span>{isLocked ? 'Status: LOCKED' : 'Status: DRAFT'}</span>
          </span>

          {!isLocked && (
            <button
              onClick={() => setShowLockModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-[13px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Lock Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-3.5 rounded-xl flex items-center gap-2.5 text-[13px] font-medium ${
            message.type === 'success'
              ? 'bg-tertiary-fixed/30 text-on-surface border border-tertiary-fixed'
              : 'bg-error-container/30 text-error border border-error/20'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* 4-Stage Compliance Journey in Dossier */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[12px]">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#13357b]">
            <span className="material-symbols-outlined text-[18px] text-[#13357b]">check_circle</span>
            <span className="font-bold block mt-0.5">1. Enrollment</span>
            <span className="text-[11px] text-on-surface-variant">GTU Code: 028</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#13357b]">
            <span className="material-symbols-outlined text-[18px] text-[#13357b]">check_circle</span>
            <span className="font-bold block mt-0.5">2. Marksheets</span>
            <span className="text-[11px] text-on-surface-variant">10th + 12th/Diploma</span>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            isLocked
              ? 'bg-blue-50 border-blue-200 text-[#13357b]'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <span className="material-symbols-outlined text-[18px]">
              {isLocked ? 'lock' : 'edit_document'}
            </span>
            <span className="font-bold block mt-0.5">3. Sealing</span>
            <span className="text-[11px]">{isLocked ? 'Profile Locked' : 'Draft / Unlocked'}</span>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            profile?.verificationStatus === 'VERIFIED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : profile?.verificationStatus === 'REJECTED'
              ? 'bg-red-50 border-red-200 text-error'
              : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant'
          }`}>
            <span className="material-symbols-outlined text-[18px]">
              {profile?.verificationStatus === 'VERIFIED'
                ? 'verified'
                : profile?.verificationStatus === 'REJECTED'
                ? 'cancel'
                : 'hourglass_empty'}
            </span>
            <span className="font-bold block mt-0.5">4. TPO Clearance</span>
            <span className="text-[11px]">
              {profile?.verificationStatus === 'VERIFIED'
                ? 'Officially Approved'
                : profile?.verificationStatus === 'REJECTED'
                ? 'Revision Requested'
                : 'Pending Audit'}
            </span>
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      {profile?.verificationStatus === 'VERIFIED' ? (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-[13px]">
          <span className="material-symbols-outlined text-emerald-700 text-[24px] shrink-0">
            verified
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-emerald-900 text-[14px]">
              Official LDCE Placement Clearance Approved
            </span>
            <span className="text-emerald-800 leading-relaxed">
              Your academic credentials, marksheets, and GTU standing have been officially verified by the Central Training &amp; Placement Office. You are cleared to apply to all recruitment drives matching your department and CGPA criteria.
            </span>
          </div>
        </div>
      ) : isLocked ? (
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[24px] shrink-0">
            shield_lock
          </span>
          <div className="flex flex-col text-[13px]">
            <span className="font-bold text-primary text-[14px]">
              Server-Side Profile Locking Enforced
            </span>
            <span className="text-on-surface-variant leading-relaxed">
              Your academic profile and credentials have been sealed and submitted for Central TPO clearance. Per institutional compliance regulations, profile fields cannot be modified directly by students. If you notice any clerical error, please visit the Training &amp; Placement Office with original marksheets.
            </span>
          </div>
        </div>
      ) : null}

      {/* Section Tabs */}
      <div className="flex items-center gap-1 border-b border-outline-variant/30 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 font-label-md text-[13px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'personal'
              ? 'bg-primary text-on-primary font-semibold shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Personal Info</span>
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-2 font-label-md text-[13px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'academic'
              ? 'bg-primary text-on-primary font-semibold shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">school</span>
          <span>Academic &amp; Marks</span>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 font-label-md text-[13px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'skills'
              ? 'bg-primary text-on-primary font-semibold shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">psychology</span>
          <span>Skills &amp; Languages</span>
        </button>
        <button
          onClick={() => setActiveTab('resume')}
          className={`px-4 py-2 font-label-md text-[13px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'resume'
              ? 'bg-primary text-on-primary font-semibold shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">description</span>
          <span>Resume Document</span>
        </button>
      </div>

      {/* Tab 1: Personal Information */}
      {activeTab === 'personal' && (
        <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h2 className="font-headline-sm text-primary font-bold text-[17px]">
              Section A: Candidate Identity &amp; Contact
            </h2>
            <span className="font-label-sm text-outline text-[12px]">Enrollment: {profile?.enrollmentNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">First Name *</label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70 disabled:cursor-not-allowed"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Middle Name</label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Last Name *</label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Phone Number</label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Date of Birth</label>
              <input
                type="date"
                disabled={isLocked}
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Gender</label>
              <select
                disabled={isLocked}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Residential / Permanent Address</label>
            <textarea
              disabled={isLocked}
              rows={2}
              placeholder="House/Flat No, Society, City, State, PIN"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>

          {!isLocked && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-[14px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {saving && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
                <span>{saving ? 'Saving...' : 'Save Personal Details'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 2: Academic Information & Formula Marks */}
      {activeTab === 'academic' && (
        <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-lg">
          {/* Current Degree Info */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-primary font-bold text-[17px]">
                Current Engineering Standing
              </h2>
              <span className="font-label-sm text-outline text-[12px]">B.Tech ({formData.department})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Current Semester *</label>
                <select
                  disabled={isLocked}
                  value={formData.currentSemester}
                  onChange={(e) => setFormData({ ...formData, currentSemester: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                >
                  <option value={7}>Semester 7 (Final Year)</option>
                  <option value={8}>Semester 8 (Final Year)</option>
                  <option value={6}>Semester 6</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Cumulative CGPA (out of 10) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  disabled={isLocked}
                  value={formData.currentCgpa}
                  onChange={(e) => setFormData({ ...formData, currentCgpa: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] font-bold text-primary disabled:opacity-70"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Active Backlogs *</label>
                <input
                  type="number"
                  min="0"
                  disabled={isLocked}
                  value={formData.activeBacklogs}
                  onChange={(e) => setFormData({ ...formData, activeBacklogs: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] font-semibold disabled:opacity-70"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Total Historic Backlogs</label>
                <input
                  type="number"
                  min="0"
                  disabled={isLocked}
                  value={formData.totalBacklogs}
                  onChange={(e) => setFormData({ ...formData, totalBacklogs: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                />
              </div>
            </div>
          </div>

          {/* 10th Standard Marks Computation */}
          <div className="flex flex-col gap-space-sm pt-space-sm border-t border-outline-variant/20">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">calculate</span>
                <h2 className="font-headline-sm text-primary font-bold text-[17px]">
                  10th Standard Marks &amp; Percentage Formula
                </h2>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-[13px]">
                <span>Calculated: {calculatedTenthPercentage}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Examination Board *</label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="e.g. CBSE / GSEB / ICSE"
                  value={formData.tenthBoard}
                  onChange={(e) => setFormData({ ...formData, tenthBoard: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">School / Institute Name *</label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={formData.tenthSchool}
                  onChange={(e) => setFormData({ ...formData, tenthSchool: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Total Marks Obtained *</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={isLocked}
                  value={formData.tenthMarksObtained}
                  onChange={(e) => setFormData({ ...formData, tenthMarksObtained: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Maximum Marks *</label>
                <input
                  type="number"
                  disabled={isLocked}
                  value={formData.tenthTotalMarks}
                  onChange={(e) => setFormData({ ...formData, tenthTotalMarks: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                  required
                />
              </div>
            </div>

            {/* Subject-Wise Granular Marks Breakdown */}
            <div className="mt-2 bg-surface-container-low/50 p-space-sm rounded-lg border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-primary font-semibold text-[13px]">
                  10th Subject-Wise Marks Breakdown
                </span>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={addSubjectRow}
                    className="text-secondary text-[12px] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add Subject</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {formData.tenthSubjects.map((sub, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled={isLocked}
                      placeholder="Subject Name"
                      value={sub.subject}
                      onChange={(e) => updateSubjectRow(idx, 'subject', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-[12px] disabled:opacity-70"
                    />
                    <input
                      type="number"
                      disabled={isLocked}
                      placeholder="Marks"
                      value={sub.marksObtained}
                      onChange={(e) => updateSubjectRow(idx, 'marksObtained', Number(e.target.value))}
                      className="w-24 px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-[12px] disabled:opacity-70"
                    />
                    <span className="text-[12px] text-outline">/</span>
                    <input
                      type="number"
                      disabled={isLocked}
                      placeholder="Max"
                      value={sub.maxMarks}
                      onChange={(e) => updateSubjectRow(idx, 'maxMarks', Number(e.target.value))}
                      className="w-24 px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-[12px] disabled:opacity-70"
                    />
                    {!isLocked && formData.tenthSubjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubjectRow(idx)}
                        className="text-error hover:bg-error-container/20 p-1 rounded"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regular Student: 12th Standard Details */}
          {!isD2D && (
            <div className="flex flex-col gap-space-sm pt-space-sm border-t border-outline-variant/20">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
                  <h2 className="font-headline-sm text-primary font-bold text-[17px]">
                    12th Standard (Higher Secondary) Details
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-[13px]">
                  <span>Calculated: {calculatedTwelfthPercentage}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Board *</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={formData.twelfthBoard}
                    onChange={(e) => setFormData({ ...formData, twelfthBoard: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">School Name *</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={formData.twelfthSchool}
                    onChange={(e) => setFormData({ ...formData, twelfthSchool: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Marks Obtained *</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isLocked}
                    value={formData.twelfthMarksObtained}
                    onChange={(e) => setFormData({ ...formData, twelfthMarksObtained: Number(e.target.value) })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Total Marks *</label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={formData.twelfthTotalMarks}
                    onChange={(e) => setFormData({ ...formData, twelfthTotalMarks: Number(e.target.value) })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* D2D Student: Diploma Details */}
          {isD2D && (
            <div className="flex flex-col gap-space-sm pt-space-sm border-t border-outline-variant/20">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">alt_route</span>
                  <h2 className="font-headline-sm text-primary font-bold text-[17px]">
                    Diploma to Degree (D2D) Lateral Entry Details
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-[12px]">
                  Lateral Entry Track
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Diploma College / Polytechnic *</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={formData.diplomaCollege}
                    onChange={(e) => setFormData({ ...formData, diplomaCollege: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Awarding University / Board *</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={formData.diplomaUniversity}
                    onChange={(e) => setFormData({ ...formData, diplomaUniversity: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Diploma Branch *</label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={formData.diplomaBranch}
                    onChange={(e) => setFormData({ ...formData, diplomaBranch: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Passing Year *</label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={formData.diplomaYear}
                    onChange={(e) => setFormData({ ...formData, diplomaYear: Number(e.target.value) })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Final Diploma CGPA (out of 10) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    disabled={isLocked}
                    value={formData.diplomaCgpa}
                    onChange={(e) => setFormData({ ...formData, diplomaCgpa: Number(e.target.value) })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] font-bold text-primary disabled:opacity-70"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">Diploma Percentage (if calculated)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isLocked}
                    value={formData.diplomaPercentage}
                    onChange={(e) => setFormData({ ...formData, diplomaPercentage: Number(e.target.value) })}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
                  />
                </div>
              </div>
            </div>
          )}

          {!isLocked && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-[14px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {saving && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
                <span>{saving ? 'Updating...' : 'Save Academic Details'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 3: Skills & Languages */}
      {activeTab === 'skills' && (
        <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h2 className="font-headline-sm text-primary font-bold text-[17px]">
              Section C: Technical &amp; Professional Competencies
            </h2>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">
              Technical Skills &amp; Frameworks (Comma separated)
            </label>
            <input
              type="text"
              disabled={isLocked}
              placeholder="e.g. React, Next.js, Node.js, TypeScript, PostgreSQL, Python"
              value={formData.technicalSkills}
              onChange={(e) => setFormData({ ...formData, technicalSkills: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">
              Tools, Databases &amp; Cloud (Comma separated)
            </label>
            <input
              type="text"
              disabled={isLocked}
              placeholder="e.g. Git, Docker, Postman, AWS, MongoDB"
              value={formData.tools}
              onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">
              Soft Skills &amp; Leadership (Comma separated)
            </label>
            <input
              type="text"
              disabled={isLocked}
              placeholder="e.g. Technical Communication, Agile Problem Solving, Team Coordination"
              value={formData.softSkills}
              onChange={(e) => setFormData({ ...formData, softSkills: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant text-[12px] font-medium">
              Languages Known (Comma separated)
            </label>
            <input
              type="text"
              disabled={isLocked}
              placeholder="e.g. English, Hindi, Gujarati"
              value={formData.languages}
              onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[13px] disabled:opacity-70"
            />
          </div>

          {!isLocked && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-[14px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {saving && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
                <span>{saving ? 'Updating...' : 'Save Skills Profile'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 4: Resume Document Management */}
      {activeTab === 'resume' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h2 className="font-headline-sm text-primary font-bold text-[17px]">
              Placement Resume Document (PDF)
            </h2>
            <span className="font-label-sm text-outline text-[12px]">Max size: 10MB</span>
          </div>

          {/* Current Resume View */}
          {profile?.resumeUrl ? (
            <div className="p-4 rounded-xl bg-surface-container-low border border-secondary-fixed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-primary text-[14px] truncate">
                    {profile.resumeName || 'Student_Placement_Resume.pdf'}
                  </span>
                  <span className="text-on-surface-variant text-[12px]">
                    Uploaded:{' '}
                    {profile.resumeUpdatedAt
                      ? new Date(profile.resumeUpdatedAt).toLocaleString()
                      : 'Active'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${profile.resumeUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary font-semibold text-[13px] border border-outline-variant/40 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View PDF</span>
                </a>
                <button
                  type="button"
                  onClick={handleDeleteResume}
                  className="px-3 py-1.5 rounded-lg text-error hover:bg-error-container/20 text-[13px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-surface-container-low/50 border border-dashed border-outline-variant text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-outline text-[32px]">upload_file</span>
              <span className="font-semibold text-primary text-[14px]">No Resume Document Uploaded Yet</span>
              <span className="text-on-surface-variant text-[12px] max-w-sm">
                Recruiters require an active PDF resume to review your application. Upload your professional CV below.
              </span>
            </div>
          )}

          {/* Upload / Replace Form */}
          <form onSubmit={handleUploadResume} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="w-full sm:flex-1 text-[13px] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[13px] file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-container cursor-pointer"
            />
            <button
              type="submit"
              disabled={!resumeFile || uploadingResume}
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {uploadingResume && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
              <span>{uploadingResume ? 'Uploading...' : profile?.resumeUrl ? 'Replace Resume' : 'Upload Resume'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Lock Profile Confirmation Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg shadow-xl border border-outline-variant/30 flex flex-col gap-space-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-error-container/30 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">lock</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-primary font-bold text-[18px]">
                  Confirm Final Profile Submission &amp; Lock
                </h3>
                <span className="text-[12px] text-on-surface-variant">
                  Irreversible Student Compliance Action
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-container-low text-[13px] text-on-surface-variant flex flex-col gap-2 leading-relaxed">
              <p>
                <strong>Important Notice:</strong> Once submitted, your profile state will transition to{' '}
                <strong className="text-primary font-bold">LOCKED</strong>.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>You will <strong>not</strong> be able to modify academic or personal fields through the portal.</li>
                <li>Only the Central TPO office can unlock or modify your verified dossier.</li>
                <li>Your verified CGPA and marks will be used directly for all automated drive eligibility checks.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowLockModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[13px] font-semibold transition-colors cursor-pointer"
              >
                Cancel &amp; Continue Editing
              </button>
              <button
                type="button"
                onClick={handleLockProfile}
                disabled={locking}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-[13px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {locking && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                <span>{locking ? 'Locking Dossier...' : 'Yes, Lock & Submit Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
