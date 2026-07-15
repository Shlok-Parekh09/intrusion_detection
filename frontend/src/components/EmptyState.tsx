import { Button } from './Button';
import './EmptyState.css';

type EmptyStateVariant = 'table' | 'search' | 'alerts' | 'graph' | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  heading: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  variant = 'generic',
  heading,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state__illustration">
        {variant === 'table' && (
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="30" width="80" height="60" rx="4" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 4" />
            <line x1="30" y1="50" x2="90" y2="50" stroke="var(--text-muted)" strokeWidth="1" opacity="0.5" />
            <line x1="30" y1="65" x2="90" y2="65" stroke="var(--text-muted)" strokeWidth="1" opacity="0.5" />
            <line x1="30" y1="80" x2="90" y2="80" stroke="var(--text-muted)" strokeWidth="1" opacity="0.5" />
            <circle cx="60" cy="60" r="12" fill="var(--bg-card)" stroke="var(--text-muted)" strokeWidth="1.5" />
            <text x="60" y="65" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">∅</text>
          </svg>
        )}
        
        {variant === 'search' && (
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="25" stroke="var(--text-muted)" strokeWidth="1.5" />
            <line x1="68" y1="68" x2="90" y2="90" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="8" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="2 2" />
            <text x="90" y="45" fill="var(--text-muted)" fontSize="18" fontFamily="monospace">?</text>
          </svg>
        )}
        
        {variant === 'alerts' && (
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 25 L60 75" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="60" cy="85" r="8" stroke="var(--text-muted)" strokeWidth="1.5" />
            <path d="M45 55 Q60 40 75 55" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" />
            <circle cx="45" cy="55" r="3" fill="var(--success)" opacity="0.3" />
            <circle cx="60" cy="45" r="3" fill="var(--success)" opacity="0.3" />
            <circle cx="75" cy="55" r="3" fill="var(--success)" opacity="0.3" />
            <rect x="30" y="95" width="60" height="8" rx="2" stroke="var(--text-muted)" strokeWidth="1.5" />
          </svg>
        )}
        
        {variant === 'graph' && (
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="40" r="8" stroke="var(--text-muted)" strokeWidth="1.5" />
            <circle cx="90" cy="40" r="8" stroke="var(--text-muted)" strokeWidth="1.5" />
            <circle cx="60" cy="80" r="8" stroke="var(--text-muted)" strokeWidth="1.5" />
            <line x1="35" y1="45" x2="55" y2="75" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <line x1="85" y1="45" x2="65" y2="75" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <circle cx="60" cy="60" r="20" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          </svg>
        )}
        
        {variant === 'generic' && (
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="35" y="35" width="50" height="50" rx="8" stroke="var(--text-muted)" strokeWidth="1.5" />
            <line x1="45" y1="55" x2="75" y2="55" stroke="var(--text-muted)" strokeWidth="1" opacity="0.5" />
            <line x1="45" y1="65" x2="65" y2="65" stroke="var(--text-muted)" strokeWidth="1" opacity="0.5" />
            <line x1="45" y1="75" x2="70" y2="75" stroke="var(--text-muted)" strokeWidth="1" opacity="0.5" />
            <circle cx="85" cy="35" r="12" fill="var(--bg-card)" stroke="var(--text-muted)" strokeWidth="1.5" />
            <line x1="85" y1="30" x2="85" y2="40" stroke="var(--text-muted)" strokeWidth="1.5" />
            <line x1="80" y1="35" x2="90" y2="35" stroke="var(--text-muted)" strokeWidth="1.5" />
          </svg>
        )}
      </div>
      
      <h3 className="empty-state__heading">{heading}</h3>
      <p className="empty-state__description">{description}</p>
      
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
          className="empty-state__action"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
