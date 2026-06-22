// ============================================================
// Toast 通知组件 —— 《晋·信》
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <ToastItemCard key={t.id} item={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItemCard({ item }: { item: ToastItem }) {
  const icons: Record<ToastType, string> = {
    info: '📋',
    success: '✅',
    warning: '⚡',
    error: '❌',
  };

  return (
    <div className={`toast toast--${item.type}`}>
      <span style={{ marginRight: 8 }}>{icons[item.type]}</span>
      {item.message}
    </div>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
