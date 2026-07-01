import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | string;
}

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  'Under Maintenance': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Retired: 'bg-red-50 text-red-600 ring-1 ring-red-200',
  Good: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Fair: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Poor: 'bg-red-50 text-red-600 ring-1 ring-red-200',
  Admin: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  Staff: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Viewer: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  'Active Loan': 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  Returned: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

export function StatusBadge({ children }: BadgeProps) {
  const label = String(children);
  const cls = statusColors[label] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

export function CategoryBadge({ children }: BadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 ring-1 ring-violet-200">
      {children}
    </span>
  );
}

export function DeptBadge({ children }: BadgeProps) {
  const deptColors: Record<string, string> = {
    IT: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    Finance: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    HR: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
    Operations: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    Management: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  };
  const label = String(children);
  const cls = deptColors[label] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>{children}</span>;
}
