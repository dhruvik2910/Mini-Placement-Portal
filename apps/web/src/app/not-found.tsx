import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/30 flex flex-col items-center gap-4">
        {/* LDCE Brand Crest */}
        <div className="w-16 h-16 rounded-2xl bg-[#13357b] flex items-center justify-center text-white font-extrabold text-[22px] shadow-sm tracking-tighter">
          <span>LDCE</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#13357b] text-[11px] font-bold uppercase tracking-wider">
          <span>Error 404 • LDCE Placement Portal</span>
        </div>

        <h1 className="font-headline-lg text-[#13357b] font-extrabold text-[26px] tracking-tight">
          Page Not Located
        </h1>

        <p className="font-body-md text-on-surface-variant text-[13px] leading-relaxed">
          The requested placement dossier, recruitment drive, or institutional resource does not exist or may have been retired from the portal directory.
        </p>

        <div className="pt-2 w-full flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-[13px] hover:bg-primary-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/drives"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-[13px] border border-outline-variant/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">business_center</span>
            <span>Browse Drives</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 text-[11px] text-outline">
          L.D. College of Engineering, Ahmedabad • GTU College Code: 028 • Estd. 1948
        </div>
      </div>
    </div>
  );
}
