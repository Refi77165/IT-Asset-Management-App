import { useState } from 'react';
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../types';
import { ConfirmDialog } from './Modal';
import { showToast } from './Toast';

interface Props {
  settings: AppSettings;
  onUpdate: (s: Partial<AppSettings>) => void;
  onReset: () => void;
}

export function Settings({ settings, onUpdate, onReset }: Props) {
  const [form, setForm] = useState({ ...settings });
  const [newCat, setNewCat] = useState('');
  const [newDept, setNewDept] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  function save() {
    onUpdate(form);
    showToast('success', 'Settings Saved');
  }

  function addCategory() {
    if (!newCat.trim() || form.categories.includes(newCat.trim())) return;
    setForm(f => ({ ...f, categories: [...f.categories, newCat.trim()] }));
    setNewCat('');
  }

  function removeCategory(cat: string) {
    setForm(f => ({ ...f, categories: f.categories.filter(c => c !== cat) }));
  }

  function addDept() {
    if (!newDept.trim() || form.departments.includes(newDept.trim())) return;
    setForm(f => ({ ...f, departments: [...f.departments, newDept.trim()] }));
    setNewDept('');
  }

  function removeDept(dept: string) {
    setForm(f => ({ ...f, departments: f.departments.filter(d => d !== dept) }));
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";
  const labelCls = "block text-xs font-medium text-slate-700 mb-1";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure your IT Asset Manager</p>
        </div>
        <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
          <Save size={14} />Save Settings
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-slate-700">General</h3>
          <div>
            <label className={labelCls}>App Name</label>
            <input value={form.appName} onChange={e => setForm(f => ({ ...f, appName: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Company Name</label>
            <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Default Currency</label>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inputCls}>
              {['USD', 'EUR', 'GBP', 'IDR', 'JPY', 'SGD', 'AUD', 'CAD'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ID Prefixes */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-slate-700">ID Prefixes</h3>
          <div>
            <label className={labelCls}>Asset Prefix</label>
            <input value={form.assetPrefix} onChange={e => setForm(f => ({ ...f, assetPrefix: e.target.value }))} className={`${inputCls} font-mono`} placeholder="AST-" />
          </div>
          <div>
            <label className={labelCls}>User Prefix</label>
            <input value={form.userPrefix} onChange={e => setForm(f => ({ ...f, userPrefix: e.target.value }))} className={`${inputCls} font-mono`} placeholder="USR-" />
          </div>
          <div>
            <label className={labelCls}>Location Prefix</label>
            <input value={form.locationPrefix} onChange={e => setForm(f => ({ ...f, locationPrefix: e.target.value }))} className={`${inputCls} font-mono`} placeholder="LOC-" />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-slate-700">Asset Categories</h3>
          <div className="flex gap-2">
            <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="New category..." />
            <button onClick={addCategory} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {form.categories.map(cat => (
              <div key={cat} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">{cat}</span>
                <button onClick={() => removeCategory(cat)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-slate-700">Departments</h3>
          <div className="flex gap-2">
            <input value={newDept} onChange={e => setNewDept(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDept()} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="New department..." />
            <button onClick={addDept} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {form.departments.map(dept => (
              <div key={dept} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-700">{dept}</span>
                <button onClick={() => removeDept(dept)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-100 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-700">Danger Zone</h3>
            <p className="text-xs text-red-400 mt-0.5">These actions are irreversible. Please proceed with caution.</p>
          </div>
        </div>
        <button onClick={() => setConfirmReset(true)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Reset All Data to Sample
        </button>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <h3 className="text-slate-700 mb-3">About</h3>
        <div className="space-y-1.5 text-sm text-slate-600">
          <div className="flex justify-between"><span className="text-slate-400">Application</span><span className="font-medium">{form.appName}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Version</span><span className="font-mono text-xs">1.0.0</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Storage</span><span>LocalStorage</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Built with</span><span>React + Tailwind CSS</span></div>
        </div>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset All Data"
          message="This will permanently delete all your data and restore to sample data. This action cannot be undone."
          confirmLabel="Reset Everything"
          onConfirm={() => { onReset(); showToast('success', 'Data Reset', 'All data restored to sample'); setConfirmReset(false); }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
