'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { schedulesAPI } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { fmtTime, fmtDateTime, fmtDuration, capacityBarColor, capacityColor, ferryTypeEmoji, cn } from '../../lib/utils';
import { ScheduleStatusBadge, SearchBar, Select, PageLoader, EmptyState, ErrorState, Pagination, SortButton } from '../../components/ui';
import { Sidebar } from '../../components/layout/Sidebar';
import { CalendarDays, ArrowRight } from 'lucide-react';
import type { Schedule } from '../../types';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'boarding',  label: 'Boarding'  },
  { value: 'departed',  label: 'Departed'  },
  { value: 'arrived',   label: 'Arrived'   },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function SchedulesPage() {
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [sortBy,  setSortBy]  = useState('DepartureTime');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
  const [page,    setPage]    = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['schedules', { search, status, sortBy, sortDir, page }],
    queryFn: () => schedulesAPI.list({ search, status, sortBy, sortDir, page, limit: 15 }),
  });

  const schedules: Schedule[] = (data as any)?.data?.data ?? [];
  const pagination = (data as any)?.data?.pagination;

  function handleSort(field: string) {
    if (sortBy === field) setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(field); setSortDir('ASC'); }
    setPage(1);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-sand-50">
        <div className="max-w-[1400px] mx-auto p-8 space-y-6 animate-fade-in">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <CalendarDays className="w-8 h-8 text-ocean" />
                Ferry Schedules
              </h1>
              <p className="text-navy-300 mt-1 text-sm">Browse all scheduled ferry departures.</p>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={v => { setSearch(v); setPage(1); }}
                placeholder="Search ferry, route, port..."
                className="flex-1"
              />
              <Select
                value={status}
                onChange={v => { setStatus(v); setPage(1); }}
                options={STATUS_OPTIONS}
                placeholder="All statuses"
                className="w-full sm:w-44"
              />
              {(search || status) && (
                <button className="btn-ghost text-sm" onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            {isLoading ? (
              <PageLoader />
            ) : isError ? (
              <ErrorState message={(error as any)?.message ?? 'Failed to load schedules.'} onRetry={refetch} />
            ) : schedules.length === 0 ? (
              <EmptyState
                title="No schedules found"
                description={search || status ? 'Try adjusting your filters.' : 'No schedules yet.'}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th><SortButton field="FerryName" current={sortBy} dir={sortDir} onSort={handleSort}>Ferry</SortButton></th>
                        <th>Route</th>
                        <th><SortButton field="DepartureTime" current={sortBy} dir={sortDir} onSort={handleSort}>Departure</SortButton></th>
                        <th>Arrival</th>
                        <th>Duration</th>
                        <th><SortButton field="AssignedCount" current={sortBy} dir={sortDir} onSort={handleSort}>Capacity</SortButton></th>
                        <th><SortButton field="Status" current={sortBy} dir={sortDir} onSort={handleSort}>Status</SortButton></th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s) => {
                        const pct = s.Capacity > 0 ? s.AssignedCount / s.Capacity : 0;
                        return (
                          <tr key={s.ScheduleID} className="group">
                            <td>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{ferryTypeEmoji(s.FerryType)}</span>
                                <div>
                                  <p className="font-semibold text-navy text-sm">{s.FerryName}</p>
                                  <p className="text-xs text-navy-300 font-mono">{s.FerryCode}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-semibold text-ocean text-xs">{s.OriginCode}</span>
                                <ArrowRight className="w-3 h-3 text-navy-300" />
                                <span className="font-mono font-semibold text-ocean text-xs">{s.DestCode}</span>
                              </div>
                              <p className="text-xs text-navy-300 mt-0.5">{s.RouteCode}</p>
                            </td>
                            <td>
                              <p className="text-sm font-medium text-navy">{fmtTime(s.DepartureTime)}</p>
                              <p className="text-xs text-navy-300">{fmtDateTime(s.DepartureTime).split(' ').slice(0, 3).join(' ')}</p>
                            </td>
                            <td>
                              <p className="text-sm font-medium text-navy">{fmtTime(s.ArrivalTime)}</p>
                              <p className="text-xs text-navy-300">{fmtDateTime(s.ArrivalTime).split(' ').slice(0, 3).join(' ')}</p>
                            </td>
                            <td>
                              <span className="text-sm text-navy-300 font-mono">{fmtDuration(s.EstDurationMin)}</span>
                            </td>
                            <td>
                              <div className="min-w-[100px]">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className={cn('font-semibold', capacityColor(s.AssignedCount, s.Capacity))}>
                                    {s.AssignedCount}/{s.Capacity}
                                  </span>
                                  <span className="text-navy-300">{Math.round(pct * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-sand-200 rounded-full overflow-hidden">
                                  <div
                                    className={cn('h-full rounded-full', capacityBarColor(s.AssignedCount, s.Capacity))}
                                    style={{ width: `${Math.min(100, pct * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td><ScheduleStatusBadge status={s.Status} /></td>
                            <td>
                              <Link href={`/schedules/${s.ScheduleID}`}>
                                <button className="btn-ghost text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                  View <ArrowRight className="w-3 h-3" />
                                </button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {pagination && (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}