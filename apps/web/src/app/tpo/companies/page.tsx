'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, ApiError } from '../../../lib/api';
import type { CompanyDto } from '@placement/shared';

type CompanyWithCounts = CompanyDto & { drivesCount: number; activeDrivesCount: number };

export default function TpoCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithCounts | null>(null);
  const [viewingCompany, setViewingCompany] = useState<(CompanyDto & { recruitmentDrives: any[] }) | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    description: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
  });

  const openViewModal = async (companyId: string) => {
    try {
      setLoadingDetails(true);
      const data = await api.get<CompanyDto & { recruitmentDrives: any[] }>(`/tpo/companies/${companyId}`);
      setViewingCompany(data);
    } catch (err: any) {
      alert(err?.message || 'Failed to load company details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = search.trim()
        ? `/tpo/companies?search=${encodeURIComponent(search.trim())}`
        : '/tpo/companies';
      const data = await api.get<CompanyWithCounts[]>(url);
      setCompanies(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load recruiting companies');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  const openAddModal = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      website: '',
      industry: 'Information Technology',
      description: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (comp: CompanyWithCounts) => {
    setEditingCompany(comp);
    setFormData({
      name: comp.name,
      website: comp.website || '',
      industry: comp.industry || '',
      description: comp.description || '',
      contactPerson: comp.contactPerson || '',
      contactEmail: comp.contactEmail || '',
      contactPhone: comp.contactPhone || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Company name is required');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingCompany) {
        await api.put(`/tpo/companies/${editingCompany.id}`, formData);
      } else {
        await api.post('/tpo/companies', formData);
      }

      setShowModal(false);
      await fetchCompanies();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError(err?.message || 'Failed to save company record');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

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
            <span className="text-primary font-bold">Recruiting Partners</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            LDCE Partner Companies &amp; Recruiters
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Manage corporate recruiters visiting L.D. College of Engineering, maintain HR contact points, and track placement drives.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-[13px] hover:bg-primary-container transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Register Recruiter</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl border border-outline-variant/30 shadow-sm flex items-center justify-between gap-space-md">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company name, industry, or contact person..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none text-[13px] text-on-surface"
          />
        </div>
        <span className="font-label-sm text-outline text-[12px]">
          {companies.length} Companies Enrolled
        </span>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-3 font-label-md text-on-surface-variant text-[13px]">Loading company partners...</p>
        </div>
      ) : error ? (
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-error/20 text-center space-y-2">
          <span className="material-symbols-outlined text-[32px] text-error">error</span>
          <p className="font-body-md text-on-surface font-semibold">{error}</p>
          <button
            onClick={fetchCompanies}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
          >
            Retry
          </button>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-space-xl border border-outline-variant/30 text-center space-y-2">
          <span className="material-symbols-outlined text-outline text-[36px]">domain_disabled</span>
          <h3 className="font-headline-sm text-on-surface font-bold text-[16px]">No Companies Found</h3>
          <p className="font-body-md text-on-surface-variant text-[13px] max-w-sm mx-auto">
            {search ? `No partners matched "${search}".` : 'Get started by adding your first institutional partner.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-surface-container-lowest rounded-2xl p-space-md border border-outline-variant/30 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between gap-space-sm"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-[18px] shrink-0 shadow-xs">
                      {company.name[0]}
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-primary font-bold text-[16px] leading-tight">
                        {company.name}
                      </h2>
                      {company.industry && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-[11px] font-semibold mt-1">
                          {company.industry}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(company)}
                    className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container-low transition-colors"
                    title="Edit Company"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                </div>

                {/* Description */}
                <p className="font-body-sm text-on-surface-variant text-[12px] line-clamp-2 mt-2 leading-relaxed">
                  {company.description || 'Institutional recruiting partner.'}
                </p>
              </div>

              {/* Contact info & metrics */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/15 text-[12px]">
                {company.contactPerson && (
                  <div className="flex items-center gap-1.5 text-on-surface">
                    <span className="material-symbols-outlined text-[15px] text-outline">badge</span>
                    <span>{company.contactPerson}</span>
                  </div>
                )}
                {company.contactEmail && (
                  <div className="flex items-center gap-1.5 text-on-surface-variant truncate">
                    <span className="material-symbols-outlined text-[15px] text-outline">mail</span>
                    <span className="truncate">{company.contactEmail}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-[15px]">public</span>
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline truncate"
                    >
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              {/* Footer stats & link */}
              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => openViewModal(company.id)}
                  className="font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">info</span>
                  <span><strong>{company.activeDrivesCount} Active</strong> / {company.drivesCount} Drives</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openViewModal(company.id)}
                    className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[11px] border border-outline-variant/30 transition-colors flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Company Dossier & Placement Drives Modal */}
      {viewingCompany && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-space-lg shadow-2xl border border-outline-variant/30 space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-[18px]">
                  {viewingCompany.name[0]}
                </div>
                <div>
                  <h3 className="font-headline-sm text-primary font-bold text-[18px] leading-tight">
                    {viewingCompany.name}
                  </h3>
                  {viewingCompany.industry && (
                    <span className="text-[12px] text-on-surface-variant font-medium">
                      {viewingCompany.industry}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingCompany(null)}
                className="p-1 rounded-lg text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Overview & Contact */}
            <div className="p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 space-y-2 text-[12px]">
              <p className="text-on-surface text-[13px] leading-relaxed">
                {viewingCompany.description || 'Institutional recruiting partner.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20 text-on-surface-variant">
                {viewingCompany.contactPerson && (
                  <div>
                    <span className="text-outline text-[10px] uppercase font-bold block">Contact Person</span>
                    <span className="font-semibold text-on-surface">{viewingCompany.contactPerson}</span>
                  </div>
                )}
                {viewingCompany.contactEmail && (
                  <div>
                    <span className="text-outline text-[10px] uppercase font-bold block">Email</span>
                    <span className="font-semibold text-on-surface truncate">{viewingCompany.contactEmail}</span>
                  </div>
                )}
                {viewingCompany.website && (
                  <div>
                    <span className="text-outline text-[10px] uppercase font-bold block">Website</span>
                    <a
                      href={viewingCompany.website.startsWith('http') ? viewingCompany.website : `https://${viewingCompany.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-semibold hover:underline truncate block"
                    >
                      {viewingCompany.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Associated Drives */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-sm text-on-surface font-bold text-[15px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">business_center</span>
                  <span>Recruitment Drives at LDCE ({viewingCompany.recruitmentDrives?.length || 0})</span>
                </h4>
                <Link
                  href={`/tpo/drives/create`}
                  className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Post Drive for {viewingCompany.name}</span>
                </Link>
              </div>

              {!viewingCompany.recruitmentDrives || viewingCompany.recruitmentDrives.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-container-low text-center text-on-surface-variant text-[12px]">
                  No recruitment drives have been created for this company yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {viewingCompany.recruitmentDrives.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex items-center justify-between gap-3 text-[12px]"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary text-[14px]">{d.jobRole}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {d.status}
                          </span>
                        </div>
                        <span className="text-on-surface-variant block">
                          {d.packageLpa ? `₹${d.packageLpa} LPA` : 'Remuneration TBA'} • {d.location || 'Multiple Locations'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tpo/drives/${d.id}/applicants`}
                          className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-[11px] hover:bg-primary-container transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">groups</span>
                          <span>{d.applicantCount ?? 0} Applicants</span>
                        </Link>
                        <Link
                          href={`/tpo/drives/${d.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-[11px] border border-outline-variant/30 transition-colors"
                        >
                          Dossier
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-outline-variant/20">
              <button
                onClick={() => setViewingCompany(null)}
                className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold hover:bg-surface-container text-[13px] cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Company Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg shadow-2xl border border-outline-variant/30 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="font-headline-sm text-primary font-bold text-[17px]">
                {editingCompany ? 'Edit Recruiting Partner' : 'Enroll New Recruiting Partner'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container text-[12px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-[13px]">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Google India, Tata Consultancy Services"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Industry Domain</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g. Enterprise Software, FinTech"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Website URL</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Company Overview</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of company domain and recruitment targets..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:border-primary text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-on-surface text-[12px] mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Campus Recruiter"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[12px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface text-[12px] mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="recruitment@..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[12px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface text-[12px] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-[12px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant font-semibold hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-container transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingCompany ? 'Update Company' : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
