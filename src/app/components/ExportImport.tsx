import { useState } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppData } from '../types';
import { showToast } from './Toast';

interface Props {
  data: AppData;
  onImport: (partial: Partial<Pick<AppData, 'users' | 'locations' | 'assets' | 'assignments'>>) => void;
}

interface ImportPreview {
  sheet: string;
  rows: Record<string, unknown>[];
}

export function ExportImport({ data, onImport }: Props) {
  const [preview, setPreview] = useState<ImportPreview[] | null>(null);
  const [importing, setImporting] = useState(false);

  function exportAll() {
    const wb = XLSX.utils.book_new();
    const userRows = data.users.map(u => ({ 'User ID': u.id, 'Full Name': u.fullName, 'Email': u.email, 'Department': u.department, 'Role': u.role, 'Status': u.status, 'Phone': u.phone, 'Date Added': u.dateAdded }));
    const locRows = data.locations.map(l => ({ 'Location ID': l.id, 'Name': l.name, 'Building': l.building, 'Floor': l.floor, 'City': l.city, 'PIC': l.pic, 'Status': l.status, 'Notes': l.notes }));
    const assetRows = data.assets.map(a => ({ 'Asset ID': a.id, 'Name': a.name, 'Category': a.category, 'Brand': a.brand, 'Model': a.model, 'Serial': a.serialNumber, 'Status': a.status, 'Condition': a.condition, 'Assigned To': a.assignedTo, 'Location': a.location, 'Purchase Date': a.purchaseDate, 'Price': a.purchasePrice, 'Warranty Until': a.warrantyUntil, 'Vendor': a.vendor, 'Notes': a.notes }));
    const asnRows = data.assignments.map(a => ({ 'ID': a.id, 'Asset ID': a.assetId, 'User ID': a.userId, 'Start Date': a.startDate, 'Return Date': a.returnDate, 'Status': a.status, 'Notes': a.notes }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(userRows), 'Users');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(locRows), 'Locations');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assetRows), 'Assets');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(asnRows), 'Assignments');
    XLSX.writeFile(wb, `itam_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Export Complete', 'All data exported to Excel');
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `itam_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('success', 'JSON Backup Created');
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const d = JSON.parse(evt.target?.result as string);
          if (d.users && d.assets) {
            onImport({ users: d.users, locations: d.locations, assets: d.assets, assignments: d.assignments });
            showToast('success', 'JSON Restore Complete');
          } else { showToast('error', 'Invalid JSON', 'File does not contain valid ITAM data'); }
        } catch { showToast('error', 'Invalid JSON file'); }
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const wb = XLSX.read(evt.target?.result, { type: 'binary' });
          const previews: ImportPreview[] = wb.SheetNames.map(name => ({
            sheet: name,
            rows: XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name]),
          }));
          setPreview(previews);
        } catch { showToast('error', 'Failed to parse Excel file'); }
      };
      reader.readAsBinaryString(file);
    }
    e.target.value = '';
  }

  function confirmImport() {
    if (!preview) return;
    setImporting(true);
    try {
      const updates: Partial<Pick<AppData, 'users' | 'locations' | 'assets' | 'assignments'>> = {};
      for (const { sheet, rows } of preview) {
        if (sheet.toLowerCase().includes('user')) {
          updates.users = rows.map((r: Record<string, unknown>, i) => ({ id: String(r['User ID'] || `USR-${100 + i}`), fullName: String(r['Full Name'] || ''), email: String(r['Email'] || ''), department: String(r['Department'] || 'IT') as never, role: String(r['Role'] || 'Staff') as never, status: String(r['Status'] || 'Active') as never, phone: String(r['Phone'] || ''), dateAdded: String(r['Date Added'] || new Date().toISOString().split('T')[0]) }));
        }
        if (sheet.toLowerCase().includes('location')) {
          updates.locations = rows.map((r: Record<string, unknown>, i) => ({ id: String(r['Location ID'] || `LOC-${100 + i}`), name: String(r['Name'] || ''), building: String(r['Building'] || ''), floor: String(r['Floor'] || ''), city: String(r['City'] || ''), pic: String(r['PIC'] || ''), status: String(r['Status'] || 'Active') as never, notes: String(r['Notes'] || '') }));
        }
        if (sheet.toLowerCase().includes('asset')) {
          updates.assets = rows.map((r: Record<string, unknown>, i) => ({ id: String(r['Asset ID'] || `AST-${100 + i}`), name: String(r['Name'] || ''), category: String(r['Category'] || 'Other') as never, brand: String(r['Brand'] || ''), model: String(r['Model'] || ''), serialNumber: String(r['Serial'] || ''), specification: String(r['Specification'] || ''), purchaseDate: String(r['Purchase Date'] || ''), purchasePrice: Number(r['Price'] || 0), warrantyUntil: String(r['Warranty Until'] || ''), vendor: String(r['Vendor'] || ''), status: String(r['Status'] || 'Active') as never, condition: String(r['Condition'] || 'Good') as never, assignedTo: String(r['Assigned To'] || ''), location: String(r['Location'] || ''), notes: String(r['Notes'] || ''), dateAdded: new Date().toISOString().split('T')[0], lastUpdated: new Date().toISOString().split('T')[0] }));
        }
      }
      onImport(updates);
      showToast('success', 'Import Complete', `Data imported successfully`);
      setPreview(null);
    } catch { showToast('error', 'Import failed'); }
    setImporting(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-slate-900">Export & Import</h1>
        <p className="text-xs text-slate-500 mt-0.5">Backup, export, and restore your data</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-slate-700 flex items-center gap-2"><Download size={16} className="text-indigo-600" />Export Data</h3>
          <div className="space-y-3">
            <button onClick={exportAll} className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-left">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                <FileSpreadsheet size={18} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">Export All to Excel</div>
                <div className="text-xs text-slate-400">All modules in one .xlsx file (4 sheets)</div>
              </div>
            </button>
            {[
              { label: 'Export Users', desc: `${data.users.length} users`, fn: () => { const ws = XLSX.utils.json_to_sheet(data.users.map(u => ({ 'User ID': u.id, 'Full Name': u.fullName, 'Email': u.email, 'Department': u.department, 'Role': u.role, 'Status': u.status, 'Phone': u.phone }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Users'); XLSX.writeFile(wb, `users_${new Date().toISOString().split('T')[0]}.xlsx`); showToast('success', 'Users exported'); } },
              { label: 'Export Locations', desc: `${data.locations.length} locations`, fn: () => { const ws = XLSX.utils.json_to_sheet(data.locations.map(l => ({ 'Location ID': l.id, 'Name': l.name, 'Building': l.building, 'Floor': l.floor, 'City': l.city, 'Status': l.status }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Locations'); XLSX.writeFile(wb, `locations_${new Date().toISOString().split('T')[0]}.xlsx`); showToast('success', 'Locations exported'); } },
              { label: 'Export Assets', desc: `${data.assets.length} assets`, fn: () => { const ws = XLSX.utils.json_to_sheet(data.assets.map(a => ({ 'Asset ID': a.id, 'Name': a.name, 'Category': a.category, 'Brand': a.brand, 'Model': a.model, 'Status': a.status, 'Condition': a.condition }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Assets'); XLSX.writeFile(wb, `assets_${new Date().toISOString().split('T')[0]}.xlsx`); showToast('success', 'Assets exported'); } },
            ].map(({ label, desc, fn }) => (
              <button key={label} onClick={fn} className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={18} className="text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{label}</div>
                  <div className="text-xs text-slate-400">{desc}</div>
                </div>
              </button>
            ))}
            <button onClick={exportJSON} className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg hover:bg-amber-50 hover:border-amber-200 transition-colors text-left">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                <FileJson size={18} className="text-amber-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">JSON Backup</div>
                <div className="text-xs text-slate-400">Full data backup as .json file</div>
              </div>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-slate-700 flex items-center gap-2"><Upload size={16} className="text-indigo-600" />Import Data</h3>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors">
            <Upload size={28} className="mx-auto text-slate-300 mb-3" />
            <div className="text-sm font-medium text-slate-700 mb-1">Drop file here or click to browse</div>
            <div className="text-xs text-slate-400 mb-4">Supports .xlsx, .xls, and .json files</div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
              <Upload size={14} />Browse File
              <input type="file" accept=".xlsx,.xls,.json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {preview && (
            <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
                <AlertCircle size={16} />Preview — {preview.reduce((s, p) => s + p.rows.length, 0)} rows across {preview.length} sheet(s)
              </div>
              {preview.map(p => (
                <div key={p.sheet} className="text-xs text-indigo-600 flex items-center gap-2">
                  <CheckCircle size={12} />Sheet "{p.sheet}": {p.rows.length} rows
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setPreview(null)} className="px-3 py-1.5 text-xs border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-100">Cancel</button>
                <button onClick={confirmImport} disabled={importing} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {importing ? 'Importing...' : 'Confirm Import'}
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-medium text-slate-600 mb-3">Download Templates</div>
            {[
              { label: 'Users Template', cols: ['Full Name', 'Email', 'Department', 'Role', 'Status', 'Phone'] },
              { label: 'Locations Template', cols: ['Name', 'Building', 'Floor', 'City', 'PIC', 'Status', 'Notes'] },
              { label: 'Assets Template', cols: ['Name', 'Category', 'Brand', 'Model', 'Serial', 'Status', 'Condition', 'Price'] },
            ].map(({ label, cols }) => (
              <button key={label} onClick={() => {
                const ws = XLSX.utils.json_to_sheet([cols.reduce<Record<string, string>>((acc, c) => ({ ...acc, [c]: '' }), {})]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, label.split(' ')[0]);
                XLSX.writeFile(wb, `${label.toLowerCase().replace(' ', '_')}.xlsx`);
              }} className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 py-1 hover:underline">
                <Download size={12} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
