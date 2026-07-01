import { useState, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Download, Upload, QrCode, Printer, Monitor, CheckSquare, Square } from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import { Asset, AssetStatus, AssetCondition, AssetCategory, AppData } from '../types';
import { StatusBadge, CategoryBadge } from './Badges';
import { Modal, ConfirmDialog } from './Modal';
import { showToast } from './Toast';

const EMPTY: Omit<Asset, 'id' | 'dateAdded' | 'lastUpdated'> = {
  name: '', category: 'Laptop', brand: '', model: '', serialNumber: '', specification: '',
  purchaseDate: '', purchasePrice: 0, warrantyUntil: '', vendor: '', status: 'Active',
  condition: 'Good', assignedTo: '', location: '', notes: '',
};

interface Props {
  data: AppData;
  onAdd: (a: Omit<Asset, 'id' | 'dateAdded' | 'lastUpdated'>) => void;
  onUpdate: (id: string, a: Partial<Asset>) => void;
  onDelete: (id: string) => void;
}

type Step = 1 | 2 | 3;

export function AssetManagement({ data, onAdd, onUpdate, onDelete }: Props) {
  const { assets, users, locations, settings } = data;
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLoc, setFilterLoc] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState(EMPTY);
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => assets.filter(a => {
    const q = search.toLowerCase();
    if (q && !a.name.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q) && !a.brand.toLowerCase().includes(q) && !a.serialNumber.toLowerCase().includes(q)) return false;
    if (filterCat && a.category !== filterCat) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterLoc && a.location !== filterLoc) return false;
    if (filterUser && a.assignedTo !== filterUser) return false;
    return true;
  }), [assets, search, filterCat, filterStatus, filterLoc, filterUser]);

  function getUserName(id: string) { return users.find(u => u.id === id)?.fullName || '—'; }
  function getLocName(id: string) { return locations.find(l => l.id === id)?.name || '—'; }

  function openAdd() { setForm(EMPTY); setEditAsset(null); setStep(1); setModalOpen(true); }
  function openEdit(a: Asset) {
    setForm({ name: a.name, category: a.category, brand: a.brand, model: a.model, serialNumber: a.serialNumber, specification: a.specification, purchaseDate: a.purchaseDate, purchasePrice: a.purchasePrice, warrantyUntil: a.warrantyUntil, vendor: a.vendor, status: a.status, condition: a.condition, assignedTo: a.assignedTo, location: a.location, notes: a.notes });
    setEditAsset(a); setStep(1); setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) { showToast('error', 'Validation Error', 'Asset name is required'); return; }
    if (editAsset) { onUpdate(editAsset.id, form); showToast('success', 'Asset Updated'); }
    else { onAdd(form); showToast('success', 'Asset Added'); }
    setModalOpen(false);
  }

  function handleDelete() {
    if (deleteId) { onDelete(deleteId); showToast('success', 'Asset Deleted'); setDeleteId(null); }
  }

  function handleBulkDelete() {
    selected.forEach(id => onDelete(id));
    showToast('success', 'Bulk Delete', `${selected.size} assets deleted`);
    setSelected(new Set()); setBulkDelete(false);
  }

  function toggleSelect(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(a => a.id)));
  }

  function exportSelected() {
    const list = selected.size > 0 ? assets.filter(a => selected.has(a.id)) : filtered;
    const rows = list.map(a => ({ 'Asset ID': a.id, 'Name': a.name, 'Category': a.category, 'Brand': a.brand, 'Model': a.model, 'Serial': a.serialNumber, 'Status': a.status, 'Condition': a.condition, 'Assigned To': getUserName(a.assignedTo), 'Location': getLocName(a.location), 'Purchase Date': a.purchaseDate, 'Price': a.purchasePrice, 'Warranty Until': a.warrantyUntil, 'Vendor': a.vendor }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assets');
    XLSX.writeFile(wb, `assets_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Export Complete', `${rows.length} assets exported`);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
        let added = 0;
        rows.forEach(row => {
          if (row['Name']) {
            onAdd({ name: row['Name'], category: (row['Category'] as AssetCategory) || 'Other', brand: row['Brand'] || '', model: row['Model'] || '', serialNumber: row['Serial'] || '', specification: row['Specification'] || '', purchaseDate: row['Purchase Date'] || '', purchasePrice: parseFloat(row['Price'] || '0') || 0, warrantyUntil: row['Warranty Until'] || '', vendor: row['Vendor'] || '', status: (row['Status'] as AssetStatus) || 'Active', condition: (row['Condition'] as AssetCondition) || 'Good', assignedTo: '', location: '', notes: row['Notes'] || '' });
            added++;
          }
        });
        showToast('success', 'Import Complete', `${added} assets imported`);
      } catch { showToast('error', 'Import Failed', 'Invalid file format'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }

  function printLabel() {
    if (!qrAsset) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Asset Label</title><style>body{font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f0f0f0}.label{background:white;border:2px solid #333;padding:16px;width:200px;text-align:center}.id{font-size:14px;font-weight:bold;margin:8px 0}.name{font-size:11px;color:#666;margin:4px 0;word-break:break-word}svg{display:block;margin:0 auto}</style></head><body><div class="label"><div id="qr"></div><div class="id">${qrAsset.id}</div><div class="name">${qrAsset.name}</div><div class="name">${qrAsset.brand} ${qrAsset.model}</div></div><script>window.onload=function(){window.print();window.close()}<\/script></body></html>`);
    w.document.close();
  }

  const stepTitles: Record<Step, string> = { 1: 'Basic Information', 2: 'Purchase & Warranty', 3: 'Assignment & Status' };

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";
  const labelCls = "block text-xs font-medium text-slate-700 mb-1";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Asset Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">{assets.length} assets registered</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={() => setBulkDelete(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100">
              <Trash2 size={13} />Delete ({selected.size})
            </button>
          )}
          <button onClick={exportSelected} className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            <Download size={13} />{selected.size > 0 ? `Export (${selected.size})` : 'Export'}
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
            <Upload size={13} />Import
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={13} />Add Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
          <option value="">All Categories</option>
          {settings.categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
          <option value="">All Status</option>
          {['Active', 'Inactive', 'Under Maintenance', 'Retired'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
          <option value="">All Locations</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
          <option value="">All Users</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-3 py-3 w-8">
                  <button onClick={selectAll} className="text-slate-400 hover:text-indigo-600">
                    {selected.size > 0 && selected.size === filtered.length ? <CheckSquare size={15} className="text-indigo-600" /> : <Square size={15} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Asset ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Brand / Model</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Condition</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Location</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-16 text-center">
                  <Monitor size={32} className="mx-auto text-slate-200 mb-2" />
                  <div className="text-sm text-slate-400">No assets found</div>
                </td></tr>
              )}
              {filtered.map(a => (
                <tr key={a.id} className={`border-b border-slate-50 transition-colors ${selected.has(a.id) ? 'bg-indigo-50/50' : 'hover:bg-indigo-50/20'}`}>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleSelect(a.id)} className="text-slate-400 hover:text-indigo-600">
                      {selected.has(a.id) ? <CheckSquare size={15} className="text-indigo-600" /> : <Square size={15} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 whitespace-nowrap">{a.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap max-w-[160px] truncate">{a.name}</td>
                  <td className="px-4 py-3"><CategoryBadge>{a.category}</CategoryBadge></td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{a.brand} {a.model}</td>
                  <td className="px-4 py-3"><StatusBadge>{a.status}</StatusBadge></td>
                  <td className="px-4 py-3"><StatusBadge>{a.condition}</StatusBadge></td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{getUserName(a.assignedTo)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{getLocName(a.location)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewAsset(a)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Eye size={14} /></button>
                      <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => setQrAsset(a)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"><QrCode size={14} /></button>
                      <button onClick={() => setDeleteId(a.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
          {selected.size > 0 && <span className="text-indigo-600 font-medium">{selected.size} selected · </span>}
          Showing {filtered.length} of {assets.length} assets
        </div>
      </div>

      {/* Multi-Step Add/Edit Modal */}
      {modalOpen && (
        <Modal
          title={editAsset ? `Edit Asset${editAsset ? ' — ' + editAsset.id : ''}` : 'Add New Asset'}
          subtitle={`Step ${step} of 3: ${stepTitles[step]}`}
          onClose={() => setModalOpen(false)}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-1.5">
                {([1, 2, 3] as Step[]).map(s => (
                  <button key={s} onClick={() => setStep(s)} className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${step === s ? 'bg-indigo-600 text-white' : step > s ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{s}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                {step > 1 && <button onClick={() => setStep(s => (s - 1) as Step)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Back</button>}
                {step < 3 ? (
                  <button onClick={() => setStep(s => (s + 1) as Step)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Next</button>
                ) : (
                  <button onClick={handleSubmit} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editAsset ? 'Update' : 'Add Asset'}</button>
                )}
              </div>
            </div>
          }
        >
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Asset Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="MacBook Pro 16&quot;" />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as AssetCategory }))} className={inputCls}>
                  {settings.categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Brand</label>
                <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className={inputCls} placeholder="Apple" />
              </div>
              <div>
                <label className={labelCls}>Model</label>
                <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className={inputCls} placeholder="MacBook Pro M3 Max" />
              </div>
              <div>
                <label className={labelCls}>Serial Number</label>
                <input value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} className={inputCls} placeholder="SN-XXXXXXXX" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Specification</label>
                <textarea value={form.specification} onChange={e => setForm(f => ({ ...f, specification: e.target.value }))} rows={3} className={`${inputCls} resize-none`} placeholder="Detailed hardware spec..." />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Purchase Date</label>
                <input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Purchase Price ({settings.currency})</label>
                <input type="number" value={form.purchasePrice || ''} onChange={e => setForm(f => ({ ...f, purchasePrice: parseFloat(e.target.value) || 0 }))} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>Warranty Until</label>
                <input type="date" value={form.warrantyUntil} onChange={e => setForm(f => ({ ...f, warrantyUntil: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Vendor / Supplier</label>
                <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} className={inputCls} placeholder="Apple Store" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AssetStatus }))} className={inputCls}>
                  {['Active', 'Inactive', 'Under Maintenance', 'Retired'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Condition</label>
                <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as AssetCondition }))} className={inputCls}>
                  {['Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Assigned To</label>
                <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} className={inputCls}>
                  <option value="">— Unassigned —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls}>
                  <option value="">— No Location —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* View Modal */}
      {viewAsset && (
        <Modal title={viewAsset.name} subtitle={viewAsset.id} onClose={() => setViewAsset(null)} size="xl">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[['Category', viewAsset.category], ['Brand', viewAsset.brand], ['Model', viewAsset.model], ['Serial Number', viewAsset.serialNumber]].map(([k, v]) => (
                    <div key={k}><div className="text-xs text-slate-400 mb-0.5">{k}</div><div className="text-sm font-medium text-slate-800">{v || '—'}</div></div>
                  ))}
                  {viewAsset.specification && <div className="col-span-2">
                    <div className="text-xs text-slate-400 mb-0.5">Specification</div>
                    <div className="text-sm text-slate-700 leading-relaxed">{viewAsset.specification}</div>
                  </div>}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Purchase & Warranty</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[['Purchase Date', viewAsset.purchaseDate], ['Purchase Price', viewAsset.purchasePrice ? `${data.settings.currency} ${viewAsset.purchasePrice.toLocaleString()}` : '—'], ['Warranty Until', viewAsset.warrantyUntil], ['Vendor', viewAsset.vendor]].map(([k, v]) => (
                    <div key={k}><div className="text-xs text-slate-400 mb-0.5">{k}</div><div className="text-sm font-medium text-slate-800">{v || '—'}</div></div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Assignment</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[['Status', viewAsset.status], ['Condition', viewAsset.condition], ['Assigned To', getUserName(viewAsset.assignedTo)], ['Location', getLocName(viewAsset.location)], ['Date Added', viewAsset.dateAdded], ['Last Updated', viewAsset.lastUpdated]].map(([k, v]) => (
                    <div key={k}><div className="text-xs text-slate-400 mb-0.5">{k}</div><div className="text-sm font-medium text-slate-800">{v || '—'}</div></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <QRCodeSVG value={viewAsset.id} size={120} />
              </div>
              <div className="text-center">
                <div className="font-mono text-sm font-bold text-slate-800">{viewAsset.id}</div>
                <div className="text-xs text-slate-400 mt-0.5">Asset QR Code</div>
              </div>
              <button onClick={() => { setQrAsset(viewAsset); }} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                <Printer size={13} />Print Label
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* QR Modal */}
      {qrAsset && (
        <Modal title="Asset Label" subtitle={qrAsset.id} onClose={() => setQrAsset(null)} size="sm"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <button onClick={() => setQrAsset(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Close</button>
              <button onClick={printLabel} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Printer size={14} />Print
              </button>
            </div>
          }
        >
          <div ref={printRef} className="flex flex-col items-center gap-4 py-4">
            <div className="border-2 border-slate-800 rounded-lg p-4 w-[200px] text-center">
              <QRCodeSVG value={qrAsset.id} size={120} className="mx-auto" />
              <div className="font-mono text-sm font-bold mt-2">{qrAsset.id}</div>
              <div className="text-xs text-slate-600 mt-1">{qrAsset.name}</div>
              <div className="text-xs text-slate-400">{qrAsset.brand} {qrAsset.model}</div>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && <ConfirmDialog title="Delete Asset" message={`Delete asset ${deleteId}? This action cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {bulkDelete && <ConfirmDialog title="Bulk Delete" message={`Delete ${selected.size} selected assets? This action cannot be undone.`} onConfirm={handleBulkDelete} onCancel={() => setBulkDelete(false)} />}
    </div>
  );
}
