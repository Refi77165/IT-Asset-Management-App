import { useState } from 'react';
import {
  LayoutDashboard, Users, MapPin, Monitor, RefreshCw,
  Cloud, Settings as SettingsIcon, ChevronRight, Database,
  Menu, X
} from 'lucide-react';
import { useAppStore } from './store';
import { NavModule } from './types';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { LocationManagement } from './components/LocationManagement';
import { AssetManagement } from './components/AssetManagement';
import { AssignmentLog } from './components/AssignmentLog';
import { GoogleSync } from './components/GoogleSync';
import { Settings } from './components/Settings';
import { ExportImport } from './components/ExportImport';
import { ToastContainer } from './components/Toast';

type ExtendedModule = NavModule | 'export';

const NAV_ITEMS = [
  { id: 'dashboard' as ExtendedModule, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users' as ExtendedModule, label: 'User Management', icon: Users },
  { id: 'locations' as ExtendedModule, label: 'Locations', icon: MapPin },
  { id: 'assets' as ExtendedModule, label: 'Asset Management', icon: Monitor },
  { id: 'assignments' as ExtendedModule, label: 'Assignment Log', icon: RefreshCw },
  { id: 'export' as ExtendedModule, label: 'Export / Import', icon: Database },
  { id: 'google' as ExtendedModule, label: 'Google Sync', icon: Cloud },
  { id: 'settings' as ExtendedModule, label: 'Settings', icon: SettingsIcon },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<ExtendedModule>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const store = useAppStore();
  const { data } = store;

  function renderModule() {
    switch (activeModule) {
      case 'dashboard': return <Dashboard data={data} onNavigate={(m) => setActiveModule(m as ExtendedModule)} />;
      case 'users': return <UserManagement data={data} onAdd={store.addUser} onUpdate={store.updateUser} onDelete={store.deleteUser} />;
      case 'locations': return <LocationManagement data={data} onAdd={store.addLocation} onUpdate={store.updateLocation} onDelete={store.deleteLocation} />;
      case 'assets': return <AssetManagement data={data} onAdd={store.addAsset} onUpdate={store.updateAsset} onDelete={store.deleteAsset} />;
      case 'assignments': return <AssignmentLog data={data} onAdd={store.addAssignment} onUpdate={store.updateAssignment} onDelete={store.deleteAssignment} />;
      case 'export': return <ExportImport data={data} onImport={store.importData} />;
      case 'google': return <GoogleSync data={data} onUpdateSettings={store.updateSettings} />;
      case 'settings': return <Settings settings={data.settings} onUpdate={store.updateSettings} onReset={store.resetAllData} />;
      default: return null;
    }
  }

  const activeNav = NAV_ITEMS.find(n => n.id === activeModule);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-200 overflow-hidden"
        style={{
          width: sidebarOpen ? 240 : 64,
          background: 'linear-gradient(180deg, #1b4b23 0%, #312e81 100%)',
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-indigo-800/40 shrink-0">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
                  {data.settings.logoUrl
                    ? <img src={data.settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    : <Monitor size={15} className="text-white" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate leading-tight">{data.settings.appName}</div>
                  <div className="text-xs text-indigo-300 truncate leading-tight">{data.settings.companyName}</div>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-indigo-400 hover:text-white transition-colors shrink-0 ml-2">
                <Menu size={16} />
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center mx-auto">
              <Monitor size={15} className="text-white" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeModule === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveModule(id); if (!sidebarOpen) setSidebarOpen(true); }}
                title={!sidebarOpen ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive ? 'bg-indigo-500/30 text-white' : 'text-indigo-200 hover:bg-indigo-500/15 hover:text-white'
                } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
              >
                <Icon size={16} className={isActive ? 'text-indigo-300 shrink-0' : 'shrink-0'} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left whitespace-nowrap">{label}</span>
                    {isActive && <ChevronRight size={14} className="text-indigo-400 shrink-0" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-3 border-t border-indigo-800/40 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${data.settings.googleConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span className="text-xs text-indigo-300 truncate">{data.settings.googleConnected ? 'Google Connected' : 'Google Offline'}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className={`w-2.5 h-2.5 rounded-full ${data.settings.googleConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} title={data.settings.googleConnected ? 'Google Connected' : 'Google Offline'} />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">IT Asset Manager</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-sm font-medium text-slate-700">{activeNav?.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-3 text-xs text-slate-500">
              <span>{data.assets.length} assets</span>
              <span className="text-slate-200">|</span>
              <span>{data.users.length} users</span>
              <span className="text-slate-200">|</span>
              <span>{data.assignments.filter(a => a.status === 'Active Loan').length} loans</span>
            </div>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-indigo-600">IT</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {renderModule()}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
