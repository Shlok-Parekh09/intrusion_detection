import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught error in ${this.props.name || 'component'}:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__icon">
            <AlertTriangle size={32} />
          </div>
          <h3 className="error-boundary__title">Something went wrong</h3>
          {this.props.name && (
            <p className="error-boundary__component">
              Error in component: {this.props.name}
            </p>
          )}
          {this.state.error && (
            <p className="error-boundary__message">{this.state.error.message}</p>
          )}
          <Button
            variant="secondary"
            onClick={this.handleRetry}
            icon={<RotateCcw size={14} />}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline error state for functional components
export function InlineError({ message, onRetry, className = '' }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={`error-boundary error-boundary--inline ${className}`}>
      <div className="error-boundary__icon error-boundary__icon--small">
        <AlertTriangle size={20} />
      </div>
      <p className="error-boundary__message">{message}</p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          icon={<RotateCcw size={12} />}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
