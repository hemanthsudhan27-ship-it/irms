'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { residentService } from '@/services/resident.service';
import { complexService } from '@/services/complex.service';
import { unitService } from '@/services/unit.service';
import { useAuth } from '@/features/auth/auth-context';
import { IResident, IApartmentUnit } from '@/types';
import { Users, Plus, Search, Trash2, LogOut, Loader2, CheckCircle2, XCircle, Phone, Mail, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ResidentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.slug === 'super_admin';

  const [search, setSearch] = useState('');
  const [selectedComplexId, setSelectedComplexId] = useState<string>(user?.complexId || '');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [isMoveInOpen, setIsMoveInOpen] = useState(false);
  const [isMoveOutOpen, setIsMoveOutOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<IResident | null>(null);

  // Form state
  const [moveInForm, setMoveInForm] = useState({
    unitId: '',
    fullName: '',
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    idProofType: 'Passport',
    idProofNumber: '',
  });

  const { data: complexes = [] } = useQuery({
    queryKey: ['complexes'],
    queryFn: () => complexService.getAll(),
    enabled: isSuperAdmin,
  });

  const activeComplexId = isSuperAdmin ? selectedComplexId || (complexes[0]?.id ?? '') : (user?.complexId ?? '');

  // Fetch Residents
  const { data: residentsData, isLoading } = useQuery({
    queryKey: ['residents', activeComplexId, statusFilter, search],
    queryFn: () =>
      residentService.getAll({
        complexId: activeComplexId,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

  const residents = residentsData?.data || [];

  // Fetch Available Units for Move-In
  const { data: availableUnits = [] } = useQuery({
    queryKey: ['units', activeComplexId],
    queryFn: () => unitService.getByComplex(activeComplexId),
    enabled: !!activeComplexId && isMoveInOpen,
  });

  const createResidentMutation = useMutation({
    mutationFn: (data: Partial<IResident>) => residentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      toast.success('Resident registered (Move-In) successfully!');
      setIsMoveInOpen(false);
      setMoveInForm({
        unitId: '',
        fullName: '',
        phone: '',
        email: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        idProofType: 'Passport',
        idProofNumber: '',
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to register resident');
    },
  });

  const moveOutMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date?: string }) => residentService.moveOut(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      toast.success('Resident move-out processed successfully!');
      setIsMoveOutOpen(false);
      setSelectedResident(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to process move-out');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => residentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      toast.success('Resident record deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete resident');
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Residents Directory</h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage active leases, resident profiles, and move-in/move-out workflows
            </p>
          </div>

          <button
            onClick={() => setIsMoveInOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register Move-In
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by resident name, phone or email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Residents</option>
              <option value="moved_out">Moved Out</option>
              <option value="evicted">Evicted</option>
            </select>
          </div>

          {/* Super Admin Complex Selector */}
          {isSuperAdmin && complexes.length > 0 && (
            <div className="w-56">
              <select
                value={selectedComplexId}
                onChange={(e) => setSelectedComplexId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="">All Complexes</option>
                {complexes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Loading residents...</span>
            </div>
          ) : residents.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium">No residents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Resident Name</th>
                    <th className="py-3.5 px-4">Unit / Apartment</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Move-In Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {residents.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="block font-semibold text-slate-100">{res.fullName}</span>
                        {res.emergencyContactName && (
                          <span className="block text-[10px] text-slate-400">
                            ICE: {res.emergencyContactName} ({res.emergencyContactPhone || 'N/A'})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {res.unitDisplayName || res.unitNumber || 'Unit'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{res.phone}</div>
                        {res.email && <div className="text-[10px] text-slate-400">{res.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(res.moveInDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {res.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            <XCircle className="w-3 h-3" /> Moved Out
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {res.status === 'active' && (
                          <button
                            onClick={() => {
                              setSelectedResident(res);
                              setIsMoveOutOpen(true);
                            }}
                            title="Process Move-Out"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete resident record for '${res.fullName}'?`)) {
                              deleteMutation.mutate(res.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Move-In Modal */}
        {isMoveInOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-100">Register Resident Move-In</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createResidentMutation.mutate(moveInForm);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Unit *</label>
                  <select
                    required
                    value={moveInForm.unitId}
                    onChange={(e) => setMoveInForm({ ...moveInForm, unitId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  >
                    <option value="">Select Unit...</option>
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName} ({u.status} - {u.occupancyCount}/{u.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Resident Full Name *</label>
                  <input
                    type="text"
                    required
                    value={moveInForm.fullName}
                    onChange={(e) => setMoveInForm({ ...moveInForm, fullName: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={moveInForm.phone}
                      onChange={(e) => setMoveInForm({ ...moveInForm, phone: e.target.value })}
                      placeholder="+1 (555) 019-2831"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={moveInForm.email}
                      onChange={(e) => setMoveInForm({ ...moveInForm, email: e.target.value })}
                      placeholder="sarah@example.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={moveInForm.emergencyContactName}
                      onChange={(e) => setMoveInForm({ ...moveInForm, emergencyContactName: e.target.value })}
                      placeholder="John Jenkins"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      value={moveInForm.emergencyContactPhone}
                      onChange={(e) => setMoveInForm({ ...moveInForm, emergencyContactPhone: e.target.value })}
                      placeholder="+1 (555) 998-1122"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsMoveInOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createResidentMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    {createResidentMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Complete Move-In
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Move-Out Modal */}
        {isMoveOutOpen && selectedResident && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-100">Process Resident Move-Out</h2>
              <p className="text-xs text-slate-400">
                Are you sure you want to mark <span className="font-semibold text-slate-200">{selectedResident.fullName}</span> as moved out from <span className="font-semibold text-slate-200">{selectedResident.unitDisplayName}</span>?
              </p>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMoveOutOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => moveOutMutation.mutate({ id: selectedResident.id })}
                  disabled={moveOutMutation.isPending}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  {moveOutMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Move-Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
