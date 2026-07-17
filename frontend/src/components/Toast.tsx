import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
  showProgress?: boolean;
  onClick?: () => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function Toast({ id, message, variant = 'info', duration = 4000, onClose, showProgress = true, onClick }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const close = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  }, [id, onClose]);

  useEffect(() => {
    if (duration === Infinity) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining === 0) {
        close();
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, close]);

  const Icon = icons[variant];

  return (
    <div
      className={`
        toast
        toast--${variant}
        ${isExiting ? 'toast--exiting' : ''}
        ${onClick ? 'toast--clickable' : ''}
      `.trim()}
      role="alert"
      onClick={() => {
        if (onClick) onClick();
        close();
      }}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="toast__icon">
        <Icon size={18} />
      </div>
      
      <div className="toast__message">{message}</div>
      
      <button
        className="toast__close"
        onClick={close}
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
      
      {showProgress && duration !== Infinity && (
        <div 
          className="toast__progress" 
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
}

// Toast container component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    variant?: ToastVariant;
    duration?: number;
  }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (typeof document === 'undefined' || toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="toast-wrapper"
          style={{ 
            '--toast-index': index,
            '--toast-count': toasts.length,
          } as React.CSSProperties}
        >
          <Toast
            {...toast}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}

// Hook for using toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; variant: ToastVariant; duration: number; onClick?: () => void }>>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 4000, onClick?: () => void) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, variant, duration, onClick }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message: string, duration?: number, onClick?: () => void) => addToast(message, 'success', duration, onClick),
    error: (message: string, duration?: number, onClick?: () => void) => addToast(message, 'error', duration, onClick),
    warning: (message: string, duration?: number, onClick?: () => void) => addToast(message, 'warning', duration, onClick),
    info: (message: string, duration?: number, onClick?: () => void) => addToast(message, 'info', duration, onClick),
  };

  return { toasts, addToast, removeToast, toast };
}
