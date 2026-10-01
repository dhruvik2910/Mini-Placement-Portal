'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/auth-context';

export function TpoNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', href: '/tpo', icon: 'dashboard' },
    { label: 'Students', href: '/tpo/students', icon: 'group' },
    { label: 'Companies', href: '/tpo/companies', icon: 'apartment' },
    { label: 'Recruitment Drives', href: '/tpo/drives', icon: 'business_center' },
    { label: 'Applications', href: '/tpo/applications', icon: 'assignment_turned_in' },
    { label: 'Analytics', href: '/tpo/analytics', icon: 'insights' },
    { label: 'Notifications', href: '/tpo/notifications', icon: 'notifications' },
    { label: 'Settings', href: '/tpo/settings', icon: 'settings' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30">
      <div className="max-w-7xl mx-auto h-16 px-space-md lg:px-space-xl flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand */}
        <div className="flex items-center shrink-0">
          <Link href="/tpo" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#13357b] flex items-center justify-center text-white font-extrabold text-[15px] shadow-sm tracking-tighter group-hover:bg-primary transition-colors shrink-0">
              <span>LDCE</span>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-headline-sm text-headline-sm text-[#13357b] font-extrabold tracking-tight whitespace-nowrap">
                  LDCE Placement Cell
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-label-sm uppercase tracking-wider text-[10px] font-bold shrink-0">
                  TPO
                </span>
              </div>
              <span className="font-label-sm text-on-surface-variant text-[11px] leading-tight whitespace-nowrap mt-0.5 hidden lg:block">
                L.D. College of Engineering, Ahmedabad
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 shrink-0">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/tpo'
                ? pathname === '/tpo'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-label-md text-[13px] whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">{link.icon}</span>
                <span className="whitespace-nowrap">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Officer Profile & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-outline-variant/30 shrink-0">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-[13px] shrink-0">
                {user.tpoProfile?.fullName?.[0] || 'T'}
              </div>
              <div className="flex flex-col text-left justify-center min-w-0 max-w-[130px] xl:max-w-[170px]">
                <span 
                  className="font-semibold text-on-surface text-[12px] leading-tight truncate block"
                  title={user.tpoProfile?.fullName || 'Placement Officer'}
                >
                  {user.tpoProfile?.fullName || 'Placement Officer'}
                </span>
                <span 
                  className="text-on-surface-variant text-[10px] leading-tight truncate block mt-0.5"
                  title={user.tpoProfile?.designation || 'Head TPO'}
                >
                  {user.tpoProfile?.designation || 'Head TPO'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer shrink-0"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          )}

          {/* Mobile/Tablet hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low cursor-pointer shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet navigation drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-outline-variant/20 bg-surface-container-lowest px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/tpo'
                ? pathname === '/tpo'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
          {user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center gap-2 px-3 py-2 mt-2 rounded-lg text-error hover:bg-error-container/20 text-[14px] text-left"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Logout ({user.email})</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
