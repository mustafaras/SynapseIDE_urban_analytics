import { Component, type ErrorInfo, type ReactNode } from 'react';
// NeuralGlassCard removed — not used here
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });


    this.props.onError?.(error, errorInfo);


    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {

    console.error('Error logged:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };
  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            padding: '2rem',
          }}
        >
          <div className="error-boundary-card" style={{ padding: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: 'var(--syn-status-error)',
              }}
            >
              <AlertTriangle size={48} />
            </div>

            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--syn-status-error)',
              }}
            >
              Error
            </p>

            <h2
              style={{
                color: 'var(--syn-text-default)',
                marginBottom: '1rem',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              Something went wrong
            </h2>

            <p
              style={{
                color: 'var(--syn-text-secondary)',
                marginBottom: '2rem',
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page or
              contact support if the problem persists.
            </p>

            {import.meta.env.MODE === 'development' && this.state.error ? <details
                style={{
                  marginBottom: '2rem',
                  textAlign: 'left',
                  background: 'var(--syn-surface-elevated)',
                  padding: '1rem',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--syn-border-default)',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--syn-text-default)',
                  }}
                >
                  Error Details (Development)
                </summary>
                <pre
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--syn-text-secondary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                  {'\n\n'}
                  Component Stack:
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details> : null}

            <button
              onClick={this.handleRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--syn-interaction-active)',
                color: 'var(--syn-text-inverse)',
                border: '1px solid var(--syn-border-active)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                transition: 'all var(--duration-medium) var(--syn-easing-bauhaus)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--syn-interaction-selected)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--syn-interaction-active)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
