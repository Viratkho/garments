import React, { createContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration || 6000), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <NotificationContext.Provider value={{ success, error, info, addToast, removeToast }}>
      {children}
      {/* Toast container in top-right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => {
          let bg = 'bg-white border-l-4 border-emerald-500 text-gray-800 shadow-lg';
          let Icon = CheckCircle2;
          let iconColor = 'text-emerald-500';

          if (toast.type === 'error') {
            bg = 'bg-white border-l-4 border-rose-500 text-gray-800 shadow-lg';
            Icon = AlertCircle;
            iconColor = 'text-rose-500';
          } else if (toast.type === 'info') {
            bg = 'bg-white border-l-4 border-blue-500 text-gray-800 shadow-lg';
            Icon = Info;
            iconColor = 'text-blue-500';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start p-3.5 rounded shadow-md border border-gray-100 transition-all duration-300 transform translate-y-0 ${bg}`}
            >
              <Icon className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium leading-tight">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};
