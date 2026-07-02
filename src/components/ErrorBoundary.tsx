import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'monospace',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              border: '1px solid rgba(245,158,11,0.3)',
              padding: '2rem',
              position: 'relative',
            }}
          >
            {/* Amber corner accents */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: '1px solid #f59e0b', borderLeft: '1px solid #f59e0b' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: '1px solid #f59e0b', borderRight: '1px solid #f59e0b' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: '1px solid #f59e0b', borderLeft: '1px solid #f59e0b' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: '1px solid #f59e0b', borderRight: '1px solid #f59e0b' }} />

            <p style={{ color: '#f59e0b', fontSize: 10, letterSpacing: '0.3em', marginBottom: 16 }}>
              — SYSTEM ERROR
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.1em', marginBottom: 16 }}>
              SOMETHING WENT{' '}
              <span style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)', color: 'transparent' }}>
                WRONG
              </span>
            </h1>
            <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.borderColor = '#f59e0b';
                (e.target as HTMLButtonElement).style.color = '#f59e0b';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
                (e.target as HTMLButtonElement).style.color = '#fff';
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
