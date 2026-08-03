'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import {
  LayoutDashboard,
  Building,
  Building2,
  Layers,
  Home,
  Users,
  History,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const roleSlug = user?.role?.slug;

  const superAdminNav = [
    { name: 'Dashboard', href: '/dashboard/super-admin', icon: LayoutDashboard },
    { name: 'Companies', href: '/companies', icon: Building },
    { name: 'Apartment Complexes', href: '/complexes', icon: Building2 },
    { name: 'Residents', href: '/residents', icon: Users },
    { name: 'Activity Logs', href: '/activity-logs', icon: History },
  ];

  const complexAdminNav = [
    { name: 'Dashboard', href: '/dashboard/complex-admin', icon: LayoutDashboard },
    { name: 'My Complex', href: '/my-complex', icon: Building2 },
    { name: 'Floors & Units', href: '/floors-units', icon: Layers },
    { name: 'Residents', href: '/residents', icon: Users },
    { name: 'Activity Logs', href: '/activity-logs', icon: History },
  ];

  const navItems = roleSlug === 'super_admin' ? superAdminNav : complexAdminNav;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800/80 min-h-screen flex flex-col flex-shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            IRMS SaaS
          </span>
          <span className="block text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
            Residency Suite
          </span>
        </div>
      </div>

      {/* Role Badge Banner */}
      <div className="mx-4 mt-4 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="overflow-hidden">
          <span className="block text-xs font-semibold text-slate-200 truncate">
            {user?.fullName}
          </span>
          <span className="block text-[10px] font-medium text-indigo-400 uppercase tracking-wider">
            {roleSlug === 'super_admin' ? 'Super Admin' : 'Complex Admin'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-600/70 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
        IRMS v1.0 Enterprise &copy; 2026
      </div>
    </aside>
  );
}
