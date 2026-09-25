import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
const ToastContext = createContext(undefined);
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const showToast = useCallback((message, type = 'info', title, duration = 4000) => {
        const id = crypto.randomUUID();
        const newToast = { id, type, title, message, duration };
        setToasts((prev) => (prev.length >= 5 ? [...prev.slice(-4), newToast] : [...prev, newToast]));
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);
    const success = useCallback((msg, title) => showToast(msg, 'success', title), [showToast]);
    const error = useCallback((msg, title) => showToast(msg, 'error', title), [showToast]);
    const info = useCallback((msg, title) => showToast(msg, 'info', title), [showToast]);
    const warning = useCallback((msg, title) => showToast(msg, 'warning', title), [showToast]);
    return (<ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div role="region" aria-label="Notifications" aria-live="polite" aria-atomic="false" className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => {
            let bg = 'bg-white dark:bg-[#16222F] border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-xl dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)]';
            let icon = <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5"/>;
            let borderLeft = 'border-l-4 border-l-blue-500 dark:border-l-blue-400';
            if (toast.type === 'success') {
                icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"/>;
                borderLeft = 'border-l-4 border-l-emerald-600 dark:border-l-emerald-500';
            }
            else if (toast.type === 'error') {
                icon = <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"/>;
                borderLeft = 'border-l-4 border-l-rose-600 dark:border-l-rose-500';
            }
            else if (toast.type === 'warning') {
                icon = <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5"/>;
                borderLeft = 'border-l-4 border-l-amber-500 dark:border-l-amber-400';
            }
            return (<div key={toast.id} className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${borderLeft} ${bg} transition-all duration-300 animate-slide-in backdrop-blur-md`}>
              {icon}
              <div className="flex-1 text-sm">
                {toast.title && <div className="font-semibold text-slate-900 dark:text-white mb-0.5">{toast.title}</div>}
                <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{toast.message}</div>
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close notification">
                <X className="w-4 h-4"/>
              </button>
            </div>);
        })}
      </div>
    </ToastContext.Provider>);
};
const noop = () => { };
const defaultToastFallback = {
    toasts: [],
    showToast: noop,
    removeToast: noop,
    success: noop,
    error: noop,
    info: noop,
    warning: noop,
};
export const useToast = () => {
    const context = useContext(ToastContext);
    return context || defaultToastFallback;
};
