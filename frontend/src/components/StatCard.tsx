import { useEffect, useRef, useState } from 'react';
import './StatCard.css';

interface StatCardProps {
  icon: React.ReactNode;
  iconClass: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
  label: string;
  value: number | string;
  sub?: React.ReactNode;
  subClass?: 'up' | 'down' | 'neutral';
  trend?: number;
  trendLabel?: string;
}

export function StatCard({ icon, iconClass, label, value, sub, subClass, trend, trendLabel }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef<number>(0);
  const isAnimating = useRef(false);

  // Animate value on mount/update
  useEffect(() => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    
    if (numericValue === 0) {
      setDisplayValue(0);
      return;
    }

    // Reset for animation
    prevValueRef.current = displayValue;
    isAnimating.current = true;

    const duration = 600;
    const startTime = performance.now();
    const startValue = prevValueRef.current;
    const endValue = numericValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = startValue + (endValue - startValue) * eased;
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isAnimating.current = false;
        setDisplayValue(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [value, displayValue]);

  const formatValue = (val: number) => {
    if (typeof value === 'string') return value;
    return Math.round(val).toLocaleString();
  };

  return (
    <div className="stat-card stat-card--modern">
      <div className={`stat-card__icon stat-card__icon--${iconClass}`}>
        {icon}
      </div>
      
      <div className="stat-card__label">{label}</div>
      
      <div className="stat-card__value numeric-display">
        {formatValue(displayValue)}
      </div>
      
      {trend !== undefined && (
        <div className={`stat-card__trend stat-card__trend--${trend >= 0 ? 'positive' : 'negative'}`}>
          <span className="stat-card__trend-arrow">
            {trend >= 0 ? '↑' : '↓'}
          </span>
          <span className="stat-card__trend-value">{Math.abs(trend)}%</span>
          {trendLabel && (
            <span className="stat-card__trend-label">{trendLabel}</span>
          )}
        </div>
      )}
      
      {sub && !trend && (
        <div className={`stat-card__sub stat-card__sub--${subClass || 'neutral'}`}>
          {sub}
        </div>
      )}
      
      <div className="stat-card__gradient-bg" />
    </div>
  );
}
