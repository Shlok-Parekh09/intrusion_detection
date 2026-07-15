import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ContextMenu.css';

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off-screen
  const adjustPosition = () => {
    if (!menuRef.current) return { x, y };
    
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let adjustedX = x;
    let adjustedY = y;
    
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 8;
    }
    
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 8;
    }
    
    return { x: adjustedX, y: adjustedY };
  };

  const pos = adjustPosition();

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: pos.x, top: pos.y }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.id}
          className={`
            context-menu__item
            ${item.danger ? 'context-menu__item--danger' : ''}
            ${item.disabled ? 'context-menu__item--disabled' : ''}
          `}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
          role="menuitem"
        >
          {item.icon && (
            <span className="context-menu__icon">{item.icon}</span>
          )}
          <span className="context-menu__label">{item.label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
}

// Hook for context menu
export function useContextMenu(items: ContextMenuItem[]) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const open = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const close = () => setPosition(null);

  return {
    isOpen: position !== null,
    open,
    close,
    position,
    ContextMenuComponent: () =>
      position ? (
        <ContextMenu x={position.x} y={position.y} items={items} onClose={close} />
      ) : null,
  };
}
