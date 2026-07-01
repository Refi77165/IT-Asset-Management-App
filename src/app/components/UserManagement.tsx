import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Upload, Eye, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, Department, UserRole, ActiveStatus, AppData } from '../types';
import { StatusBadge, DeptBadge } from './Badges';
import { Modal, ConfirmDialog } from './Modal';
import { showToast } from './Toast';

const EMPTY_USER: Omit<User, 'id' | 'dateAdded'> = {
  fullName: '', email: '', department: 'IT', role: 'Staff', status: 'Active', phone: '',
};

interface Props {
  data: AppData;
  onAdd: (u: Omit<User, 'id' | 'dateAdded'>) => void;
  onUpdate: (id: string, u: Partial<User>) => void;
  onDelete: (id: string) => void;
}

export function UserManagement({ data, onAdd, onUpdate, onDelete }: Props) {
  const { users, assets, settings } = data;
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState<keyof User>('fullName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_USER);

  const filtered = useMemo(() => {
    let list = users.filter(u => {
      const q = search.toLowerCase();
      if (q && !u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.id.toLowerCase().includes(q)) return false;
      if (filterDept && u.department !== filterDept) return false;
      if (filterStatus && u.status !== filterStatus) return false;
      return true;
    });
    list.sort((a, b) => {
      const av = String(a[sortKey]), bv = String(b[sortKey]);
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [users, search, filterDept, filterStatus, sortKey, sortDir]);

  function openAdd() { setForm(EMPTY_USER); setEditUser(null); setModalOpen(true); }
  function openEdit(u: User) { setForm({ fullName: u.fullName, email: u.email, department: u.department, role: u.role, status: u.status, phone: u.phone }); setEditUser(u); setModalOpen(true); }

  function handleSubmit() {
    if (!form.fullName.trim() || !form.email.trim()) { showToast('error', 'Validation Error', 'Name and email are required'); return; }
    if (editUser) { onUpdate(editUser.id, form); showToast('success', 'User Updated'); }
    else { onAdd(form); showToast('success', 'User Added'); }
    setModalOpen(false);
  }

  function handleDelete() {
    if (deleteId) { onDelete(deleteId); showToast('success', 'User Deleted'); setDeleteId(null); }
  }

  function exportXLSX() {
    const rows = filtered.map(u => ({ 'User ID': u.id, 'Full Name': u.fullName, 'Email': u.email, 'Department': u.department, 'Role': u.role, 'Status': u.status, 'Phone': u.phone, 'Date Added': u.dateAdded }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `users_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Export Complete', `${rows.length} users exported`);
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([{ 'Full Name': '', 'Email': '', 'Department': 'IT', 'Role': 'Staff', 'Status': 'Active', 'Phone': '' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'users_template.xlsx');
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
        let added = 0;
        rows.forEach(row => {
          if (row['Full Name'] && row['Email']) {
            onAdd({ fullName: row['Full Name'], email: row['Email'], department: (row['Department'] as Department) || 'IT', role: (row['Role'] as UserRole) || 'Staff', status: (row['Status'] as ActiveStatus) || 'Active', phone: row['Phone'] || '' });
            added++;
          }
        });
        showToast('success', 'Import Complete', `${added} users imported`);
      } catch { showToast('error', 'Import Failed', 'Invalid file format'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }

  function sortBy(key: keyof User) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const userAssets = viewUser ? assets.filter(a => a.assignedTo === viewUser.id) : [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">{users.length} users registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            <Download size={13} />Template
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
            <Upload size={13} />Import
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={exportXLSX} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            <Download size={13} />Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={13} />Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
          <option value="">All Departments</option>
          {settings.departments.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
          <option value="">All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {[['id', 'User ID'], ['fullName', 'Full Name'], ['email', 'Email'], ['department', 'Department'], ['role', 'Role'], ['status', 'Status'], ['dateAdded', 'Date Added']].map(([k, label]) => (
                  <th key={k} onClick={() => sortBy(k as keyof User)} className="px-4 py-3 text-left text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
                    {label} {sortKey === k && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <Users size={32} className="mx-auto text-slate-200 mb-2" />
                  <div className="text-sm text-slate-400">No users found</div>
                </td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{u.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{u.fullName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                  <td className="px-4 py-3"><DeptBadge>{u.department}</DeptBadge></td>
                  <td className="px-4 py-3"><StatusBadge>{u.role}</StatusBadge></td>
                  <td className="px-4 py-3"><StatusBadge>{u.status}</StatusBadge></td>
                  <td className="px-4 py-3 text-sm text-slate-500">{u.dateAdded}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewUser(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Eye size={14} /></button>
                      <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
          Showing {filtered.length} of {users.length} users
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal title={editUser ? 'Edit User' : 'Add New User'} subtitle={editUser?.id} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} submitLabel={editUser ? 'Update' : 'Add User'}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
              <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="Jane Smith" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="jane@company.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value as Department }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
                {settings.departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
                {['Admin', 'Staff', 'Viewer'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ActiveStatus }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewUser && (
        <Modal title={viewUser.fullName} subtitle={viewUser.id} onClose={() => setViewUser(null)} size="lg">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6">
            {[
              ['Email', viewUser.email], ['Phone', viewUser.phone], ['Department', viewUser.department],
              ['Role', viewUser.role], ['Status', viewUser.status], ['Date Added', viewUser.dateAdded],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-slate-400 mb-0.5">{k}</div>
                <div className="text-sm text-slate-800 font-medium">{v || '—'}</div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-slate-700 mb-3">Assigned Assets ({userAssets.length})</h4>
            {userAssets.length === 0 ? (
              <div className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">No assets assigned</div>
            ) : (
              <div className="space-y-2">
                {userAssets.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                    <span className="font-mono text-xs text-indigo-600">{a.id}</span>
                    <span className="text-slate-700">{a.name}</span>
                    <StatusBadge>{a.status}</StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete user ${deleteId}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
