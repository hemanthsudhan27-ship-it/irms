'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import {
  Building2,
  Layers,
  Home,
  Users,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ComplexAdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['complexAdminDashboard'],
    queryFn: () => dashboardService.getComplexAdminStats(),
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Assigned Complex Portal
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            {isLoading ? 'Loading Complex...' : stats?.complexName || 'Complex Dashboard'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time occupancy metrics, floor layouts, and resident management for your assigned complex
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Floors */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Floors
                </span>
                <span className="block text-2xl font-bold text-slate-100 mt-2">
                  {isLoading ? '...' : stats?.totalFloors || 0}
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 2: Units */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Units
                </span>
                <span className="block text-2xl font-bold text-slate-100 mt-2">
                  {isLoading ? '...' : stats?.totalUnits || 0}
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Home className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 3: Residents */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Residents
                </span>
                <span className="block text-2xl font-bold text-slate-100 mt-2">
                  {isLoading ? '...' : stats?.totalResidents || 0}
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 4: Occupancy Rate */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Occupancy Rate
                </span>
                <span className="block text-2xl font-bold text-slate-100 mt-2">
                  {isLoading ? '...' : `${stats?.occupancyRate || 0}%`}
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats?.occupancyRate || 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-base font-semibold text-slate-100 mb-4">Complex Occupancy Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <div>
                <span className="block text-xs text-slate-400">Occupied Units</span>
                <span className="block text-xl font-bold text-slate-100 mt-0.5">
                  {isLoading ? '...' : stats?.occupiedUnits || 0}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 flex items-center gap-3">
              <Home className="w-8 h-8 text-cyan-400" />
              <div>
                <span className="block text-xs text-slate-400">Vacant Units</span>
                <span className="block text-xl font-bold text-slate-100 mt-0.5">
                  {isLoading ? '...' : stats?.vacantUnits || 0}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <div>
                <span className="block text-xs text-slate-400">Under Maintenance</span>
                <span className="block text-xl font-bold text-slate-100 mt-0.5">
                  {isLoading ? '...' : stats?.maintenanceUnits || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap gap-3">
            <Link
              href="/floors-units"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
            >
              Manage Floors & Units <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/residents"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Manage Residents <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
