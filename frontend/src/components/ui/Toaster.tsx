import React from 'react';
import { useToast, type ToastType } from '../../hooks/useToast';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />
};

const borderStyles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-white text-slate-900',
  warning: 'border-amber-200 bg-white text-slate-900',
  error: 'border-red-200 bg-white text-slate-900',
  info: 'border-indigo-200 bg-white text-slate-900'
};

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all animate-fade-in ${borderStyles[t.type]}`}
        >
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            {t.title && <div className="text-xs font-bold text-slate-900 mb-0.5">{t.title}</div>}
            <div className="text-xs text-slate-600 leading-relaxed break-words">{t.message}</div>
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
