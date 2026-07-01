import { useState, useEffect, useCallback } from 'react';
import { AppData, User, Location, Asset, Assignment, ActivityLog, AppSettings } from './types';
import { sampleUsers, sampleLocations, sampleAssets, sampleAssignments, sampleActivityLog } from './data/sampleData';

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'IT Asset Manager',
  companyName: 'Acme Corporation',
  assetPrefix: 'AST-',
  userPrefix: 'USR-',
  locationPrefix: 'LOC-',
  currency: 'USD',
  categories: ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Network Device', 'Server', 'Phone', 'Peripheral', 'Other'],
  departments: ['IT', 'Finance', 'HR', 'Operations', 'Management'],
  googleConnected: false,
  googleSheetId: '',
  lastGoogleSync: '',
};

function loadData(): AppData {
  try {
    const users = JSON.parse(localStorage.getItem('itam_users') || 'null') ?? sampleUsers;
    const locations = JSON.parse(localStorage.getItem('itam_locations') || 'null') ?? sampleLocations;
    const assets = JSON.parse(localStorage.getItem('itam_assets') || 'null') ?? sampleAssets;
    const assignments = JSON.parse(localStorage.getItem('itam_assignments') || 'null') ?? sampleAssignments;
    const activityLog = JSON.parse(localStorage.getItem('itam_activity') || 'null') ?? sampleActivityLog;
    const settings = JSON.parse(localStorage.getItem('itam_settings') || 'null') ?? DEFAULT_SETTINGS;
    return { users, locations, assets, assignments, activityLog, settings };
  } catch {
    return {
      users: sampleUsers,
      locations: sampleLocations,
      assets: sampleAssets,
      assignments: sampleAssignments,
      activityLog: sampleActivityLog,
      settings: DEFAULT_SETTINGS,
    };
  }
}

function saveData(data: AppData) {
  localStorage.setItem('itam_users', JSON.stringify(data.users));
  localStorage.setItem('itam_locations', JSON.stringify(data.locations));
  localStorage.setItem('itam_assets', JSON.stringify(data.assets));
  localStorage.setItem('itam_assignments', JSON.stringify(data.assignments));
  localStorage.setItem('itam_activity', JSON.stringify(data.activityLog));
  localStorage.setItem('itam_settings', JSON.stringify(data.settings));
}

