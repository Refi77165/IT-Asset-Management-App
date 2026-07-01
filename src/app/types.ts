export type Department = 'IT' | 'Finance' | 'HR' | 'Operations' | 'Management';
export type UserRole = 'Admin' | 'Staff' | 'Viewer';
export type ActiveStatus = 'Active' | 'Inactive';
export type AssetStatus = 'Active' | 'Inactive' | 'Under Maintenance' | 'Retired';
export type AssetCondition = 'Good' | 'Fair' | 'Poor';
export type AssetCategory = 'Laptop' | 'Desktop' | 'Monitor' | 'Printer' | 'Network Device' | 'Server' | 'Phone' | 'Peripheral' | 'Other';
export type AssignmentStatus = 'Active Loan' | 'Returned';
export type NavModule = 'dashboard' | 'users' | 'locations' | 'assets' | 'assignments' | 'export' | 'google' | 'settings';

export interface User {
  id: string;
  fullName: string;
  email: string;
  department: Department;
  role: UserRole;
  status: ActiveStatus;
  phone: string;
  dateAdded: string;
}

export interface Location {
  id: string;
  name: string;
  building: string;
  floor: string;
  city: string;
  pic: string; // User ID
  status: ActiveStatus;
  notes: string;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber: string;
  specification: string;
  purchaseDate: string;
  purchasePrice: number;
  warrantyUntil: string;
  vendor: string;
  status: AssetStatus;
  condition: AssetCondition;
  assignedTo: string; // User ID
  location: string; // Location ID
  notes: string;
  dateAdded: string;
  lastUpdated: string;
}

export interface Assignment {
  id: string;
  assetId: string;
  userId: string;
  startDate: string;
  returnDate: string;
  notes: string;
  status: AssignmentStatus;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  user: string;
}

export interface AppSettings {
  appName: string;
  companyName: string;
  assetPrefix: string;
  userPrefix: string;
  locationPrefix: string;
  currency: string;
  categories: string[];
  departments: string[];
  googleConnected: boolean;
  googleSheetId: string;
  lastGoogleSync: string;
}

export interface AppData {
  users: User[];
  locations: Location[];
  assets: Asset[];
  assignments: Assignment[];
  activityLog: ActivityLog[];
  settings: AppSettings;
}
