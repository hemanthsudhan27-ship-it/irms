'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import {
  Building,
  Building2,
  Users,
  Home,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['superAdminDashboard'],
    queryFn: () => dashboardService.getSuperAdminStats(),
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Super Admin Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Global SaaS metrics and residency portfolio summary across all companies
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Companies */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Companies
                </span>
                <span className="block text-2xl font-bold text-slate-100 mt-2">
                  {isLoading ? '...' : stats?.totalCompanies || 0}
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-xs text-indigo-400">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Multi-tenant SaaS portfolio
            </div>
          </div>

          {/* Card 2: Complexes */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Complexes
                </span>
                <span className="block text-2xl font-bold text-slate-100 mt-2">
                  {isLoading ? '...' : stats?.totalComplexes || 0}
                </span>
              </div>
              <div className="w-11 h-11 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-xs text-cyan-400">
              {stats?.totalFloors || 0} total floors registered
            </div>
          </div>

          {/* Card 3: Total Residents */}
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
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-xs text-emerald-400">
              <UserCheck className="w-3.5 h-3.5 mr-1" /> Active lease agreements
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
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats?.occupancyRate || 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unit Status Breakdown */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-base font-semibold text-slate-100 mb-4">Apartment Unit Portfolio Distribution</h2>
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

            {/* Quick Actions Shortcuts */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Navigation</h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/companies"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Manage Companies &rarr;
                </Link>
                <Link
                  href="/complexes"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Manage Apartment Complexes &rarr;
                </Link>
                <Link
                  href="/activity-logs"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                >
                  View System Audit Logs &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Administrators Info */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100 mb-2">System Administrators</h2>
              <p className="text-xs text-slate-400 mb-6">
                Active Complex Admins and Super Admins managing residency operations.
              </p>
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <span className="block text-xs text-indigo-300">Total Active Admins</span>
                  <span className="block text-3xl font-extrabold text-indigo-400 mt-1">
                    {isLoading ? '...' : stats?.totalAdmins || 0}
                  </span>
                </div>
                <UserCheck className="w-10 h-10 text-indigo-400 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