function nextId(items: { id: string }[], prefix: string): string {
  const nums = items
    .map(i => parseInt(i.id.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function createLog(action: string, entity: string, entityId: string, description: string, logs: ActivityLog[]): ActivityLog {
  return {
    id: nextId(logs, 'LOG-'),
    timestamp: new Date().toISOString(),
    action,
    entity,
    entityId,
    description,
    user: 'Current User',
  };
}

export function useAppStore() {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addLog = useCallback((action: string, entity: string, entityId: string, description: string) => {
    setData(d => ({
      ...d,
      activityLog: [createLog(action, entity, entityId, description, d.activityLog), ...d.activityLog].slice(0, 100),
    }));
  }, []);

  // Users
  const addUser = useCallback((u: Omit<User, 'id' | 'dateAdded'>) => {
    setData(d => {
      const id = nextId(d.users, d.settings.userPrefix);
      const user: User = { ...u, id, dateAdded: new Date().toISOString().split('T')[0] };
      const log = createLog('Added', 'User', id, `User ${u.fullName} added`, d.activityLog);
      return { ...d, users: [...d.users, user], activityLog: [log, ...d.activityLog] };
    });
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setData(d => {
      const log = createLog('Updated', 'User', id, `User ${id} updated`, d.activityLog);
      return { ...d, users: d.users.map(u => u.id === id ? { ...u, ...updates } : u), activityLog: [log, ...d.activityLog] };
    });
  }, []);

  const deleteUser = useCallback((id: string) => {
    setData(d => {
      const log = createLog('Deleted', 'User', id, `User ${id} deleted`, d.activityLog);
      return { ...d, users: d.users.filter(u => u.id !== id), activityLog: [log, ...d.activityLog] };
    });
  }, []);

  // Locations
  const addLocation = useCallback((l: Omit<Location, 'id'>) => {
    setData(d => {
      const id = nextId(d.locations, d.settings.locationPrefix);
      const location: Location = { ...l, id };
      const log = createLog('Added', 'Location', id, `Location ${l.name} added`, d.activityLog);
      return { ...d, locations: [...d.locations, location], activityLog: [log, ...d.activityLog] };
    });
  }, []);

  const updateLocation = useCallback((id: string, updates: Partial<Location>) => {
    setData(d => {
      const log = createLog('Updated', 'Location', id, `Location ${id} updated`, d.activityLog);
      return { ...d, locations: d.locations.map(l => l.id === id ? { ...l, ...updates } : l), activityLog: [log, ...d.activityLog] };
    });
  }, []);

  const deleteLocation = useCallback((id: string) => {
    setData(d => {
      const log = createLog('Deleted', 'Location', id, `Location ${id} deleted`, d.activityLog);
      return { ...d, locations: d.locations.filter(l => l.id !== id), activityLog: [log, ...d.activityLog] };
    });
  }, []);

  // Assets
  const addAsset = useCallback((a: Omit<Asset, 'id' | 'dateAdded' | 'lastUpdated'>) => {
    setData(d => {
      const id = nextId(d.assets, d.settings.assetPrefix);
      const today = new Date().toISOString().split('T')[0];
      const asset: Asset = { ...a, id, dateAdded: today, lastUpdated: today };
      const log = createLog('Added', 'Asset', id, `Asset ${a.name} registered`, d.activityLog);
      return { ...d, assets: [...d.assets, asset], activityLog: [log, ...d.activityLog] };
    });
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setData(d => {
      const today = new Date().toISOString().split('T')[0];
      const log = createLog('Updated', 'Asset', id, `Asset ${id} updated`, d.activityLog);
      return {
        ...d,
        assets: d.assets.map(a => a.id === id ? { ...a, ...updates, lastUpdated: today } : a),
        activityLog: [log, ...d.activityLog],
      };
    });
  }, []);

  const deleteAsset = useCallback((id: string) => {
    setData(d => {
      const log = createLog('Deleted', 'Asset', id, `Asset ${id} deleted`, d.activityLog);
      return { ...d, assets: d.assets.filter(a => a.id !== id), activityLog: [log, ...d.activityLog] };
    });
  }, []);

  // Assignments
  const addAssignment = useCallback((a: Omit<Assignment, 'id'>) => {
    setData(d => {
      const id = nextId(d.assignments, 'ASN-');
      const assignment: Assignment = { ...a, id };
      const log = createLog('Assigned', 'Asset', a.assetId, `Asset assigned to user ${a.userId}`, d.activityLog);
      // update asset assignedTo
      const today = new Date().toISOString().split('T')[0];
      return {
        ...d,
        assignments: [...d.assignments, assignment],
        assets: d.assets.map(x => x.id === a.assetId ? { ...x, assignedTo: a.userId, lastUpdated: today } : x),
        activityLog: [log, ...d.activityLog],
      };
    });
  }, []);

  const updateAssignment = useCallback((id: string, updates: Partial<Assignment>) => {
    setData(d => {
      const log = createLog('Updated', 'Assignment', id, `Assignment ${id} updated`, d.activityLog);
      const updated = d.assignments.map(a => a.id === id ? { ...a, ...updates } : a);
      // if returned, clear asset assignedTo
      let assets = d.assets;
      if (updates.status === 'Returned') {
        const assignment = updated.find(a => a.id === id);
        if (assignment) {
          const today = new Date().toISOString().split('T')[0];
          assets = d.assets.map(a => a.id === assignment.assetId ? { ...a, assignedTo: '', lastUpdated: today } : a);
        }
      }
      return { ...d, assignments: updated, assets, activityLog: [log, ...d.activityLog] };
    });
  }, []);

  const deleteAssignment = useCallback((id: string) => {
    setData(d => {
      const log = createLog('Deleted', 'Assignment', id, `Assignment ${id} deleted`, d.activityLog);
      return { ...d, assignments: d.assignments.filter(a => a.id !== id), activityLog: [log, ...d.activityLog] };
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...updates } }));
  }, []);

  const resetAllData = useCallback(() => {
    const fresh: AppData = {
      users: sampleUsers,
      locations: sampleLocations,
      assets: sampleAssets,
      assignments: sampleAssignments,
      activityLog: sampleActivityLog,
      settings: DEFAULT_SETTINGS,
    };
    setData(fresh);
  }, []);

  const importData = useCallback((partial: Partial<Pick<AppData, 'users' | 'locations' | 'assets' | 'assignments'>>) => {
    setData(d => ({ ...d, ...partial }));
  }, []);

  return {
    data,
    addUser, updateUser, deleteUser,
    addLocation, updateLocation, deleteLocation,
    addAsset, updateAsset, deleteAsset,
    addAssignment, updateAssignment, deleteAssignment,
    updateSettings,
    resetAllData,
    importData,
    addLog,
  };
}
