'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled placement portal client error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/30 flex flex-col items-center gap-4">
        {/* LDCE Brand Crest */}
        <div className="w-16 h-16 rounded-2xl bg-[#13357b] flex items-center justify-center text-white font-extrabold text-[22px] shadow-sm tracking-tighter">
          <span>LDCE</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-error text-[11px] font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          <span>Temporary Portal Exception</span>
        </div>

        <h1 className="font-headline-lg text-[#13357b] font-extrabold text-[24px] tracking-tight">
          System Notice
        </h1>

        <p className="font-body-md text-on-surface-variant text-[13px] leading-relaxed">
          An unexpected interface exception occurred while rendering this view. Your session and academic data remain safe.
        </p>

        {error.message && (
          <div className="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 text-left font-mono text-[11px] text-on-surface-variant overflow-x-auto">
            {error.message}
          </div>
        )}

        <div className="pt-2 w-full flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-[13px] hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Reload View</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-[13px] border border-outline-variant/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Portal Home</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 text-[11px] text-outline">
          L.D. College of Engineering, Ahmedabad • Training &amp; Placement Cell
        </div>
      </div>
    </div>
  );
}
