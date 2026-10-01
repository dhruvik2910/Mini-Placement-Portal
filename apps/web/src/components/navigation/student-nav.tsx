'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { api } from '../../lib/api';
import type { NotificationDto } from '@placement/shared';

export function StudentNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.get<NotificationDto[]>('/student/notifications')
        .then(setNotifications)
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    for (const n of notifications.filter((x) => !x.isRead)) {
      api.patch(`/student/notifications/${n.id}/read`).catch(() => {});
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const navLinks = [
    { label: 'Dashboard', href: '/', icon: 'dashboard' },
    { label: 'My Profile', href: '/profile', icon: 'account_circle' },
    { label: 'Placement Drives', href: '/drives', icon: 'business_center' },
    { label: 'My Applications', href: '/applications', icon: 'assignment_turned_in' },
    { label: 'Notifications', href: '/notifications', icon: 'notifications' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30">
      <div className="max-w-7xl mx-auto h-16 px-space-md lg:px-space-xl flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#13357b] flex items-center justify-center text-white font-extrabold text-[15px] shadow-sm tracking-tighter group-hover:bg-primary transition-colors shrink-0">
              <span>LDCE</span>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-headline-sm text-headline-sm text-[#13357b] font-extrabold tracking-tight whitespace-nowrap">
                  LDCE Placement Portal
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-50 text-[#13357b] border border-blue-200 font-label-sm uppercase tracking-wider text-[10px] font-bold shrink-0">
                  GTU: 028
                </span>
              </div>
              <span className="font-label-sm text-on-surface-variant text-[11px] leading-tight whitespace-nowrap mt-0.5 hidden lg:block">
                L.D. College of Engineering, Ahmedabad
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 shrink-0">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-[13px] whitespace-nowrap shrink-0 transition-all ${
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

        {/* User profile, notifications & logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowNotifs(!showNotifs);
                if (!showNotifs && unreadCount > 0) markAllRead();
              }}
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer shrink-0"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-lowest"></span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 py-2 z-50">
                <div className="px-4 py-2 border-b border-outline-variant/20 flex items-center justify-between">
                  <span className="font-headline-sm text-primary text-[14px] font-bold">Notifications</span>
                  <span className="font-label-sm text-outline text-[12px]">{notifications.length} total</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-on-surface-variant text-[13px]">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-surface-container-low/50 transition-colors flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-label-md text-primary font-semibold text-[13px]">{n.title}</span>
                          <span className="font-label-sm text-outline text-[10px]">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-body-sm text-on-surface-variant text-[12px] leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User info & quick logout */}
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-outline-variant/30 shrink-0">
              <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-[13px] shrink-0">
                {user.studentProfile?.firstName?.[0] || user.email[0].toUpperCase()}
              </div>
              <div className="flex flex-col text-left justify-center min-w-0 max-w-[130px] xl:max-w-[160px]">
                <span 
                  className="font-semibold text-on-surface text-[12px] leading-tight truncate block"
                  title={user.studentProfile ? `${user.studentProfile.firstName} ${user.studentProfile.lastName}` : user.email}
                >
                  {user.studentProfile ? `${user.studentProfile.firstName} ${user.studentProfile.lastName}` : user.email}
                </span>
                <span 
                  className="text-on-surface-variant text-[10px] leading-tight truncate block mt-0.5"
                  title={user.studentProfile?.enrollmentNumber || user.role}
                >
                  {user.studentProfile?.enrollmentNumber || user.role}
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

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface-container-lowest px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] ${
                pathname === link.href
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
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
