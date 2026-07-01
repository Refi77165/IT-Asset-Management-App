import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Download, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Location, ActiveStatus, AppData } from '../types';
import { StatusBadge } from './Badges';
import { Modal, ConfirmDialog } from './Modal';
import { showToast } from './Toast';

const EMPTY: Omit<Location, 'id'> = { name: '', building: '', floor: '', city: '', pic: '', status: 'Active', notes: '' };

interface Props {
  data: AppData;
  onAdd: (l: Omit<Location, 'id'>) => void;
  onUpdate: (id: string, l: Partial<Location>) => void;
  onDelete: (id: string) => void;
}

export function LocationManagement({ data, onAdd, onUpdate, onDelete }: Props) {
  const { locations, users, assets } = data;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editLoc, setEditLoc] = useState<Location | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewLoc, setViewLoc] = useState<Location | null>(null);
  const [form, setForm] = useState(EMPTY);

  const filtered = useMemo(() => locations.filter(l => {
    const q = search.toLowerCase();
    if (q && !l.name.toLowerCase().includes(q) && !l.city.toLowerCase().includes(q) && !l.id.toLowerCase().includes(q)) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    return true;
  }), [locations, search, filterStatus]);

  function getUserName(id: string) { return users.find(u => u.id === id)?.fullName || id || '—'; }

  function openAdd() { setForm(EMPTY); setEditLoc(null); setModalOpen(true); }
  function openEdit(l: Location) {
    setForm({ name: l.name, building: l.building, floor: l.floor, city: l.city, pic: l.pic, status: l.status, notes: l.notes });
    setEditLoc(l); setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) { showToast('error', 'Validation Error', 'Location name is required'); return; }
    if (editLoc) { onUpdate(editLoc.id, form); showToast('success', 'Location Updated'); }
    else { onAdd(form); showToast('success', 'Location Added'); }
    setModalOpen(false);
  }

  function handleDelete() {
    if (deleteId) { onDelete(deleteId); showToast('success', 'Location Deleted'); setDeleteId(null); }
  }

  function exportXLSX() {
    const rows = filtered.map(l => ({ 'Location ID': l.id, 'Name': l.name, 'Building': l.building, 'Floor': l.floor, 'City': l.city, 'PIC': getUserName(l.pic), 'Status': l.status, 'Notes': l.notes }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Locations');
    XLSX.writeFile(wb, `locations_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Export Complete', `${rows.length} locations exported`);
  }

  const locAssets = viewLoc ? assets.filter(a => a.location === viewLoc.id) : [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Location Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">{locations.length} locations registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportXLSX} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            <Download size={13} />Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={13} />Add Location
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search locations..." className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
          <option value="">All Status</option>
          <option>Active</option><option>Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Location ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Building / Floor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Person In Charge</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Assets</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <MapPin size={32} className="mx-auto text-slate-200 mb-2" />
                  <div className="text-sm text-slate-400">No locations found</div>
                </td></tr>
              )}
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{l.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{l.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.building}{l.floor ? `, ${l.floor}` : ''}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{l.city}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getUserName(l.pic)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{assets.filter(a => a.location === l.id).length}</td>
                  <td className="px-4 py-3"><StatusBadge>{l.status}</StatusBadge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewLoc(l)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Eye size={14} /></button>
                      <button onClick={() => openEdit(l)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteId(l.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
          Showing {filtered.length} of {locations.length} locations
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal title={editLoc ? 'Edit Location' : 'Add Location'} subtitle={editLoc?.id} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} submitLabel={editLoc ? 'Update' : 'Add Location'}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Location Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="Head Office" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Building</label>
              <input value={form.building} onChange={e => setForm(f => ({ ...f, building: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="Tower A" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Floor</label>
              <input value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="12th Floor" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="New York" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Person In Charge</label>
              <select value={form.pic} onChange={e => setForm(f => ({ ...f, pic: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
                <option value="">— Select User —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ActiveStatus }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none" placeholder="Additional notes..." />
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewLoc && (
        <Modal title={viewLoc.name} subtitle={viewLoc.id} onClose={() => setViewLoc(null)} size="lg">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6">
            {[
              ['Building', viewLoc.building], ['Floor', viewLoc.floor], ['City', viewLoc.city],
              ['Person In Charge', getUserName(viewLoc.pic)], ['Status', viewLoc.status],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-slate-400 mb-0.5">{k}</div>
                <div className="text-sm text-slate-800 font-medium">{v || '—'}</div>
              </div>
            ))}
            {viewLoc.notes && <div className="col-span-2">
              <div className="text-xs text-slate-400 mb-0.5">Notes</div>
              <div className="text-sm text-slate-800">{viewLoc.notes}</div>
            </div>}
          </div>
          <h4 className="text-slate-700 mb-3">Assets at this Location ({locAssets.length})</h4>
          {locAssets.length === 0 ? (
            <div className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">No assets at this location</div>
          ) : (
            <div className="space-y-2">
              {locAssets.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                  <span className="font-mono text-xs text-indigo-600">{a.id}</span>
                  <span className="text-slate-700">{a.name}</span>
                  <StatusBadge>{a.status}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Location" message={`Delete location ${deleteId}?`} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}
