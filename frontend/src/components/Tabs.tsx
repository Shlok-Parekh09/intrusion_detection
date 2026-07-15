import { useState, useRef, useEffect } from 'react';
import './Tabs.css';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  fullWidth?: boolean;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  fullWidth = false,
}: TabsProps) {
  const [underlineStyle, setUnderlineStyle] = useState<React.CSSProperties>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Calculate underline position
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const activeRect = activeTabRef.current.getBoundingClientRect();
      const parentRect = tabsRef.current.getBoundingClientRect();
      
      setUnderlineStyle({
        width: activeRect.width,
        transform: `translateX(${activeRect.left - parentRect.left}px)`,
      });
    }
  }, [activeTab]);

  return (
    <div className={`tabs-wrapper ${fullWidth ? 'tabs-wrapper--full' : ''} ${className}`}>
      <div className="tabs" ref={tabsRef} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={activeTab === tab.id ? activeTabRef : null}
            className={`
              tab
              ${activeTab === tab.id ? 'tab--active' : ''}
              ${tab.disabled ? 'tab--disabled' : ''}
            `.trim()}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-disabled={tab.disabled}
            tabIndex={tab.disabled ? -1 : 0}
          >
            {tab.icon && <span className="tab__icon">{tab.icon}</span>}
            <span className="tab__label">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="tab__badge">{tab.badge}</span>
            )}
          </button>
        ))}
        
        {/* Animated underline */}
        <div className="tab__underline" style={underlineStyle} />
      </div>
    </div>
  );
}
