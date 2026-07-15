import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Keyboard, X } from 'lucide-react';
import { Modal } from './Modal';
import './CommandPalette.css';

interface CommandItem {
  id: string;
  label: string;
  category: 'page' | 'action' | 'recent';
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, items }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter items based on search
  const filteredItems = useCallback(() => {
    if (!search.trim()) return items.slice(0, 8);
    
    const query = search.toLowerCase();
    return items
      .filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [search, items]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    const filtered = filteredItems();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].onSelect();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      setSearch('');
      setSelectedIndex(0);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Global keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Will be opened by parent
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose]);

  const filtered = filteredItems();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
      closeOnBackdrop={true}
    >
      <div className="command-palette">
        <div className="command-palette__search">
          <Search size={18} className="command-palette__search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette__input"
            placeholder="Type a command or search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <kbd className="command-palette__kbd">
            <X size={12} />
          </kbd>
        </div>

        {filtered.length > 0 && (
          <ul className="command-palette__list" ref={listRef}>
            {filtered.map((item, index) => (
              <li
                key={item.id}
                className={`
                  command-palette__item
                  ${index === selectedIndex ? 'command-palette__item--selected' : ''}
                `}
                onClick={() => {
                  item.onSelect();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {item.icon && (
                  <span className="command-palette__icon">{item.icon}</span>
                )}
                <div className="command-palette__content">
                  <span className="command-palette__label">{item.label}</span>
                  <span className="command-palette__category">{item.category}</span>
                </div>
                {item.shortcut && (
                  <kbd className="command-palette__shortcut">{item.shortcut}</kbd>
                )}
              </li>
            ))}
          </ul>
        )}

        {filtered.length === 0 && search && (
          <div className="command-palette__empty">
            <Keyboard size={32} />
            <p>No results found for "{search}"</p>
          </div>
        )}

        <div className="command-palette__footer">
          <span>
            <kbd className="command-palette__footer-kbd">↑↓</kbd> to navigate
          </span>
          <span>
            <kbd className="command-palette__footer-kbd">↵</kbd> to select
          </span>
          <span>
            <kbd className="command-palette__footer-kbd">esc</kbd> to close
          </span>
        </div>
      </div>
    </Modal>
  );
}

// Hook for command palette
export function useCommandPalette(items: CommandItem[]) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    CommandPaletteComponent: () => (
      <CommandPalette isOpen={isOpen} onClose={close} items={items} />
    ),
  };
}
