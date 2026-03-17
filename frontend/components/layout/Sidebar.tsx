'use client';
// components/layout/Sidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  Anchor, LayoutDashboard, CalendarDays, Users, History,
  ShieldCheck, LogOut, ChevronRight, Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: ('admin' | 'register' | 'client')[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/schedules',  label: 'Schedules',  icon: CalendarDays },
  { href: '/customers',  label: 'Customers',  icon: Users,    roles: ['admin', 'register'] },
  { href: '/history',    label: 'History',    icon: History,  roles: ['admin', 'register'] },
  { href: '/admin',      label: 'Admin',      icon: ShieldCheck, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    toast.success('Signed out successfully.');
    router.push('/');
  }

  const roleColors: Record<string, string> = {
    admin:    'bg-gold/20 text-gold',
    register: 'bg-seafoam/20 text-teal-600',
    client:   'bg-ocean/20 text-ocean',
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-navy-500 text-white overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-seafoam/20 flex items-center justify-center flex-shrink-0">
          <Anchor className="w-5 h-5 text-seafoam" />
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-white leading-none">Ferry Good</p>
          <p className="text-[10px] text-sand-400/60 mt-0.5 uppercase tracking-widest">Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[10px] text-sand-400/40 uppercase tracking-widest mb-3 font-semibold">Navigation</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon, roles }) => {
          if (roles && user && !roles.includes(user.role as any)) return null;
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <div className={cn('nav-item', active && 'active')}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4 space-y-1">
        <div className="px-3 py-3 rounded-xl bg-white/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-ocean flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white">
              {user?.fullName?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-sand-400/60 truncate">@{user?.username}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full', roleColors[user?.role ?? ''])}>
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}