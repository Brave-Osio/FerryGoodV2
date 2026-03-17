'use client';
// app/dashboard/page.tsx
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth-context';
import { schedulesAPI, customersAPI } from '../../lib/api';
import { fmtDateTime, fmtTime, fmtDuration, capacityBarColor, capacityColor, ferryTypeEmoji, cn } from '../../lib/utils';
import { ScheduleStatusBadge, PageLoader, StatCard } from '../../components/ui';
import { CalendarDays, Users, Anchor, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Schedule } from '../../types';

export default function DashboardPage() {
  const { user, isAdmin, canWrite } = useAuth();

  const { data: schedData, isLoading: schedLoading } = useQuery({
    queryKey: ['schedules', 'dashboard'],
    queryFn: () => schedulesAPI.list({ limit: 6, sortBy: 'DepartureTime', sortDir: 'ASC', status: 'scheduled' }),
  });

  const { data: custData } = useQuery({
    queryKey: ['customers', 'count'],
    queryFn: () => customersAPI.list({ limit: 1 }),
    enabled: canWrite,
  });

  const schedules: Schedule[] = schedData?.data?.data ?? [];
  const totalCustomers = custData?.data?.pagination?.total ?? 0;
  const totalSchedules = schedData?.data?.pagination?.total ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-navy-300 mt-1">Here's what's happening on the water today.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-navy-300 uppercase tracking-wider">Your role</p>
          <p className="font-semibold text-navy capitalize mt-0.5">{user?.role}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Upcoming Departures"
          value={totalSchedules}
          sub="Scheduled"
          icon={CalendarDays}
          color="bg-ocean/10 text-ocean"
        />
        {canWrite && (
          <StatCard
            label="Total Customers"
            value={totalCustomers}
            sub="Active passengers"
            icon={Users}
            color="bg-seafoam/10 text-teal-600"
          />
        )}
        <StatCard
          label="Capacity Usage"
          value={schedules.length > 0
            ? `${Math.round((schedules.reduce((s, x) => s + x.AssignedCount, 0) / schedules.reduce((s, x) => s + x.Capacity, 0)) * 100)}%`
            : '—'
          }
          sub="Across active schedules"
          icon={TrendingUp}
          color="bg-gold/10 text-amber-600"
        />
        <StatCard
          label="Active Vessels"
          value={new Set(schedules.map(s => s.FerryCode)).size}
          sub="In service"
          icon={Anchor}
          color="bg-navy/10 text-navy"
        />
      </div>

      {/* Upcoming Schedules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Upcoming Departures</h2>
          <Link href="/schedules" className="btn-ghost text-xs">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {schedLoading ? (
          <PageLoader />
        ) : schedules.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-navy-300">No upcoming schedules.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {schedules.map((s) => {
              const pct = s.Capacity > 0 ? (s.AssignedCount / s.Capacity) : 0;
              return (
                <Link key={s.ScheduleID} href={`/schedules/${s.ScheduleID}`}>
                  <div className="card-hover p-5 cursor-pointer group">
                    {/* Ferry + status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{ferryTypeEmoji(s.FerryType)}</span>
                        <div>
                          <p className="font-semibold text-navy text-sm">{s.FerryName}</p>
                          <p className="text-xs text-navy-300 font-mono">{s.FerryCode}</p>
                        </div>
                      </div>
                      <ScheduleStatusBadge status={s.Status} />
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-center">
                        <p className="text-xs font-mono font-bold text-ocean">{s.OriginCode}</p>
                        <p className="text-[10px] text-navy-300 truncate max-w-[70px]">{s.OriginPort}</p>
                      </div>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="h-px flex-1 bg-sand-300" />
                        <span className="text-xs text-navy-300">{fmtDuration(s.EstDurationMin)}</span>
                        <div className="h-px flex-1 bg-sand-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-mono font-bold text-ocean">{s.DestCode}</p>
                        <p className="text-[10px] text-navy-300 truncate max-w-[70px]">{s.DestPort}</p>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center justify-between text-xs text-navy-300 mb-4">
                      <span>Departs {fmtTime(s.DepartureTime)}</span>
                      <span>{fmtDateTime(s.DepartureTime).split(' ')[0]}</span>
                    </div>

                    {/* Capacity bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-navy-300">Passengers</span>
                        <span className={cn('font-semibold', capacityColor(s.AssignedCount, s.Capacity))}>
                          {s.AssignedCount} / {s.Capacity}
                        </span>
                      </div>
                      <div className="h-1.5 bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', capacityBarColor(s.AssignedCount, s.Capacity))}
                          style={{ width: `${Math.min(100, pct * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}