import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { Tooltip } from './Tooltip';
import './UserMenu.css';

interface UserMenuProps {
  userName: string;
  userRole: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onSignOut?: () => void;
}

// Generate avatar color from name hash
function getAvatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #14b8a6)',
    'linear-gradient(135deg, #f59e0b, #f97316)',
    'linear-gradient(135deg, #ef4444, #ec4899)',
    'linear-gradient(135deg, #8b5cf6, #d946ef)',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({
  userName,
  userRole,
  onProfileClick,
  onSettingsClick,
  onSignOut,
}: UserMenuProps) {
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

  const avatarColor = getAvatarColor(userName);
  const initials = getInitials(userName);

  return (
    <div className="user-menu-wrapper" ref={dropdownRef}>
      <Tooltip content="Account" position="bottom">
        <button
          className="user-menu-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="User menu"
          aria-expanded={isOpen}
        >
          <div
            className="user-menu__avatar"
            style={{ background: avatarColor }}
          >
            {initials}
          </div>
        </button>
      </Tooltip>

      {isOpen && (
        <div className="user-menu__dropdown">
          <div className="user-menu__header">
            <div
              className="user-menu__avatar-large"
              style={{ background: avatarColor }}
            >
              {initials}
            </div>
            <div className="user-menu__info">
              <span className="user-menu__name">{userName}</span>
              <span className="user-menu__role">{userRole}</span>
            </div>
          </div>

          <div className="user-menu__divider" />

          <nav className="user-menu__nav">
            {onProfileClick && (
              <button
                className="user-menu__item"
                onClick={() => {
                  onProfileClick();
                  setIsOpen(false);
                }}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
            )}
            {onSettingsClick && (
              <button
                className="user-menu__item"
                onClick={() => {
                  onSettingsClick();
                  setIsOpen(false);
                }}
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            )}
            {onSignOut && (
              <button
                className="user-menu__item user-menu__item--danger"
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            )}
          </nav>

          <div className="user-menu__divider" />

          <div className="user-menu__footer">
            <Shield size={14} />
            <span>QPC Encrypted Session</span>
          </div>
        </div>
      )}
    </div>
  );
}
