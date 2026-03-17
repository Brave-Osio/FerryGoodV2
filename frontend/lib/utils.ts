// lib/utils.ts — Shared utility functions
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ScheduleStatus, BookingStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date Formatting ──────────────────────────────────────────
export function fmtDate(dt: string | null | undefined, fmt = 'MMM d, yyyy') {
  if (!dt) return '—';
  try { return format(parseISO(dt), fmt); } catch { return dt; }
}

export function fmtDateTime(dt: string | null | undefined) {
  return fmtDate(dt, 'MMM d, yyyy  h:mm a');
}

export function fmtTime(dt: string | null | undefined) {
  return fmtDate(dt, 'h:mm a');
}

export function fmtRelative(dt: string | null | undefined) {
  if (!dt) return '—';
  try { return formatDistanceToNow(parseISO(dt), { addSuffix: true }); } catch { return dt; }
}

export function fmtDuration(minutes: number | null | undefined) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Status Helpers ───────────────────────────────────────────
export const scheduleStatusConfig: Record<ScheduleStatus, { label: string; color: string; dot: string }> = {
  scheduled: { label: 'Scheduled', color: 'bg-ocean/10 text-ocean border border-ocean/20', dot: 'bg-ocean' },
  boarding:  { label: 'Boarding',  color: 'bg-gold/10 text-gold-600 border border-gold/30', dot: 'bg-gold' },
  departed:  { label: 'Departed',  color: 'bg-seafoam/10 text-seafoam-700 border border-seafoam/20', dot: 'bg-seafoam' },
  arrived:   { label: 'Arrived',   color: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border border-red-200', dot: 'bg-red-500' },
};

export const bookingStatusConfig: Record<BookingStatus, { label: string; color: string }> = {
  confirmed:  { label: 'Confirmed',  color: 'bg-seafoam/10 text-teal-700 border border-seafoam/30' },
  waitlisted: { label: 'Waitlisted', color: 'bg-gold/10 text-amber-700 border border-gold/30' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-600 border border-red-200' },
  boarded:    { label: 'Boarded',    color: 'bg-green-50 text-green-700 border border-green-200' },
};

// ── Capacity Color ───────────────────────────────────────────
export function capacityColor(assigned: number, capacity: number) {
  const pct = capacity > 0 ? assigned / capacity : 0;
  if (pct >= 1)    return 'text-red-600';
  if (pct >= 0.85) return 'text-amber-600';
  if (pct >= 0.6)  return 'text-gold';
  return 'text-seafoam';
}

export function capacityBarColor(assigned: number, capacity: number) {
  const pct = capacity > 0 ? assigned / capacity : 0;
  if (pct >= 1)    return 'bg-red-500';
  if (pct >= 0.85) return 'bg-amber-500';
  if (pct >= 0.6)  return 'bg-gold';
  return 'bg-seafoam';
}

// ── Currency ─────────────────────────────────────────────────
export function fmtPeso(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '—';
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

// ── Ferry Type Icon Label ────────────────────────────────────
export function ferryTypeEmoji(type: string | undefined) {
  switch (type) {
    case 'FastCraft': return '⚡';
    case 'RoRo':      return '🚗';
    case 'ORCA':      return '🐋';
    default:          return '⛴️';
  }
}