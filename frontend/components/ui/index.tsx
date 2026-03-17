'use client';
// components/ui/index.tsx — Shared UI primitives
import React from 'react';
import { cn, scheduleStatusConfig, bookingStatusConfig } from '../../lib/utils';
import { ScheduleStatus, BookingStatus } from '../../types';
import { Search, ChevronLeft, ChevronRight, AlertCircle, Inbox } from 'lucide-react';

// ── StatusBadge ──────────────────────────────────────────────
export function ScheduleStatusBadge({ status }: { status: ScheduleStatus }) {
  const cfg = scheduleStatusConfig[status] ?? { label: status, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={cn('badge', cfg.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = bookingStatusConfig[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={cn('badge', cfg.color)}>{cfg.label}</span>;
}

// ── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={cn('border-2 border-ocean/20 border-t-ocean rounded-full animate-spin', sizes[size], className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-navy-300 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────
export function EmptyState({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sand-200 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-navy-300" />
      </div>
      <h3 className="font-display text-xl font-semibold text-navy mb-2">{title}</h3>
      {description && <p className="text-sm text-navy-300 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="font-display text-xl font-semibold text-navy mb-2">Something went wrong</h3>
      <p className="text-sm text-navy-300 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

// ── Search bar ──────────────────────────────────────────────
export function SearchBar({
  value, onChange, placeholder = 'Search...', className
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
      <input
        className="input pl-9"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────
export function Select({ value, onChange, options, placeholder, className }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      className={cn('input appearance-none cursor-pointer', className)}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Pagination ───────────────────────────────────────────────
export function Pagination({
  page, totalPages, total, limit, onPageChange
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-xs text-navy-300">
        Showing <span className="font-semibold text-navy">{from}–{to}</span> of{' '}
        <span className="font-semibold text-navy">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn-icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p: number;
          if (totalPages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= totalPages - 2) p = totalPages - 4 + i;
          else p = page - 2 + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                p === page
                  ? 'bg-ocean text-white'
                  : 'text-navy-400 hover:bg-sand-200'
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          className="btn-icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────
export function Modal({
  open, onClose, title, children, width = 'max-w-lg'
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-500/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full animate-slide-up', width)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-300">
          <h2 className="font-display text-xl font-semibold text-navy">{title}</h2>
          <button onClick={onClose} className="btn-icon text-navy-300">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'bg-ocean/10 text-ocean' }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-navy-300 uppercase tracking-wider font-medium">{label}</p>
        <p className="font-display text-2xl font-semibold text-navy mt-0.5">{value}</p>
        {sub && <p className="text-xs text-navy-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── SortButton ───────────────────────────────────────────────
export function SortButton({ field, current, dir, onSort, children }: {
  field: string;
  current: string;
  dir: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  children: React.ReactNode;
}) {
  const active = current === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors',
        active ? 'text-ocean' : 'text-navy-300 hover:text-navy'
      )}
    >
      {children}
      <span className="text-[10px]">{active ? (dir === 'ASC' ? '↑' : '↓') : '↕'}</span>
    </button>
  );
}