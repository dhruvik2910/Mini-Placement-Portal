'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/auth-context';
import { api } from '../../lib/api';
import type { NotificationDto } from '@placement/shared';

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get<NotificationDto[]>('/student/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/student/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const n of unread) {
      api.patch(`/student/notifications/${n.id}/read`).catch(() => {});
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filtered = filter === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-full flex flex-col gap-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
            <Link href="/" className="hover:text-primary transition-colors">
              LDCE Placement Portal
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Communications</span>
          </div>
          <h1 className="font-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            Notifications &amp; Alerts
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Official updates regarding LDCE placement drives, interview shortlisting, and compliance verifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#13357b] border border-blue-200 text-[12px] font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-[#13357b] text-white shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
            filter === 'UNREAD'
              ? 'bg-[#13357b] text-white shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-[13px] text-on-surface-variant">Loading notifications...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-space-xl bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-center space-y-2">
          <span className="material-symbols-outlined text-[36px] text-outline">notifications_off</span>
          <h3 className="font-bold text-on-surface text-[15px]">No Notifications</h3>
          <p className="text-[13px] text-on-surface-variant">
            {filter === 'UNREAD' ? 'You have read all notifications.' : 'No alerts have been posted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-space-md rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                item.isRead
                  ? 'bg-surface-container-lowest border-outline-variant/20 opacity-80'
                  : 'bg-surface-container-lowest border-blue-200 shadow-sm ring-1 ring-blue-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.isRead
                      ? 'bg-surface-container text-outline'
                      : 'bg-blue-50 text-[#13357b] font-bold'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.type === 'APPLICATION_STATUS'
                      ? 'campaign'
                      : item.type === 'DRIVE_ALERT'
                      ? 'business_center'
                      : 'info'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-on-surface text-[14px]">{item.title}</span>
                    {!item.isRead && (
                      <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-[#13357b] text-[10px] font-extrabold uppercase">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-on-surface-variant leading-relaxed">
                    {item.message}
                  </p>
                  <span className="text-[11px] text-outline block">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              {!item.isRead && (
                <button
                  onClick={() => markAsRead(item.id)}
                  className="self-end sm:self-center px-2.5 py-1 rounded-lg text-outline hover:text-[#13357b] hover:bg-surface-container text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
