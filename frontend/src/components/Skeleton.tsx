import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table-row';
  width?: number | string;
  height?: number | string;
  lines?: number;
  className?: string;
  animated?: boolean;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = '',
  animated = true,
}: SkeletonProps) {
  if (variant === 'circular') {
    return (
      <div
        className={`skeleton skeleton--circular ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`skeleton skeleton--card ${className}`}>
        <div className="skeleton__card-header">
          <div className={`skeleton skeleton--text ${animated ? 'skeleton--animated' : ''}`} style={{ width: '60%', height: 18 }} />
        </div>
        <div className="skeleton__card-content">
          <div className={`skeleton skeleton--text ${animated ? 'skeleton--animated' : ''}`} style={{ width: '90%', height: 14, marginBottom: 8 }} />
          <div className={`skeleton skeleton--text ${animated ? 'skeleton--animated' : ''}`} style={{ width: '75%', height: 14 }} />
        </div>
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`skeleton skeleton--table-row ${className}`}>
        <div className={`skeleton skeleton--rectangular ${animated ? 'skeleton--animated' : ''}`} style={{ width: 40, height: 16 }} />
        <div className={`skeleton skeleton--text ${animated ? 'skeleton--animated' : ''}`} style={{ width: '20%', height: 14 }} />
        <div className={`skeleton skeleton--text ${animated ? 'skeleton--animated' : ''}`} style={{ width: '25%', height: 14 }} />
        <div className={`skeleton skeleton--text ${animated ? 'skeleton--animated' : ''}`} style={{ width: '15%', height: 14 }} />
        <div className={`skeleton skeleton--text ${animated ? 'skeleton--animated' : ''}`} style={{ width: '30%', height: 14 }} />
      </div>
    );
  }

  // Text variant (default) - supports multiple lines
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton skeleton--text ${animated ? 'skeleton--animated' : ''} ${className}`}
          style={{
            width: i === lines - 1 && lines > 1 ? `${Math.random() * 30 + 40}%` : width,
            height: height || 14,
            marginBottom: lines > 1 && i < lines - 1 ? 8 : 0,
          }}
        />
      ))}
    </>
  );
}

interface SkeletonListProps {
  count?: number;
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table-row';
  gap?: number;
  className?: string;
}

export function SkeletonList({
  count = 3,
  variant = 'text',
  gap = 8,
  className = '',
}: SkeletonListProps) {
  return (
    <div className={`skeleton-list ${className}`} style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} animated />
      ))}
    </div>
  );
}
