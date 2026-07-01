import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

let toastListeners: ((t: ToastMessage) => void)[] = [];

export function showToast(type: ToastType, title: string, message?: string) {
  const toast: ToastMessage = { id: Date.now().toString(), type, title, message };
  toastListeners.forEach(l => l(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (t: ToastMessage) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
    };
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter(l => l !== listener); };
  }, []);

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-500" />,
    error: <XCircle size={16} className="text-red-500" />,
    warning: <AlertCircle size={16} className="text-amber-500" />,
    info: <AlertCircle size={16} className="text-blue-500" />,
  };

  const borders = {
    success: 'border-l-emerald-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-blue-500',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto bg-white border border-slate-200 border-l-4 ${borders[t.type]} rounded-lg shadow-xl px-4 py-3 flex items-start gap-3 min-w-[280px] max-w-[360px] animate-slide-in`}
          style={{ animation: 'slideIn 0.2s ease-out' }}
        >
          <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900">{t.title}</div>
            {t.message && <div className="text-xs text-slate-500 mt-0.5">{t.message}</div>}
          </div>
          <button onClick={() => remove(t.id)} className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
