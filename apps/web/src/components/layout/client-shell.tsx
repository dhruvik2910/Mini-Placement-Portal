'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StudentNav } from '../navigation/student-nav';
import { TpoNav } from '../navigation/tpo-nav';
import { useAuth } from '../../context/auth-context';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isTpoRoute = pathname.startsWith('/tpo');

  // Role-Based Client Route Protection
  useEffect(() => {
    if (isLoading) return;

    // If user is TPO visiting root, redirect to /tpo dashboard
    if (user?.role === 'TPO' && pathname === '/') {
      router.replace('/tpo');
      return;
    }

    // If student attempts to access /tpo
    if (isTpoRoute && user && user.role !== 'TPO') {
      router.replace('/');
      return;
    }

    // If unauthenticated accessing protected route
    if (!isAuthPage && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, pathname, isTpoRoute, isAuthPage, router]);

  if (isAuthPage) {
    return <main className="flex-1 min-h-screen flex flex-col justify-center">{children}</main>;
  }

  // TPO vs Student Shell
  return (
    <>
      {isTpoRoute ? <TpoNav /> : <StudentNav />}
      <main className="flex-1 w-full max-w-7xl mx-auto px-space-md lg:px-space-xl py-space-lg">
        {children}
      </main>
      <footer className="mt-auto border-t border-outline-variant/30 bg-surface-container-lowest py-space-md px-space-md lg:px-space-xl text-center text-[12px] text-on-surface-variant">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">L.D. College of Engineering, Ahmedabad</span>
            <span>•</span>
            <span>Training &amp; Placement Cell</span>
          </div>
          <span>Opp. Gujarat University, Navrangpura, Ahmedabad - 380015, Gujarat • GTU College Code: 028 • Estd. 1948</span>
        </div>
      </footer>
    </>
  );
}

