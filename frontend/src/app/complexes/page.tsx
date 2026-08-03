'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complexService } from '@/services/complex.service';
import { companyService } from '@/services/company.service';
import { floorService } from '@/services/floor.service';
import { unitService } from '@/services/unit.service';
import { residentService } from '@/services/resident.service';
import { authService, UserSummary } from '@/services/auth.service';
import { useAuth } from '@/features/auth/auth-context';
import { IComplex, IFloor, IApartmentUnit } from '@/types';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Edit,
  UserCheck,
  Layers,
  Home,
  Loader2,
  Shield,
  Eye,
  UserPlus,
  X,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ComplexesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.slug === 'super_admin';

  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingComplex, setEditingComplex] = useState<IComplex | null>(null);
  const [assigningComplex, setAssigningComplex] = useState<IComplex | null>(null);

  // Inspector Modal state
  const [inspectingComplex, setInspectingComplex] = useState<IComplex | null>(null);
  const [inspectedFloorId, setInspectedFloorId] = useState<string | null>(null);
  const [movingInUnit, setMovingInUnit] = useState<IApartmentUnit | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
  });

  const [selectedAdminId, setSelectedAdminId] = useState('');

  // Move-In Resident Form
  const [residentForm, setResidentForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // Queries
  const { data: complexes = [], isLoading } = useQuery({
    queryKey: ['complexes'],
    queryFn: () => complexService.getAll(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getAll(),
  });

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => authService.getUsers(),
    enabled: isSuperAdmin,
  });

  // Inspected Complex Floors
  const { data: inspectedFloors = [], isLoading: isLoadingInspectedFloors } = useQuery({
    queryKey: ['floors', inspectingComplex?.id],
    queryFn: () => floorService.getByComplex(inspectingComplex!.id),
    enabled: !!inspectingComplex,
  });

  const activeInspectedFloorId = inspectedFloorId || inspectedFloors[0]?.id;

  // Inspected Floor Units
  const { data: inspectedUnits = [], isLoading: isLoadingInspectedUnits } = useQuery({
    queryKey: ['units', activeInspectedFloorId],
    queryFn: () => unitService.getByFloor(activeInspectedFloorId!),
    enabled: !!activeInspectedFloorId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<IComplex>) => complexService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complexes'] });
      toast.success('Apartment complex created successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create complex');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IComplex> }) => complexService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complexes'] });
      toast.success('Apartment complex updated successfully!');
      setEditingComplex(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update complex');
    },
  });

  const assignAdminMutation = useMutation({
    mutationFn: ({ complexId, adminUserId }: { complexId: string; adminUserId: string }) =>
      complexService.assignAdmin(complexId, adminUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complexes'] });
      toast.success('Complex Admin assigned successfully!');
      setAssigningComplex(null);
      setSelectedAdminId('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to assign admin');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => complexService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complexes'] });
      toast.success('Apartment complex deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete complex');
    },
  });

  // Create Resident Mutation
  const createResidentMutation = useMutation({
    mutationFn: (data: any) => residentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', activeInspectedFloorId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      toast.success(`Resident registered into unit '${movingInUnit?.displayName}'!`);
      setMovingInUnit(null);
      setResidentForm({ fullName: '', phone: '', email: '', emergencyContactName: '', emergencyContactPhone: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add resident');
    },
  });

  const resetForm = () => {
    setFormData({
      companyId: '',
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      email: '',
    });
  };

  const openEditModal = (comp: IComplex) => {
    setEditingComplex(comp);
    setFormData({
      companyId: comp.companyId || '',
      name: comp.name || '',
      code: comp.code || '',
      address: comp.address || '',
      city: comp.city || '',
      state: comp.state || '',
      phone: comp.phone || '',
      email: comp.email || '',
    });
  };

  const filteredComplexes = complexes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Apartment Complexes</h1>
            <p className="text-xs text-slate-400 mt-1">
              Residential buildings, towers, floors, units & resident occupancy
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Complex
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complexes by name, code or company..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs font-medium">Loading apartment complexes...</span>
          </div>
        ) : filteredComplexes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/80 border border-slate-800 rounded-xl">
            <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">No apartment complexes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredComplexes.map((comp) => (
              <div
                key={comp.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-indigo-400 tracking-wider">
                        {comp.companyName || 'Company'}
                      </span>
                      <h2 className="text-base font-bold text-slate-100 mt-0.5">{comp.name}</h2>
                      {comp.city && <span className="block text-xs text-slate-400">{comp.city}, {comp.country}</span>}
                    </div>
                    {comp.code && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
                        {comp.code}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>{comp.totalFloors} Floors</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Home className="w-4 h-4 text-cyan-400" />
                      <span>{comp.totalUnits} Units</span>
                    </div>
                  </div>

                  {/* Assigned Admin Card Banner */}
                  <div className="mt-4 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="block text-[10px] text-slate-400">Complex Admin</span>
                        <span className="block text-xs font-semibold text-slate-200">
                          {comp.assignedAdmin ? comp.assignedAdmin.name : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          setAssigningComplex(comp);
                          setSelectedAdminId(comp.assignedAdmin?.id || '');
                        }}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Assign Admin
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setInspectingComplex(comp);
                        setInspectedFloorId(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Floors & Units
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(comp)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                      title="Edit Complex Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete apartment complex '${comp.name}'?`)) {
                            deleteMutation.mutate(comp.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete Complex"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inline Floors & Units Inspector Modal */}
        {inspectingComplex && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    Apartment Complex Inspector
                  </span>
                  <h2 className="text-xl font-bold text-slate-100">{inspectingComplex.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/floors-units?complexId=${inspectingComplex.id}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg"
                  >
                    Open Full Builder &rarr;
                  </Link>
                  <button
                    onClick={() => setInspectingComplex(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Floors and Units Interactive View */}
              {isLoadingInspectedFloors ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Loading complex floor structure...</span>
                </div>
              ) : inspectedFloors.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No floors created for {inspectingComplex.name} yet. Use the Full Builder to add floors.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Floor tabs */}
                  <div className="space-y-1">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Floors ({inspectedFloors.length})
                    </span>
                    {inspectedFloors.map((floor) => {
                      const isSel = activeInspectedFloorId === floor.id;
                      return (
                        <button
                          key={floor.id}
                          onClick={() => setInspectedFloorId(floor.id)}
                          className={`w-full text-left p-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                            isSel
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{floor.floorLabel}</span>
                          <span className="text-[10px] opacity-80">{floor.totalUnits} Units</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Units grid */}
                  <div className="md:col-span-3 space-y-3">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Units on {inspectedFloors.find((f) => f.id === activeInspectedFloorId)?.floorLabel || 'Selected Floor'}
                    </span>

                    {isLoadingInspectedUnits ? (
                      <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className="text-xs">Loading floor units...</span>
                      </div>
                    ) : inspectedUnits.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">No units created on this floor yet.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {inspectedUnits.map((unit) => {
                          const isOcc = unit.status === 'occupied';
                          const isMaint = unit.status === 'maintenance';
                          return (
                            <div
                              key={unit.id}
                              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                                isOcc
                                  ? 'bg-slate-950 border-emerald-500/30'
                                  : isMaint
                                  ? 'bg-slate-950 border-amber-500/30'
                                  : 'bg-slate-950 border-cyan-500/30'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-100 text-sm">{unit.displayName}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                                      isOcc
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : isMaint
                                        ? 'bg-amber-500/10 text-amber-400'
                                        : 'bg-cyan-500/10 text-cyan-400'
                                    }`}
                                  >
                                    {unit.status}
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">
                                  <span>Occupancy: </span>
                                  <span className="font-semibold text-slate-200">{unit.occupancyCount}</span> / {unit.capacity} residents
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
                                <button
                                  onClick={() => setMovingInUnit(unit)}
                                  disabled={unit.occupancyCount >= unit.capacity}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                  <UserPlus className="w-3 h-3" /> Add Resident
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Resident to Unit Modal */}
        {movingInUnit && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  Register Resident to &apos;{movingInUnit.displayName}&apos;
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Unit Occupancy: {movingInUnit.occupancyCount} / {movingInUnit.capacity} residents
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createResidentMutation.mutate({
                    unitId: movingInUnit.id,
                    fullName: residentForm.fullName,
                    phone: residentForm.phone,
                    email: residentForm.email || undefined,
                    emergencyContactName: residentForm.emergencyContactName || undefined,
                    emergencyContactPhone: residentForm.emergencyContactPhone || undefined,
                  });
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Resident Full Name *</label>
                  <input
                    type="text"
                    required
                    value={residentForm.fullName}
                    onChange={(e) => setResidentForm({ ...residentForm, fullName: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={residentForm.phone}
                      onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })}
                      placeholder="+1 555-0123"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={residentForm.email}
                      onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
                      placeholder="alex@example.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={residentForm.emergencyContactName}
                      onChange={(e) => setResidentForm({ ...residentForm, emergencyContactName: e.target.value })}
                      placeholder="e.g. John Morgan"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      value={residentForm.emergencyContactPhone}
                      onChange={(e) => setResidentForm({ ...residentForm, emergencyContactPhone: e.target.value })}
                      placeholder="+1 555-9988"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setMovingInUnit(null)}
                    className="px-3.5 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createResidentMutation.isPending}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    {createResidentMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Register Resident
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {(isCreateModalOpen || editingComplex) && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-100">
                {editingComplex ? `Edit '${editingComplex.name}'` : 'Add Apartment Complex'}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingComplex) {
                    updateMutation.mutate({ id: editingComplex.id, data: formData });
                  } else {
                    createMutation.mutate(formData);
                  }
                }}
                className="space-y-3"
              >
                {isSuperAdmin && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Company *</label>
                    <select
                      required
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select Company...</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Complex Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Horizon Towers"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Short Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. HRZ"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Chicago"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 555-0199"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@complex.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingComplex(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Complex Admin Modal */}
        {assigningComplex && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-100">
                Assign Complex Admin
              </h2>
              <p className="text-xs text-slate-400">
                Assign an administrator account to manage <span className="font-semibold text-slate-200">{assigningComplex.name}</span>.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedAdminId) {
                    toast.error('Please select an administrator user');
                    return;
                  }
                  assignAdminMutation.mutate({
                    complexId: assigningComplex.id,
                    adminUserId: selectedAdminId,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Administrator *</label>
                  <select
                    required
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select User...</option>
                    {systemUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email}) - [{u.roleName}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAssigningComplex(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignAdminMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    {assignAdminMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Assign Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
