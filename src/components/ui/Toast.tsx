import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { announce } from '../../lib/announcer';

export type ToastType = 'success' | 'info' | 'error' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Standalone toast dispatcher for use outside React tree or directly in handlers
type ToastListener = (toast: ToastItem) => void;
const toastListeners = new Set<ToastListener>();

export const toast = {
  success(message: string, duration = 3500) {
    emitToast(message, 'success', duration);
  },
  info(message: string, duration = 3500) {
    emitToast(message, 'info', duration);
  },
  error(message: string, duration = 4000) {
    emitToast(message, 'error', duration);
  },
  warning(message: string, duration = 4000) {
    emitToast(message, 'warning', duration);
  }
};

function emitToast(message: string, type: ToastType, duration: number) {
  const item: ToastItem = {
    id: crypto.randomUUID(),
    message,
    type,
    duration
  };
  announce(message);
  toastListeners.forEach(listener => listener(item));
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = crypto.randomUUID();
    const item: ToastItem = { id, message, type, duration };
    announce(message);
    setToasts(prev => [...prev, item]);
  }, []);

  useEffect(() => {
    const handleListener = (item: ToastItem) => {
      setToasts(prev => [...prev, item]);
    };
    toastListeners.add(handleListener);
    return () => {
      toastListeners.delete(handleListener);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback to standalone toast if used outside provider
    return {
      toasts: [],
      showToast: (msg: string, type: ToastType = 'info', duration?: number) => {
        emitToast(msg, type, duration || 3500);
      },
      removeToast: () => {},
    };
  }
  return context;
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-label="Notifications"
    >
      {toasts.map(t => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onRemove(t.id)} />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast: t, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, t.duration || 3500);
    return () => clearTimeout(timer);
  }, [t.duration, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden="true" />,
    info: <Sparkles className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="h-5 w-5 text-destructive shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" aria-hidden="true" />,
  };

  const borders = {
    success: 'border-emerald-500/30',
    info: 'border-primary/30',
    error: 'border-destructive/40',
    warning: 'border-amber-500/40',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-lg border bg-card text-card-foreground shadow-lg transition-all animate-in slide-in-from-bottom-3 fade-in duration-200",
        borders[t.type]
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icons[t.type]}
        <p className="text-sm font-medium leading-snug break-words text-foreground">
          {t.message}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
