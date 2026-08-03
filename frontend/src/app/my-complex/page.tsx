'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complexService } from '@/services/complex.service';
import { Building2, Layers, Home, Phone, Mail, MapPin, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MyComplexPage() {
  const queryClient = useQueryClient();

  const { data: complex, isLoading } = useQuery({
    queryKey: ['myComplex'],
    queryFn: () => complexService.getMyComplex(),
  });

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  React.useEffect(() => {
    if (complex) {
      setPhone(complex.phone || '');
      setEmail(complex.email || '');
      setAddress(complex.address || '');
    }
  }, [complex]);

  const updateMutation = useMutation({
    mutationFn: (payload: { phone?: string; email?: string; address?: string }) =>
      complexService.updateMyComplex(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myComplex'] });
      toast.success('Complex details updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update complex details');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-xs font-medium">Loading your complex details...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Assigned Complex Profile
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{complex?.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Company: {complex?.companyName || 'N/A'} | Code: {complex?.code || 'N/A'}
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
            <span className="block text-xs text-slate-400">Total Floors</span>
            <span className="block text-xl font-bold text-slate-100 mt-1">{complex?.totalFloors || 0}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
            <span className="block text-xs text-slate-400">Total Units</span>
            <span className="block text-xl font-bold text-slate-100 mt-1">{complex?.totalUnits || 0}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
            <span className="block text-xs text-slate-400">City</span>
            <span className="block text-sm font-semibold text-slate-100 mt-1">{complex?.city || 'N/A'}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
            <span className="block text-xs text-slate-400">Country</span>
            <span className="block text-sm font-semibold text-slate-100 mt-1">{complex?.country || 'USA'}</span>
          </div>
        </div>

        {/* Edit Contact Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <h2 className="text-base font-semibold text-slate-100">Update Contact & Location</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ phone, email, address });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Official Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="complex@irms.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Street Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Residency Ave"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
