'use client';
// app/admin/page.tsx — Admin-only user management and audit log
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { authAPI, getErrorMessage } from '../../lib/api';
import { fmtDateTime, fmtRelative, cn } from '../../lib/utils';
import { Modal, Spinner, PageLoader, EmptyState } from '../../components/ui';
import { ShieldCheck, UserPlus, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Sidebar } from '../../components/layout/Sidebar';

interface SystemUser {
  UserID: number; Username: string; FullName: string; Email: string;
  Role: string; IsActive: boolean; CreatedAt: string; LastLogin: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  admin:    'bg-gold/15 text-amber-700 border-gold/30',
  register: 'bg-seafoam/15 text-teal-700 border-seafoam/30',
  client:   'bg-ocean/15 text-ocean border-ocean/20',
};

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', role: 'client' });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/dashboard');
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authAPI.getUsers(),
    enabled: isAdmin,
  });
  const users: SystemUser[] = data?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => authAPI.createUser(form),
    onSuccess: () => {
      toast.success('User created!');
      setAddOpen(false);
      setForm({ username: '', password: '', fullName: '', email: '', role: 'client' });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => authAPI.toggleUser(id),
    onSuccess: () => { toast.success('User status updated.'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (!isAdmin) return null;

  const stats = {
    total:    users.length,
    active:   users.filter(u => u.IsActive).length,
    admin:    users.filter(u => u.Role === 'admin').length,
    register: users.filter(u => u.Role === 'register').length,
    client:   users.filter(u => u.Role === 'client').length,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-sand-50">
        <div className="max-w-[1200px] mx-auto p-8 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-ocean" /> Administration
              </h1>
              <p className="text-navy-300 mt-1 text-sm">Manage system users and access control.</p>
            </div>
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <UserPlus className="w-4 h-4" /> Add User
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total Users', value: stats.total },
              { label: 'Active',      value: stats.active },
              { label: 'Admins',      value: stats.admin },
              { label: 'Register',    value: stats.register },
              { label: 'Clients',     value: stats.client },
            ].map(({ label, value }) => (
              <div key={label} className="card p-4 text-center">
                <p className="font-display text-2xl font-semibold text-navy">{value}</p>
                <p className="text-xs text-navy-300 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Users Table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-sand-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-ocean" />
              <h2 className="font-semibold text-navy">System Users</h2>
            </div>
            {isLoading ? <PageLoader /> :
             users.length === 0 ? <EmptyState title="No users found" /> : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Created</th>
                      <th>Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.UserID}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-ocean/10 flex items-center justify-center text-xs font-semibold text-ocean">
                              {u.FullName?.charAt(0)}
                            </div>
                            <span className="font-medium text-sm text-navy">{u.FullName}</span>
                          </div>
                        </td>
                        <td><code className="text-xs bg-sand-100 px-2 py-0.5 rounded">{u.Username}</code></td>
                        <td><span className="text-sm text-navy-300">{u.Email || '—'}</span></td>
                        <td>
                          <span className={cn('badge border', ROLE_COLORS[u.Role] ?? '')}>
                            {u.Role}
                          </span>
                        </td>
                        <td>
                          <span className={cn('badge', u.IsActive
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-500 border border-red-100')}>
                            {u.IsActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-navy-300">{u.LastLogin ? fmtRelative(u.LastLogin) : 'Never'}</span>
                        </td>
                        <td>
                          <span className="text-xs text-navy-300">{fmtDateTime(u.CreatedAt)}</span>
                        </td>
                        <td>
                          {u.UserID !== user?.userId && (
                            <button
                              className={cn('btn-icon', u.IsActive ? 'text-green-500' : 'text-navy-300')}
                              onClick={() => toggleMutation.mutate(u.UserID)}
                              disabled={toggleMutation.isPending}
                              title={u.IsActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {u.IsActive
                                ? <ToggleRight className="w-5 h-5" />
                                : <ToggleLeft className="w-5 h-5" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="card p-5 border-l-4 border-l-gold bg-gold/5">
            <h3 className="font-semibold text-navy mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold" /> Security Notes
            </h3>
            <ul className="text-sm text-navy-400 space-y-1 list-disc list-inside">
              <li>All user passwords are hashed with bcrypt (12 rounds) — never stored in plaintext.</li>
              <li>JWT tokens expire in 8 hours. Users must re-authenticate after expiry.</li>
              <li>All actions (login, create, delete, assign) are recorded in the AuditLog table.</li>
              <li>The MS Access database is encrypted with a database-level password.</li>
              <li>Auto-backup runs on every database close via the VBA AutoBackupOnClose module.</li>
              <li>Deleting a customer soft-deletes (IsActive=No) and cancels all active bookings.</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add System User">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" required value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Username *</label>
              <input className="input font-mono" required value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password *</label>
              <input className="input" type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="admin">Admin</option>
                <option value="register">Register</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Spinner size="sm" /> : <><UserPlus className="w-4 h-4" /> Create User</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}