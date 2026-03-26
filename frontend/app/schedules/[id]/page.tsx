'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesAPI, customersAPI, getErrorMessage } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import {
  fmtDateTime, fmtTime, fmtDuration, fmtRelative, fmtPeso,
  capacityBarColor, capacityColor, ferryTypeEmoji, cn
} from '../../../lib/utils';
import {
  ScheduleStatusBadge, BookingStatusBadge, PageLoader, ErrorState,
  Modal, SearchBar, Spinner
} from '../../../components/ui';
import {
  ArrowLeft, Users, UserPlus, Trash2, ArrowRight, Clock, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { ScheduleDetail, Customer, ScheduleCustomer } from '../../../types';
import { Sidebar } from '../../../components/layout/Sidebar';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled',  color: 'text-blue-600' },
  { value: 'boarding',  label: 'Boarding',   color: 'text-amber-600' },
  { value: 'departed',  label: 'Departed',   color: 'text-teal-600' },
  { value: 'arrived',   label: 'Arrived',    color: 'text-green-600' },
  { value: 'cancelled', label: 'Cancelled',  color: 'text-red-600' },
];

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { isAdmin, canWrite } = useAuth();

  const [assignOpen,    setAssignOpen]    = useState(false);
  const [removeTarget,  setRemoveTarget]  = useState<ScheduleCustomer | null>(null);
  const [removeReason,  setRemoveReason]  = useState('');
  const [custSearch,    setCustSearch]    = useState('');
  const [custPage,      setCustPage]      = useState(1);
  const [statusOpen,    setStatusOpen]    = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['schedule', id],
    queryFn: () => schedulesAPI.get(Number(id)),
    enabled: !!id,
  });
  const schedule: ScheduleDetail | null = (data as any)?.data?.data ?? null;

  const { data: custData, isLoading: custLoading } = useQuery({
    queryKey: ['customers-search', custSearch, custPage],
    queryFn: () => customersAPI.list({ search: custSearch, page: custPage, limit: 8 }),
    enabled: assignOpen && canWrite,
  });
  const availableCustomers: Customer[] = (custData as any)?.data?.data ?? [];
  const assignedIds = new Set((schedule?.customers ?? [])
    .filter(c => c.BookingStatus !== 'cancelled')
    .map(c => c.CustomerID));

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => schedulesAPI.updateStatus(Number(id), newStatus),
    onSuccess: (_, newStatus) => {
      toast.success(`Status updated to ${newStatus}.`);
      setStatusOpen(false);
      qc.invalidateQueries({ queryKey: ['schedule', id] });
      qc.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const assignMutation = useMutation({
    mutationFn: (customerId: number) =>
      schedulesAPI.assignCustomer(Number(id), { customerId }),
    onSuccess: () => {
      toast.success('Customer assigned successfully.');
      qc.invalidateQueries({ queryKey: ['schedule', id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: number; reason: string }) =>
      schedulesAPI.removeCustomer(Number(id), assignmentId, reason),
    onSuccess: () => {
      toast.success('Customer removed from schedule.');
      setRemoveTarget(null);
      setRemoveReason('');
      qc.invalidateQueries({ queryKey: ['schedule', id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <PageLoader />;
  if (isError || !schedule) return (
    <ErrorState message={getErrorMessage(error) ?? 'Schedule not found.'} onRetry={refetch} />
  );

  const pct = schedule.Capacity > 0 ? schedule.AssignedCount / schedule.Capacity : 0;
  const activeCustomers = schedule.customers.filter(c => c.BookingStatus !== 'cancelled');
  const currentStatusCfg = STATUS_OPTIONS.find(s => s.value === schedule.Status);

  return (
    <div className="flex h-screen overflow-hidden">
    <Sidebar />
    <main className="flex-1 overflow-y-auto bg-sand-50">
        <div className="max-w-[1400px] mx-auto p-8 space-y-6 animate-fade-in">

          {/* Back */}
          <button onClick={() => router.back()} className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Schedules
          </button>

          {/* Header card */}
          <div className="card overflow-hidden">
            <div className="bg-ocean-gradient p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{ferryTypeEmoji(schedule.FerryType)}</span>
                    <div>
                      <h1 className="font-display text-3xl font-semibold">{schedule.FerryName}</h1>
                      <p className="text-white/50 font-mono text-sm">{schedule.FerryCode} · {schedule.FerryType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div>
                      <p className="font-mono font-bold text-seafoam text-lg">{schedule.OriginCode}</p>
                      <p className="text-white/50 text-xs">{schedule.OriginPort}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-px flex-1 bg-white/20" />
                      <div className="text-xs text-white/40 text-center">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {fmtDuration(schedule.EstDurationMin)}
                      </div>
                      <div className="h-px flex-1 bg-white/20" />
                      <ArrowRight className="w-4 h-4 text-seafoam" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-seafoam text-lg">{schedule.DestCode}</p>
                      <p className="text-white/50 text-xs">{schedule.DestPort}</p>
                    </div>
                  </div>
                </div>

                {/* ── Status badge / dropdown ── */}
                <div className="flex-shrink-0">
                  {isAdmin ? (
                    <div className="relative">
                      <button
                        onClick={() => setStatusOpen(v => !v)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
                                   bg-white/20 text-white border border-white/30
                                   hover:bg-white/30 transition-all"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        {currentStatusCfg?.label ?? schedule.Status}
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {statusOpen && (
                        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-card-hover
                                        border border-sand-300 overflow-hidden z-50">
                          <p className="px-3 py-2 text-[10px] text-navy-300 uppercase tracking-wider font-semibold border-b border-sand-200">
                            Change Status
                          </p>
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              disabled={opt.value === schedule.Status || statusMutation.isPending}
                              onClick={() => statusMutation.mutate(opt.value)}
                              className={cn(
                                'flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left transition-colors',
                                opt.value === schedule.Status
                                  ? 'bg-sand-100 text-navy-300 cursor-default'
                                  : 'hover:bg-sand-50 text-navy'
                              )}
                            >
                              {statusMutation.isPending && statusMutation.variables === opt.value ? (
                                <Spinner size="sm" />
                              ) : (
                                <span className={cn('font-semibold text-xs', opt.color)}>{opt.label}</span>
                              )}
                              {opt.value === schedule.Status && (
                                <span className="ml-auto text-[10px] text-navy-300">current</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Non-admin: show plain white badge (visible on dark background)
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      {currentStatusCfg?.label ?? schedule.Status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule metadata */}
            <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4 border-b border-sand-200">
              {[
                { label: 'Departure', value: fmtDateTime(schedule.DepartureTime) },
                { label: 'Arrival',   value: fmtDateTime(schedule.ArrivalTime)   },
                { label: 'Route',     value: schedule.RouteCode },
                { label: 'Distance',  value: schedule.DistanceKM ? `${schedule.DistanceKM} km` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-navy-300 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm font-semibold text-navy">{value}</p>
                </div>
              ))}
            </div>

            {/* Capacity */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-navy">Passenger Capacity</p>
                <span className={cn('text-sm font-bold', capacityColor(schedule.AssignedCount, schedule.Capacity))}>
                  {schedule.AssignedCount} / {schedule.Capacity} seats
                </span>
              </div>
              <div className="h-2.5 bg-sand-200 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', capacityBarColor(schedule.AssignedCount, schedule.Capacity))}
                  style={{ width: `${Math.min(100, pct * 100)}%` }}
                />
              </div>
              <p className="text-xs text-navy-300 mt-1.5">{schedule.Capacity - schedule.AssignedCount} seats remaining</p>
            </div>
          </div>

          {/* Assigned Customers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2">
                <Users className="w-5 h-5 text-ocean" />
                Assigned Passengers
                <span className="text-base font-normal text-navy-300">({activeCustomers.length})</span>
              </h2>
              {canWrite && schedule.Status !== 'cancelled' && schedule.Status !== 'arrived' && (
                <button className="btn-primary" onClick={() => setAssignOpen(true)}>
                  <UserPlus className="w-4 h-4" />
                  Assign Customer
                </button>
              )}
            </div>

            <div className="card overflow-hidden">
              {activeCustomers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-10 h-10 text-sand-300 mx-auto mb-3" />
                  <p className="font-display text-lg text-navy mb-1">No passengers assigned</p>
                  <p className="text-sm text-navy-300">
                    {canWrite ? 'Click "Assign Customer" to add passengers.' : 'No passengers have been assigned to this schedule.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Passenger</th>
                        <th>Contact</th>
                        <th>ID</th>
                        <th>Seat</th>
                        <th>Class</th>
                        <th>Fare</th>
                        <th>Status</th>
                        <th>Assigned</th>
                        {isAdmin && <th />}
                      </tr>
                    </thead>
                    <tbody>
                      {activeCustomers.map((c) => (
                        <tr key={c.AssignmentID}>
                          <td>
                            <p className="font-semibold text-navy text-sm">{c.FirstName} {c.LastName}</p>
                            <p className="text-xs text-navy-300">{c.Gender}</p>
                          </td>
                          <td>
                            <p className="text-sm">{c.Email || '—'}</p>
                            <p className="text-xs text-navy-300">{c.Phone || '—'}</p>
                          </td>
                          <td>
                            <p className="text-xs font-mono text-navy-300">{c.IDType}</p>
                            <p className="text-xs font-mono text-navy">{c.IDNumber || '—'}</p>
                          </td>
                          <td>
                            <span className="font-mono text-sm font-semibold text-ocean">{c.SeatNumber || '—'}</span>
                          </td>
                          <td>
                            <span className="text-xs badge bg-ocean/10 text-ocean border border-ocean/20">
                              {c.TicketClass}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono text-sm">{fmtPeso(c.FareAmount)}</span>
                          </td>
                          <td><BookingStatusBadge status={c.BookingStatus} /></td>
                          <td>
                            <p className="text-xs text-navy-300">{fmtRelative(c.AssignedAt)}</p>
                            <p className="text-[10px] text-navy-200">by {c.AssignedByName}</p>
                          </td>
                          {isAdmin && (
                            <td>
                              <button
                                className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setRemoveTarget(c)}
                                title="Remove passenger"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Assign Modal */}
          <Modal open={assignOpen} onClose={() => { setAssignOpen(false); setCustSearch(''); }} title="Assign Passenger">
            <div className="space-y-4">
              <SearchBar
                value={custSearch}
                onChange={v => { setCustSearch(v); setCustPage(1); }}
                placeholder="Search by name, email, ID..."
              />
              {custLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : availableCustomers.length === 0 ? (
                <div className="py-8 text-center text-navy-300 text-sm">No customers found.</div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableCustomers.map((c) => {
                    const alreadyAssigned = assignedIds.has(c.CustomerID);
                    return (
                      <div
                        key={c.CustomerID}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border transition-all',
                          alreadyAssigned
                            ? 'border-seafoam/30 bg-seafoam/5 opacity-60'
                            : 'border-sand-300 hover:border-ocean/30 hover:bg-ocean/5'
                        )}
                      >
                        <div>
                          <p className="font-semibold text-navy text-sm">{c.FirstName} {c.LastName}</p>
                          <p className="text-xs text-navy-300">{c.Email} · {c.IDType} {c.IDNumber}</p>
                        </div>
                        {alreadyAssigned ? (
                          <span className="text-xs text-seafoam font-semibold">Assigned</span>
                        ) : (
                          <button
                            className="btn-primary text-xs py-1.5 px-3"
                            disabled={assignMutation.isPending}
                            onClick={() => assignMutation.mutate(c.CustomerID)}
                          >
                            {assignMutation.isPending ? <Spinner size="sm" /> : '+ Assign'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-sand-200">
                <Link href="/customers">
                  <button className="btn-ghost text-xs">+ Add new customer</button>
                </Link>
                <button className="btn-secondary" onClick={() => setAssignOpen(false)}>Done</button>
              </div>
            </div>
          </Modal>

          {/* Remove Modal */}
          <Modal
            open={!!removeTarget}
            onClose={() => { setRemoveTarget(null); setRemoveReason(''); }}
            title="Remove Passenger"
          >
            {removeTarget && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-sm font-semibold text-navy">{removeTarget.FirstName} {removeTarget.LastName}</p>
                  <p className="text-xs text-navy-300">{removeTarget.Email} · Seat {removeTarget.SeatNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="label">Reason for removal (optional)</label>
                  <textarea
                    className="input resize-none h-20"
                    placeholder="e.g. Customer requested cancellation"
                    value={removeReason}
                    onChange={e => setRemoveReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button className="btn-secondary flex-1" onClick={() => { setRemoveTarget(null); setRemoveReason(''); }}>
                    Cancel
                  </button>
                  <button
                    className="btn-danger flex-1"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate({ assignmentId: removeTarget.AssignmentID, reason: removeReason })}
                  >
                    {removeMutation.isPending ? <Spinner size="sm" /> : <><Trash2 className="w-4 h-4" /> Remove</>}
                  </button>
                </div>
              </div>
            )}
          </Modal>

        </div>
      </main>
    </div>
  );
}