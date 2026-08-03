'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complexService } from '@/services/complex.service';
import { floorService } from '@/services/floor.service';
import { unitService } from '@/services/unit.service';
import { residentService } from '@/services/resident.service';
import { useAuth } from '@/features/auth/auth-context';
import { IFloor, IApartmentUnit } from '@/types';
import {
  Layers,
  Home,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Trash2,
  Edit,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export default function FloorsUnitsPage() {
  const searchParams = useSearchParams();
  const urlComplexId = searchParams.get('complexId');

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.slug === 'super_admin';

  const [selectedComplexId, setSelectedComplexId] = useState<string>(urlComplexId || user?.complexId || '');
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);

  useEffect(() => {
    if (urlComplexId) {
      setSelectedComplexId(urlComplexId);
    }
  }, [urlComplexId]);

  // Modals visibility
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<IApartmentUnit | null>(null);
  const [movingInUnit, setMovingInUnit] = useState<IApartmentUnit | null>(null);

  // Floor Form
  const [floorForm, setFloorForm] = useState({ floorNumber: 1, floorLabel: '1st Floor' });

  // Unit Form
  const [unitForm, setUnitForm] = useState({
    unitNumber: '101',
    capacity: 2,
    rentAmount: 1500,
    unitType: '2BHK',
    status: 'available' as any,
  });

  // Move-In Resident Form
  const [residentForm, setResidentForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // Fetch Complexes for Super Admin
  const { data: complexes = [] } = useQuery({
    queryKey: ['complexes'],
    queryFn: () => complexService.getAll(),
    enabled: isSuperAdmin,
  });

  const activeComplexId = isSuperAdmin ? selectedComplexId || (complexes[0]?.id ?? '') : (user?.complexId ?? '');

  // Fetch Floors
  const { data: floors = [], isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors', activeComplexId],
    queryFn: () => floorService.getByComplex(activeComplexId),
    enabled: !!activeComplexId,
  });

  const activeFloorId = selectedFloorId || floors[0]?.id;

  // Fetch Units for current floor
  const { data: units = [], isLoading: isLoadingUnits } = useQuery({
    queryKey: ['units', activeFloorId],
    queryFn: () => unitService.getByFloor(activeFloorId!),
    enabled: !!activeFloorId,
  });

  // Create Floor Mutation
  const createFloorMutation = useMutation({
    mutationFn: (data: { complexId: string; floorNumber: number; floorLabel: string }) =>
      floorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', activeComplexId] });
      toast.success('Floor added successfully!');
      setIsAddFloorOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add floor');
    },
  });

  // Create Unit Mutation
  const createUnitMutation = useMutation({
    mutationFn: (data: any) => unitService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', activeFloorId] });
      toast.success('Apartment unit created successfully!');
      setIsAddUnitOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add unit');
    },
  });

  // Update Unit Mutation
  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => unitService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', activeFloorId] });
      toast.success('Apartment unit updated successfully!');
      setEditingUnit(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update unit');
    },
  });

  // Delete Unit Mutation
  const deleteUnitMutation = useMutation({
    mutationFn: (id: string) => unitService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', activeFloorId] });
      toast.success('Unit deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete unit');
    },
  });

  // Create Resident Mutation
  const createResidentMutation = useMutation({
    mutationFn: (data: any) => residentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', activeFloorId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      toast.success(`Resident registered into unit '${movingInUnit?.displayName}'!`);
      setMovingInUnit(null);
      setResidentForm({ fullName: '', phone: '', email: '', emergencyContactName: '', emergencyContactPhone: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add resident');
    },
  });

  const openEditUnitModal = (unit: IApartmentUnit) => {
    setEditingUnit(unit);
    setUnitForm({
      unitNumber: unit.unitNumber,
      capacity: unit.capacity,
      rentAmount: unit.rentAmount || 1500,
      unitType: unit.unitType || '2BHK',
      status: unit.status,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Floors, Apartment Units & Residents</h1>
            <p className="text-xs text-slate-400 mt-1">
              Structure floors, configure units, edit attributes, and register residents directly to units
            </p>
          </div>

          {/* Super Admin Complex Selector */}
          {isSuperAdmin && complexes.length > 0 && (
            <div className="w-64">
              <select
                value={selectedComplexId}
                onChange={(e) => {
                  setSelectedComplexId(e.target.value);
                  setSelectedFloorId(null);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {complexes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.companyName})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!activeComplexId ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/80 border border-slate-800 rounded-xl">
            <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">Please select an apartment complex to manage</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Floors List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3 h-fit">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Floors</span>
                  <span className="block text-[10px] text-slate-400">Total: {floors.length}</span>
                </div>
                <button
                  onClick={() => setIsAddFloorOpen(true)}
                  className="p-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Floor
                </button>
              </div>

              {isLoadingFloors ? (
                <div className="py-6 text-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-500 mb-1" />
                  <span className="text-xs">Loading floors...</span>
                </div>
              ) : floors.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">No floors created yet</div>
              ) : (
                <div className="space-y-1">
                  {floors.map((floor) => {
                    const isSelected = activeFloorId === floor.id;
                    return (
                      <button
                        key={floor.id}
                        onClick={() => setSelectedFloorId(floor.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div>
                          <span className="block">{floor.floorLabel}</span>
                          <span
                            className={`block text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}
                          >
                            Floor #{floor.floorNumber} &bull; {floor.totalUnits} Units
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Units Grid Display */}
            <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-100">
                    {floors.find((f) => f.id === activeFloorId)?.floorLabel || 'Floor Layout'}
                  </h2>
                  <p className="text-xs text-slate-400">Apartment units, edit options & direct resident registration</p>
                </div>
                {activeFloorId && (
                  <button
                    onClick={() => {
                      setUnitForm({ unitNumber: `${units.length + 1}01`, capacity: 2, rentAmount: 1500, unitType: '2BHK', status: 'available' });
                      setIsAddUnitOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Unit
                  </button>
                )}
              </div>

              {!activeFloorId ? (
                <div className="py-12 text-center text-slate-500 text-xs">Select a floor to view units</div>
              ) : isLoadingUnits ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs font-medium">Loading units...</span>
                </div>
              ) : units.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No apartment units registered on this floor yet. Click &quot;Add Unit&quot; to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {units.map((unit) => {
                    const isOccupied = unit.status === 'occupied';
                    const isMaintenance = unit.status === 'maintenance';

                    return (
                      <div
                        key={unit.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isOccupied
                            ? 'bg-slate-950/90 border-emerald-500/30'
                            : isMaintenance
                            ? 'bg-slate-950/90 border-amber-500/30'
                            : 'bg-slate-950/90 border-cyan-500/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-slate-100">{unit.displayName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                                isOccupied
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : isMaintenance
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              }`}
                            >
                              {unit.status}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1 text-xs text-slate-400">
                            <p>
                              Occupancy: <span className="font-semibold text-slate-200">{unit.occupancyCount}</span> / {unit.capacity} residents
                            </p>
                            {unit.unitType && <p>Type: <span className="text-slate-300">{unit.unitType}</span></p>}
                            {unit.rentAmount && <p>Rent: <span className="text-slate-300">${unit.rentAmount}/mo</span></p>}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          {/* Add Resident Action */}
                          <button
                            onClick={() => setMovingInUnit(unit)}
                            disabled={unit.occupancyCount >= unit.capacity}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3" /> Add Resident
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Edit Unit Action */}
                            <button
                              onClick={() => openEditUnitModal(unit)}
                              className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                              title="Edit Unit Attributes"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete Unit Action */}
                            <button
                              onClick={() => {
                                if (confirm(`Delete unit '${unit.displayName}'?`)) {
                                  deleteUnitMutation.mutate(unit.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                              title="Delete Unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Floor Modal */}
        {isAddFloorOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-100">Add New Floor</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createFloorMutation.mutate({
                    complexId: activeComplexId,
                    floorNumber: Number(floorForm.floorNumber),
                    floorLabel: floorForm.floorLabel,
                  });
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Floor Number *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={floorForm.floorNumber}
                    onChange={(e) => setFloorForm({ ...floorForm, floorNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Floor Label *</label>
                  <input
                    type="text"
                    required
                    value={floorForm.floorLabel}
                    onChange={(e) => setFloorForm({ ...floorForm, floorLabel: e.target.value })}
                    placeholder="e.g. Ground Floor, 1st Floor, Tower A"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddFloorOpen(false)}
                    className="px-3.5 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createFloorMutation.isPending}
                    className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
                  >
                    Save Floor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add / Edit Unit Modal */}
        {(isAddUnitOpen || editingUnit) && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-100">
                {editingUnit ? `Edit Unit '${editingUnit.displayName}'` : 'Add Apartment Unit'}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingUnit) {
                    updateUnitMutation.mutate({
                      id: editingUnit.id,
                      data: {
                        unitNumber: unitForm.unitNumber,
                        capacity: Number(unitForm.capacity),
                        rentAmount: Number(unitForm.rentAmount),
                        unitType: unitForm.unitType,
                        status: unitForm.status,
                      },
                    });
                  } else {
                    createUnitMutation.mutate({
                      floorId: activeFloorId,
                      unitNumber: unitForm.unitNumber,
                      capacity: Number(unitForm.capacity),
                      rentAmount: Number(unitForm.rentAmount),
                      unitType: unitForm.unitType,
                    });
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit Number / Code *</label>
                  <input
                    type="text"
                    required
                    value={unitForm.unitNumber}
                    onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                    placeholder="e.g. 101, A-1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={unitForm.capacity}
                      onChange={(e) => setUnitForm({ ...unitForm, capacity: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Unit Type</label>
                    <input
                      type="text"
                      value={unitForm.unitType}
                      onChange={(e) => setUnitForm({ ...unitForm, unitType: e.target.value })}
                      placeholder="e.g. Studio, 2BHK"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Rent ($)</label>
                    <input
                      type="number"
                      value={unitForm.rentAmount}
                      onChange={(e) => setUnitForm({ ...unitForm, rentAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                  {editingUnit && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                      <select
                        value={unitForm.status}
                        onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="reserved">Reserved</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddUnitOpen(false);
                      setEditingUnit(null);
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUnitMutation.isPending || updateUnitMutation.isPending}
                    className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    {(createUnitMutation.isPending || updateUnitMutation.isPending) && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    Save Unit
                  </button>
                </div>
              </form>
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
      </div>
    </DashboardLayout>
  );
}
