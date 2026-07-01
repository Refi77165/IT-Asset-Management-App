import { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Upload, Download, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { AppData, AppSettings } from '../types';
import { showToast } from './Toast';

interface Props {
  data: AppData;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
}

export function GoogleSync({ data, onUpdateSettings }: Props) {
  const { settings } = data;
  const [sheetId, setSheetId] = useState(settings.googleSheetId);
  const [syncing, setSyncing] = useState(false);
  const [clientId, setClientId] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  function handleConnect() {
    if (!clientId.trim()) {
      showToast('error', 'Configuration Required', 'Please enter your Google OAuth2 Client ID');
      return;
    }
    // In a real implementation, this would initiate OAuth2 flow via gapi
    // For demo purposes, we simulate a connection
    showToast('info', 'OAuth2 Flow', 'In production, this opens Google consent screen. Simulating connection...');
    setTimeout(() => {
      onUpdateSettings({ googleConnected: true });
      showToast('success', 'Connected to Google', 'OAuth2 authentication simulated');
    }, 1500);
  }

  function handleDisconnect() {
    onUpdateSettings({ googleConnected: false, googleSheetId: '', lastGoogleSync: '' });
    setSheetId('');
    showToast('success', 'Disconnected from Google');
  }

  function saveSheetId() {
    onUpdateSettings({ googleSheetId: sheetId });
    showToast('success', 'Sheet ID Saved');
  }

  async function handlePush() {
    if (!settings.googleSheetId) { showToast('error', 'No Sheet ID', 'Configure a Google Sheet ID first'); return; }
    setSyncing(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    const now = new Date().toISOString();
    onUpdateSettings({ lastGoogleSync: now });
    setSyncing(false);
    showToast('success', 'Pushed to Google Sheets', `${data.assets.length} assets synced`);
  }

  async function handlePull() {
    if (!settings.googleSheetId) { showToast('error', 'No Sheet ID', 'Configure a Google Sheet ID first'); return; }
    setSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(false);
    showToast('info', 'Pull Simulated', 'In production, this would import data from Google Sheets');
  }

  const connected = settings.googleConnected;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-slate-900">Google Sheets Sync</h1>
        <p className="text-xs text-slate-500 mt-0.5">Sync your asset data with Google Sheets</p>
      </div>

      {/* Connection Status Card */}
      <div className={`rounded-xl border p-6 ${connected ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              {connected ? <Cloud size={20} className="text-white" /> : <CloudOff size={20} className="text-white" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">
                {connected ? 'Connected to Google' : 'Not Connected'}
              </div>
              <div className="text-xs text-slate-500">
                {connected ? (settings.lastGoogleSync ? `Last sync: ${new Date(settings.lastGoogleSync).toLocaleString()}` : 'Never synced') : 'Connect to enable Google Sheets sync'}
              </div>
            </div>
          </div>
          <div>
            {connected ? (
              <button onClick={handleDisconnect} className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                Disconnect
              </button>
            ) : (
              <button onClick={() => setShowConfig(!showConfig)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Configure & Connect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuration */}
      {!connected && showConfig && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-medium">Setup Required</p>
              <p>To enable Google Sheets integration, you need a Google Cloud project with the Sheets API enabled and an OAuth2 Client ID. This is a client-side integration using the Google Identity Services library.</p>
              <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-amber-700 hover:underline font-medium">
                Google Cloud Console <ExternalLink size={11} />
              </a>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Google OAuth2 Client ID</label>
            <input value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 font-mono" placeholder="XXXXXXXXXX-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com" />
          </div>
          <button onClick={handleConnect} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Connect with Google OAuth2
          </button>
        </div>
      )}

      {/* Sheet Configuration */}
      {connected && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <h3 className="text-slate-700">Google Sheet Configuration</h3>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Spreadsheet ID</label>
            <div className="flex gap-2">
              <input value={sheetId} onChange={e => setSheetId(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 font-mono" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
              <button onClick={saveSheetId} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap">Save</button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Found in the URL: docs.google.com/spreadsheets/d/<strong className="text-slate-600">SPREADSHEET_ID</strong>/edit</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button onClick={handlePush} disabled={syncing} className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {syncing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              <span className="text-sm font-medium">Push to Sheets</span>
            </button>
            <button onClick={handlePull} disabled={syncing} className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 disabled:opacity-60 transition-colors">
              {syncing ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
              <span className="text-sm font-medium">Pull from Sheets</span>
            </button>
          </div>
        </div>
      )}

      {/* Sync Stats */}
      {connected && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Assets', count: data.assets.length, color: 'indigo' },
            { label: 'Users', count: data.users.length, color: 'emerald' },
            { label: 'Locations', count: data.locations.length, color: 'violet' },
            { label: 'Assignments', count: data.assignments.length, color: 'amber' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 text-center">
              <div className={`text-2xl font-semibold text-${color}-600 mb-1`}>{count}</div>
              <div className="text-xs text-slate-500">{label}</div>
              <div className="text-xs text-slate-400 mt-1">rows to sync</div>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <h3 className="text-slate-700 mb-4">How it works</h3>
        <div className="space-y-3">
          {[
            { icon: CheckCircle, text: 'Authenticate once with your Google account via OAuth2', color: 'text-emerald-500' },
            { icon: CheckCircle, text: 'Set the Google Spreadsheet ID where data will be synced', color: 'text-emerald-500' },
            { icon: CheckCircle, text: '"Push to Sheets" overwrites the spreadsheet with current ITAM data', color: 'text-emerald-500' },
            { icon: CheckCircle, text: '"Pull from Sheets" imports data from the spreadsheet into ITAM', color: 'text-emerald-500' },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-start gap-2 text-sm text-slate-600">
              <Icon size={15} className={`${color} mt-0.5 shrink-0`} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
