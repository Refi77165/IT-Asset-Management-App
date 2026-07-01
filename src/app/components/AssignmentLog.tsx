import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Assignment, AssignmentStatus, AppData } from '../types';
import { StatusBadge } from './Badges';
import { Modal, ConfirmDialog } from './Modal';
import { showToast } from './Toast';

const EMPTY: Omit<Assignment, 'id'> = { assetId: '', userId: '', startDate: '', returnDate: '', notes: '', status: 'Active Loan' };

interface Props {
  data: AppData;
  onAdd: (a: Omit<Assignment, 'id'>) => void;
  onUpdate: (id: string, a: Partial<Assignment>) => void;
  onDelete: (id: string) => void;
}

export function AssignmentLog({ data, onAdd, onUpdate, onDelete }: Props) {
  const { assignments, assets, users } = data;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterAsset, setFilterAsset] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Assignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const filtered = useMemo(() => assignments.filter(a => {
    const asset = assets.find(x => x.id === a.assetId);
    const user = users.find(x => x.id === a.userId);
    const q = search.toLowerCase();
    if (q && !a.id.toLowerCase().includes(q) && !(asset?.name || '').toLowerCase().includes(q) && !(user?.fullName || '').toLowerCase().includes(q)) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterUser && a.userId !== filterUser) return false;
    if (filterAsset && a.assetId !== filterAsset) return false;
    return true;
  }), [assignments, assets, users, search, filterStatus, filterUser, filterAsset]);

  function getAssetName(id: string) { const a = assets.find(x => x.id === id); return a ? `${a.name} (${a.id})` : id; }
  function getUserName(id: string) { return users.find(u => u.id === id)?.fullName || id; }

  function openAdd() { setForm({ ...EMPTY, startDate: new Date().toISOString().split('T')[0] }); setEditItem(null); setModalOpen(true); }
  function openEdit(a: Assignment) { setForm({ assetId: a.assetId, userId: a.userId, startDate: a.startDate, returnDate: a.returnDate, notes: a.notes, status: a.status }); setEditItem(a); setModalOpen(true); }

  function handleSubmit() {
    if (!form.assetId || !form.userId) { showToast('error', 'Validation Error', 'Asset and user are required'); return; }
    if (editItem) { onUpdate(editItem.id, form); showToast('success', 'Assignment Updated'); }
    else { onAdd(form); showToast('success', 'Assignment Created'); }
    setModalOpen(false);
  }

  function handleReturn(a: Assignment) {
    onUpdate(a.id, { status: 'Returned', returnDate: new Date().toISOString().split('T')[0] });
    showToast('success', 'Asset Returned', `${getAssetName(a.assetId)} marked as returned`);
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";
  const labelCls = "block text-xs font-medium text-slate-700 mb-1";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Assignment Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">{assignments.filter(a => a.status === 'Active Loan').length} active loans</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={13} />New Assignment
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assignments..." className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="">All Status</option>
          <option>Active Loan</option><option>Returned</option>
        </select>
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="">All Users</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
        <select value={filterAsset} onChange={e => setFilterAsset(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="">All Assets</option>
          {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Return Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Notes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <RefreshCw size={32} className="mx-auto text-slate-200 mb-2" />
                  <div className="text-sm text-slate-400">No assignments found</div>
                </td></tr>
              )}
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-indigo-50/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{a.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{getAssetName(a.assetId)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{getUserName(a.userId)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.startDate || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.returnDate || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge>{a.status}</StatusBadge></td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-[160px] truncate">{a.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {a.status === 'Active Loan' && (
                        <button onClick={() => handleReturn(a)} title="Mark as Returned" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"><RefreshCw size={14} /></button>
                      )}
                      <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteId(a.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
          Showing {filtered.length} of {assignments.length} assignments
        </div>
      </div>

      {modalOpen && (
        <Modal title={editItem ? 'Edit Assignment' : 'New Assignment'} subtitle={editItem?.id} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} submitLabel={editItem ? 'Update' : 'Create'}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Asset *</label>
              <select value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))} className={inputCls}>
                <option value="">— Select Asset —</option>
                {assets.filter(a => a.status === 'Active').map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>User *</label>
              <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} className={inputCls}>
                <option value="">— Select User —</option>
                {users.filter(u => u.status === 'Active').map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Return Date (optional)</label>
                <input type="date" value={form.returnDate} onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AssignmentStatus }))} className={inputCls}>
                <option>Active Loan</option><option>Returned</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Assignment details..." />
            </div>
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog title="Delete Assignment" message={`Delete assignment ${deleteId}?`} onConfirm={() => { onDelete(deleteId); showToast('success', 'Assignment Deleted'); setDeleteId(null); }} onCancel={() => setDeleteId(null)} />}
    </div>
  );
}
