import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { notifications, dismissNotification } = useApp();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {notifications.map((n) => {
        let bg = 'bg-white border-gray-200 text-gray-800';
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;

        if (n.type === 'success') {
          bg = 'bg-emerald-50 border-emerald-200 text-emerald-950';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (n.type === 'warning') {
          bg = 'bg-amber-50 border-amber-200 text-amber-950';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
        } else if (n.type === 'error') {
          bg = 'bg-rose-50 border-rose-200 text-rose-950';
          icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
        }

        return (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-2 ${bg}`}
          >
            {icon}
            <div className="flex-1 min-w-0 text-sm">
              {n.title && <p className="font-semibold text-xs uppercase tracking-wider mb-0.5">{n.title}</p>}
              <p className="leading-snug text-xs sm:text-sm">{n.message}</p>
            </div>
            <button
              onClick={() => dismissNotification(n.id)}
              className="text-gray-400 hover:text-gray-700 p-0.5 rounded-lg transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
