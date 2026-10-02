'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import type { TpoActivityItem, NotificationDeliveryLogDto } from '@placement/shared';

export default function TpoNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'DELIVERY'>('AUDIT');
  const [activities, setActivities] = useState<TpoActivityItem[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<NotificationDeliveryLogDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<TpoActivityItem[]>('/tpo/notifications');
      setActivities(data);
    } catch (err) {
      console.error('Failed to load TPO notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeliveryLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ logs: NotificationDeliveryLogDto[]; total: number }>(
        '/tpo/notifications/delivery-logs'
      );
      setDeliveryLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load delivery logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'AUDIT') {
      fetchActivities();
    } else {
      fetchDeliveryLogs();
    }
  }, [activeTab, fetchActivities, fetchDeliveryLogs]);

  return (
    <div className="w-full flex flex-col gap-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant/20">
        <div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
            <Link href="/tpo" className="hover:text-primary transition-colors">
              LDCE Training &amp; Placement Cell
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Communications &amp; Audit</span>
          </div>
          <h1 className="font-headline-lg text-[#13357b] font-extrabold tracking-tight mt-1">
            TPO Activity &amp; Notifications Log
          </h1>
          <p className="font-body-md text-on-surface-variant text-[13px] mt-0.5">
            Real-time audit stream of student applications, recruitment drive postings, and automated email/SMS dispatch logs.
          </p>
        </div>
        <button
          onClick={activeTab === 'AUDIT' ? fetchActivities : fetchDeliveryLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#13357b] border border-blue-200 text-[12px] font-bold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Refresh {activeTab === 'AUDIT' ? 'Feed' : 'Logs'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-1">
        <button
          id="tpo-tab-audit-feed"
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl font-label-md text-[13px] font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'AUDIT'
              ? 'bg-[#13357b] text-white shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">timeline</span>
          <span>Placement Activity Feed</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/20">
            {activities.length}
          </span>
        </button>
        <button
          id="tpo-tab-delivery-logs"
          onClick={() => setActiveTab('DELIVERY')}
          className={`px-4 py-2 rounded-xl font-label-md text-[13px] font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'DELIVERY'
              ? 'bg-[#13357b] text-white shadow-xs'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">outgoing_mail</span>
          <span>Email, SMS &amp; WhatsApp Outbox</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/20">
            {deliveryLogs.length}
          </span>
        </button>
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-[13px] text-on-surface-variant">
            Loading {activeTab === 'AUDIT' ? 'audit feed' : 'delivery logs'}...
          </span>
        </div>
      ) : activeTab === 'AUDIT' ? (
        activities.length === 0 ? (
          <div className="p-space-xl bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-center space-y-2">
            <span className="material-symbols-outlined text-[36px] text-outline">notifications_none</span>
            <h3 className="font-bold text-on-surface text-[15px]">No Recent Events</h3>
            <p className="text-[13px] text-on-surface-variant">
              No system actions or applications recorded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => (
              <div
                key={item.id}
                className="p-space-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex items-start gap-3.5 hover:border-blue-200 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.type === 'APPLICATION'
                      ? 'bg-blue-50 text-[#13357b]'
                      : item.type === 'DRIVE'
                      ? 'bg-purple-50 text-purple-700'
                      : item.type === 'COMPANY'
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.type === 'APPLICATION'
                      ? 'assignment'
                      : item.type === 'DRIVE'
                      ? 'business_center'
                      : item.type === 'COMPANY'
                      ? 'apartment'
                      : 'verified'}
                  </span>
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-on-surface text-[14px]">{item.title}</span>
                    <span className="text-[11px] text-outline">
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Delivery Logs Tab */
        deliveryLogs.length === 0 ? (
          <div className="p-space-xl bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-center space-y-2">
            <span className="material-symbols-outlined text-[36px] text-outline">mark_email_read</span>
            <h3 className="font-bold text-on-surface text-[15px]">No Outbox Dispatches Recorded</h3>
            <p className="text-[13px] text-on-surface-variant">
              When student profiles are verified or application statuses change, automated notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-outline font-bold">
                    <th className="py-3 px-4 whitespace-nowrap">Recipient</th>
                    <th className="py-3 px-4 whitespace-nowrap">Subject / Event</th>
                    <th className="py-3 px-4 whitespace-nowrap">Template</th>
                    <th className="py-3 px-4 whitespace-nowrap">Channel</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Dispatched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {deliveryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface text-[13px]">
                            {log.recipientEmail || 'N/A'}
                          </span>
                          {log.recipientPhone && (
                            <span className="text-[11px] text-outline font-mono">
                              {log.recipientPhone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col max-w-md">
                          <span className="font-semibold text-on-surface text-[13px] truncate">
                            {log.subject}
                          </span>
                          <span className="text-[12px] text-on-surface-variant truncate">
                            {log.body.slice(0, 100)}...
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-surface-container text-on-surface-variant border border-outline-variant/30">
                          {log.template}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-on-surface-variant">
                          <span className={`material-symbols-outlined text-[16px] ${log.channel === 'WHATSAPP' ? 'text-emerald-600' : ''}`}>
                            {log.channel === 'WHATSAPP' ? 'chat' : log.channel === 'SMS' ? 'smartphone' : 'mail'}
                          </span>
                          <span className={log.channel === 'WHATSAPP' ? 'text-emerald-700 font-extrabold' : ''}>
                            {log.channel}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                            log.status === 'SENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {log.status === 'SENT'
                              ? 'check_circle'
                              : log.status === 'FAILED'
                              ? 'error'
                              : 'schedule'}
                          </span>
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[12px] text-outline">
                        {new Date(log.sentAt || log.createdAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

