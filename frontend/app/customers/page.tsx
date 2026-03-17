'use client';
// app/customers/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { customersAPI, getErrorMessage } from '../../lib/api';
import { fmtDate, fmtRelative } from '../../lib/utils';
import {
  SearchBar, PageLoader, EmptyState, ErrorState,
  Pagination, SortButton, Modal, Spinner
} from '../../components/ui';
import { Users, UserPlus, Trash2, Edit2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Customer } from '../../types';
import { Sidebar } from '../../components/layout/Sidebar';
import { useEffect } from 'react';

// ── Customer Form ────────────────────────────────────────────
interface CustomerFormData {
  firstName: string; lastName: string; email: string; phone: string;
  idType: string; idNumber: string; nationality: string;
  gender: string; birthDate: string; address: string;
}

const EMPTY_FORM: CustomerFormData = {
  firstName: '', lastName: '', email: '', phone: '',
  idType: 'PhilSys', idNumber: '', nationality: 'Filipino',
  gender: '', birthDate: '', address: '',
};

const ID_TYPES = ['PhilSys', 'Passport', 'DriversLicense', 'UMID', 'SSS', 'Voter ID', 'Other'];
const GENDERS  = ['Male', 'Female', 'Other'];

function CustomerForm({ initial, onSubmit, busy }: {
  initial: CustomerFormData;
  onSubmit: (d: CustomerFormData) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof CustomerFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">First Name *</label>
          <input className="input" value={form.firstName} onChange={set('firstName')} required />
        </div>
        <div>
          <label className="label">Last Name *</label>
          <input className="input" value={form.lastName} onChange={set('lastName')} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={set('phone')} placeholder="09XXXXXXXXX" />
        </div>
        <div>
          <label className="label">ID Type</label>
          <select className="input" value={form.idType} onChange={set('idType')}>
            {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">ID Number</label>
          <input className="input font-mono" value={form.idNumber} onChange={set('idNumber')} />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" value={form.gender} onChange={set('gender')}>
            <option value="">— Select —</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Nationality</label>
          <input className="input" value={form.nationality} onChange={set('nationality')} />
        </div>
        <div>
          <label className="label">Birth Date</label>
          <input className="input" type="date" value={form.birthDate} onChange={set('birthDate')} />
        </div>
      </div>
      <div>
        <label className="label">Address</label>
        <textarea className="input resize-none h-16" value={form.address} onChange={set('address')} />
      </div>
      <button type="submit" className="btn-primary w-full justify-center" disabled={busy}>
        {busy ? <Spinner size="sm" /> : 'Save Customer'}
      </button>
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function CustomersPage() {
  const { user, loading, isAdmin, canWrite } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [search,  setSearch]  = useState('');
  const [sortBy,  setSortBy]  = useState('CreatedAt');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [page,    setPage]    = useState(1);
  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role === 'client')) router.replace('/dashboard');
  }, [user, loading, router]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customers', { search, sortBy, sortDir, page }],
    queryFn: () => customersAPI.list({ search, sortBy, sortDir, page, limit: 15 }),
    enabled: canWrite,
  });

  const customers: Customer[] = data?.data?.data ?? [];
  const pagination = data?.data?.pagination;

  const createMutation = useMutation({
    mutationFn: (d: CustomerFormData) => customersAPI.create(d),
    onSuccess: () => { toast.success('Customer created!'); setAddOpen(false); qc.invalidateQueries({ queryKey: ['customers'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: number; d: CustomerFormData }) => customersAPI.update(id, d),
    onSuccess: () => { toast.success('Customer updated!'); setEditTarget(null); qc.invalidateQueries({ queryKey: ['customers'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersAPI.delete(id),
    onSuccess: () => { toast.success('Customer deleted.'); setDeleteTarget(null); qc.invalidateQueries({ queryKey: ['customers'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function handleSort(field: string) {
    if (sortBy === field) setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(field); setSortDir('ASC'); }
    setPage(1);
  }

  if (!canWrite) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-sand-50">
        <div className="max-w-[1400px] mx-auto p-8 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <Users className="w-8 h-8 text-ocean" /> Customers
              </h1>
              <p className="text-navy-300 mt-1 text-sm">Manage the passenger registry.</p>
            </div>
            {canWrite && (
              <button className="btn-primary" onClick={() => setAddOpen(true)}>
                <UserPlus className="w-4 h-4" /> New Customer
              </button>
            )}
          </div>

          {/* Search */}
          <div className="card p-4">
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search name, email, phone, ID..." />
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            {isLoading ? <PageLoader /> :
             isError   ? <ErrorState message={getErrorMessage(error)} onRetry={refetch} /> :
             customers.length === 0 ? (
               <EmptyState title="No customers found" description={search ? 'Try a different search.' : 'Add your first customer to get started.'} />
             ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th><SortButton field="LastName" current={sortBy} dir={sortDir} onSort={handleSort}>Name</SortButton></th>
                        <th>Contact</th>
                        <th>ID</th>
                        <th>Nationality</th>
                        <th>Bookings</th>
                        <th><SortButton field="CreatedAt" current={sortBy} dir={sortDir} onSort={handleSort}>Added</SortButton></th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(c => (
                        <tr key={c.CustomerID} className="group">
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-ocean/10 flex items-center justify-center text-ocean font-semibold text-sm flex-shrink-0">
                                {c.FirstName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-navy text-sm">{c.FirstName} {c.LastName}</p>
                                <p className="text-xs text-navy-300">{c.Gender || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="text-sm">{c.Email || '—'}</p>
                            <p className="text-xs text-navy-300">{c.Phone || '—'}</p>
                          </td>
                          <td>
                            <p className="text-xs text-navy-300">{c.IDType}</p>
                            <p className="text-xs font-mono text-navy">{c.IDNumber || '—'}</p>
                          </td>
                          <td><span className="text-sm">{c.Nationality}</span></td>
                          <td>
                            <span className="badge bg-ocean/10 text-ocean border border-ocean/20">
                              {c.ActiveBookings ?? 0} active
                            </span>
                          </td>
                          <td>
                            <p className="text-xs text-navy-300">{fmtRelative(c.CreatedAt)}</p>
                            <p className="text-[10px] text-navy-200">by {c.CreatedByName}</p>
                          </td>
                          <td>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canWrite && (
                                <button className="btn-icon text-ocean" onClick={() => setEditTarget(c)}>
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isAdmin && (
                                <button className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(c)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Customer" width="max-w-2xl">
        <CustomerForm initial={EMPTY_FORM} onSubmit={(d) => createMutation.mutate(d)} busy={createMutation.isPending} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Customer" width="max-w-2xl">
        {editTarget && (
          <CustomerForm
            initial={{ firstName: editTarget.FirstName, lastName: editTarget.LastName,
              email: editTarget.Email, phone: editTarget.Phone, idType: editTarget.IDType,
              idNumber: editTarget.IDNumber, nationality: editTarget.Nationality,
              gender: editTarget.Gender, birthDate: editTarget.BirthDate?.split('T')[0] ?? '',
              address: editTarget.Address ?? '' }}
            onSubmit={(d) => updateMutation.mutate({ id: editTarget.CustomerID, d })}
            busy={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Customer">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-navy-400">
              Are you sure you want to delete <span className="font-semibold text-navy">{deleteTarget.FirstName} {deleteTarget.LastName}</span>?
              This will also cancel all their active bookings.
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger flex-1" disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.CustomerID)}>
                {deleteMutation.isPending ? <Spinner size="sm" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}