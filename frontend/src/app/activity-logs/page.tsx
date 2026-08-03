'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery } from '@tanstack/react-query';
import { activityLogService } from '@/services/activity-log.service';
import { complexService } from '@/services/complex.service';
import { useAuth } from '@/features/auth/auth-context';
import { History, Loader2, ShieldAlert, ChevronDown, ChevronRight, User, Terminal } from 'lucide-react';

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.slug === 'super_admin';

  const [selectedComplexId, setSelectedComplexId] = useState<string>(user?.complexId || '');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: complexes = [] } = useQuery({
    queryKey: ['complexes'],
    queryFn: () => complexService.getAll(),
    enabled: isSuperAdmin,
  });

  const activeComplexId = isSuperAdmin ? selectedComplexId || undefined : (user?.complexId ?? undefined);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['activityLogs', activeComplexId],
    queryFn: () => activityLogService.getLogs({ complexId: activeComplexId }),
  });

  const logs = logsData?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Activity Audit Trail</h1>
            <p className="text-xs text-slate-400 mt-1">
              Immutable system audit logs tracking all data creation, modification, and security events
            </p>
          </div>

          {/* Super Admin Complex Selector */}
          {isSuperAdmin && complexes.length > 0 && (
            <div className="w-64">
              <select
                value={selectedComplexId}
                onChange={(e) => setSelectedComplexId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="">All Complexes (Global Audit)</option>
                {complexes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Fetching audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium">No activity log records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-8"></th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Entity Type</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const actionColor =
                      log.action === 'create'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : log.action === 'delete'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${actionColor}`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-200 capitalize">
                            {log.entity_type}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{log.description || 'N/A'}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>

                        {/* Expanded Row for JSON Diffs */}
                        {isExpanded && (
                          <tr className="bg-slate-950/90 border-b border-slate-800">
                            <td colSpan={6} className="p-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {log.old_values && (
                                  <div>
                                    <span className="block text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">
                                      Old State
                                    </span>
                                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                                      {JSON.stringify(log.old_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_values && (
                                  <div>
                                    <span className="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                                      New State
                                    </span>
                                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                                      {JSON.stringify(log.new_values, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
