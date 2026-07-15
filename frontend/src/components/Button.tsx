import { useState, useRef } from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  title,
  fullWidth = false,
}: ButtonProps) {
  const [showRipple, setShowRipple] = useState(false);
  const [rippleStyle, setRippleStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    
    // Create ripple effect
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      setRippleStyle({
        width: size,
        height: size,
        left: x,
        top: y,
      });
      setShowRipple(true);
      
      setTimeout(() => setShowRipple(false), 600);
    }
    
    onClick?.(e);
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={buttonRef}
      type={type}
      className={`
        button
        button--${variant}
        button--${size}
        ${fullWidth ? 'button--full-width' : ''}
        ${className}
      `.trim()}
      disabled={isDisabled}
      onClick={handleClick}
      title={title}
      tabIndex={isDisabled ? -1 : 0}
    >
      {loading ? (
        <span className="button__spinner" aria-label="Loading">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="31.4 31.4"
              className="button__spinner-circle"
            />
          </svg>
        </span>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="button__icon button__icon--left">{icon}</span>
          )}
          
          <span className="button__label">{children}</span>
          
          {icon && iconPosition === 'right' && (
            <span className="button__icon button__icon--right">{icon}</span>
          )}
        </>
      )}
      
      {showRipple && (
        <span 
          className="button__ripple" 
          style={rippleStyle}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
