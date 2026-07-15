import './Badge.css';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'gradient';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  onClick,
  className = '',
  title,
}: BadgeProps) {
  return (
    <span
      className={`
        badge
        badge--${variant}
        badge--${size}
        ${onClick ? 'badge--clickable' : ''}
        ${className}
      `.trim()}
      onClick={onClick}
      title={title}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && <span className="badge__icon">{icon}</span>}
      <span className="badge__text">{children}</span>
    </span>
  );
}
