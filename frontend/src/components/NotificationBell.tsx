import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Tooltip } from './Tooltip';
import './NotificationBell.css';

type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: number;
  read: boolean;
}

interface NotificationBellProps {
  notifications?: Notification[];
  onMarkAllRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const severityIcons = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'ℹ',
};

const severityColors = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--info)',
};

export function NotificationBell({
  notifications = [],
  onMarkAllRead,
  onNotificationClick,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <Tooltip content="Notifications" position="bottom">
        <button
          className="notification-bell"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          aria-expanded={isOpen}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="notification-bell__badge">{unreadCount}</span>
          )}
        </button>
      </Tooltip>

      {isOpen && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <span className="notification-bell__title">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="notification-bell__mark-read"
                onClick={onMarkAllRead}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-bell__list">
            {notifications.length === 0 ? (
              <div className="notification-bell__empty">
                <Bell size={32} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    notification-item
                    ${!notification.read ? 'notification-item--unread' : ''}
                  `}
                  onClick={() => {
                    onNotificationClick?.(notification);
                    setIsOpen(false);
                  }}
                >
                  <span
                    className="notification-item__indicator"
                    style={{ background: severityColors[notification.severity] }}
                  >
                    {severityIcons[notification.severity]}
                  </span>
                  <div className="notification-item__content">
                    <span className="notification-item__title">{notification.title}</span>
                    <span className="notification-item__message">{notification.message}</span>
                    <span className="notification-item__time">{formatTime(notification.timestamp)}</span>
                  </div>
                  {!notification.read && (
                    <span className="notification-item__unread-dot" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
