import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Monitor, Users, MapPin, CheckCircle, Plus, UserPlus, Download, Clock, Activity } from 'lucide-react';
import { AppData } from '../types';
import { StatusBadge } from './Badges';

interface Props {
  data: AppData;
  onNavigate: (m: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Active: '#10B981',
  Inactive: '#94A3B8',
  'Under Maintenance': '#F59E0B',
  Retired: '#EF4444',
};

const CATEGORY_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function Dashboard({ data, onNavigate }: Props) {
  const { assets, users, locations, assignments, activityLog, settings } = data;

  const stats = useMemo(() => ({
    totalAssets: assets.length,
    activeUsers: users.filter(u => u.status === 'Active').length,
    totalLocations: locations.filter(l => l.status === 'Active').length,
    assetsInUse: assignments.filter(a => a.status === 'Active Loan').length,
    totalValue: assets.reduce((s, a) => s + (a.purchasePrice || 0), 0),
    maintenanceCount: assets.filter(a => a.status === 'Under Maintenance').length,
  }), [assets, users, locations, assignments]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach(a => { map[a.category] = (map[a.category] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [assets]);

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach(a => { map[a.status] = (map[a.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const recentLogs = activityLog.slice(0, 10);

  const actionColors: Record<string, string> = {
    Added: 'bg-emerald-500',
    Updated: 'bg-indigo-500',
    Deleted: 'bg-red-500',
    Assigned: 'bg-violet-500',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Overview of {settings.companyName} IT assets</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('assets')} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={14} />Add Asset
          </button>
          <button onClick={() => onNavigate('users')} className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <UserPlus size={14} />Add User
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: stats.totalAssets, icon: Monitor, color: 'indigo', sub: formatCurrency(stats.totalValue, settings.currency) + ' total value' },
          { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'emerald', sub: `${users.length} total registered` },
          { label: 'Active Locations', value: stats.totalLocations, icon: MapPin, color: 'violet', sub: `${locations.length} total locations` },
          { label: 'Assets In Use', value: stats.assetsInUse, icon: CheckCircle, color: 'amber', sub: `${stats.maintenanceCount} under maintenance` },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-50`}>
                <Icon size={16} className={`text-${color}-600`} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-slate-900 mb-1">{value}</div>
            <div className="text-xs text-slate-400">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Bar Chart */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="text-slate-700 mb-4">Assets by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: 8 }}
                cursor={{ fill: '#F1F5F9' }}
              />
              <Bar dataKey="count" name="Assets" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="text-slate-700 mb-4">Asset Health</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name] || '#94A3B8' }} />
                  <span className="text-slate-600">{s.name}</span>
                </div>
                <span className="font-medium text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-indigo-600" />
            <h3 className="text-slate-700">Recent Activity</h3>
          </div>
          <span className="text-xs text-slate-400">Last 10 events</span>
        </div>
        <div className="space-y-2">
          {recentLogs.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">No activity yet</div>
          )}
          {recentLogs.map(log => (
            <div key={log.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
              <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${actionColors[log.action] || 'bg-slate-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700">
                  <span className="font-medium">{log.action}</span>{' '}
                  <span className="text-slate-500">{log.entity}</span>{' '}
                  <span className="font-mono text-xs text-indigo-600">{log.entityId}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{log.description}</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                <Clock size={11} />
                {timeAgo(log.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
