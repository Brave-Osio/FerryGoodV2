'use client';
// app/history/page.tsx — Read-only customer-schedule history (admin + register)
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { customersAPI } from '../../lib/api';
import { fmtDateTime, fmtPeso, fmtRelative } from '../../lib/utils';
import {
  SearchBar, Select, PageLoader, EmptyState, ErrorState,
  Pagination, ScheduleStatusBadge, BookingStatusBadge
} from '../../components/ui';
import { History, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '../../components/layout/Sidebar';
import type { HistoryRecord } from '../../types';

const STATUS_OPTS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'boarding',  label: 'Boarding'  },
  { value: 'departed',  label: 'Departed'  },
  { value: 'arrived',   label: 'Arrived'   },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function HistoryPage() {
  const { user, loading, canWrite } = useAuth();
  const router = useRouter();
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    if (!loading && (!user || user.role === 'client')) router.replace('/dashboard');
  }, [user, loading, router]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['history', { search, status, page }],
    queryFn: () => customersAPI.history({ search, scheduleStatus: status, page, limit: 20 }),
    enabled: canWrite,
  });

  const records: HistoryRecord[] = data?.data?.data ?? [];
  const pagination = data?.data?.pagination;

  if (!canWrite) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-sand-50">
        <div className="max-w-[1400px] mx-auto p-8 space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="page-title flex items-center gap-3">
              <History className="w-8 h-8 text-ocean" /> Customer History
            </h1>
            <p className="text-navy-300 mt-1 text-sm">
              Read-only master record of all customer schedule assignments.
            </p>
          </div>

          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={v => { setSearch(v); setPage(1); }}
                placeholder="Search name, ferry, port..."
                className="flex-1"
              />
              <Select
                value={status}
                onChange={v => { setStatus(v); setPage(1); }}
                options={STATUS_OPTS}
                placeholder="All schedule statuses"
                className="w-full sm:w-52"
              />
              {(search || status) && (
                <button className="btn-ghost text-sm" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          {pagination && (
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-navy-300">
                <span className="font-semibold text-navy">{pagination.total}</span> total records
              </p>
              <p className="text-xs text-navy-200 italic">Read-only view</p>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-hidden">
            {isLoading ? <PageLoader /> :
             isError   ? <ErrorState message={(error as any)?.message} onRetry={refetch} /> :
             records.length === 0 ? (
               <EmptyState
                 title="No history records"
                 description={search || status ? 'Try adjusting your filters.' : 'No customer assignments have been recorded yet.'}
               />
             ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Passenger</th>
                        <th>Contact</th>
                        <th>Schedule</th>
                        <th>Route</th>
                        <th>Departure</th>
                        <th>Ferry</th>
                        <th>Seat / Class</th>
                        <th>Fare</th>
                        <th>Booking</th>
                        <th>Sched. Status</th>
                        <th>Assigned</th>
                        <th>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.AssignmentID}>
                          <td>
                            <p className="font-semibold text-navy text-sm">{r.FullName}</p>
                            <p className="text-xs text-navy-300 font-mono">{r.IDType} {r.IDNumber}</p>
                          </td>
                          <td>
                            <p className="text-sm">{r.Email || '—'}</p>
                            <p className="text-xs text-navy-300">{r.Phone || '—'}</p>
                          </td>
                          <td>
                            <span className="font-mono text-xs font-semibold text-ocean">#{r.ScheduleID}</span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="font-mono font-semibold text-ocean">{r.OriginPort?.substring(0, 8)}</span>
                              <ArrowRight className="w-3 h-3 text-navy-300" />
                              <span className="font-mono font-semibold text-ocean">{r.DestPort?.substring(0, 8)}</span>
                            </div>
                            <p className="text-[10px] text-navy-300">{r.RouteCode}</p>
                          </td>
                          <td>
                            <p className="text-sm font-medium text-navy">{fmtDateTime(r.DepartureTime)}</p>
                          </td>
                          <td>
                            <p className="text-sm">{r.FerryName}</p>
                            <p className="text-xs text-navy-300 font-mono">{r.FerryCode}</p>
                          </td>
                          <td>
                            <p className="font-mono font-semibold text-ocean text-sm">{r.SeatNumber || '—'}</p>
                            <span className="text-xs text-navy-300">{r.TicketClass}</span>
                          </td>
                          <td>
                            <span className="font-mono text-sm">{fmtPeso(r.FareAmount)}</span>
                          </td>
                          <td><BookingStatusBadge status={r.BookingStatus} /></td>
                          <td><ScheduleStatusBadge status={r.ScheduleStatus} /></td>
                          <td>
                            <p className="text-xs text-navy-300">{fmtRelative(r.AssignedAt)}</p>
                            <p className="text-[10px] text-navy-200">by {r.AssignedByName}</p>
                          </td>
                          <td>
                            <Link href={`/schedules/${r.ScheduleID}`}>
                              <button className="btn-ghost text-xs">
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pagination && (
                  <Pagination page={pagination.page} totalPages={pagination.totalPages}
                    total={pagination.total} limit={pagination.limit} onPageChange={setPage} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}