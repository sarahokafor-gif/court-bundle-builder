import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleClearAndReload = () => {
    // Clear localStorage and reload
    try {
      localStorage.removeItem('court-bundle-builder-autosave')
    } catch (e) {
      console.error('Failed to clear localStorage:', e)
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">
              <AlertTriangle size={48} />
            </div>

            <h1>Something went wrong</h1>
            <p className="error-message">
              We're sorry, but something unexpected happened. Your work may have been auto-saved.
            </p>

            {this.state.error && (
              <details className="error-details">
                <summary>Technical details</summary>
                <pre>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleReset} className="error-btn secondary">
                <RefreshCw size={18} />
                Try Again
              </button>
              <button onClick={this.handleReload} className="error-btn primary">
                <Home size={18} />
                Reload Page
              </button>
            </div>

            <p className="error-hint">
              If the problem persists, try{' '}
              <button onClick={this.handleClearAndReload} className="error-link">
                clearing saved data and reloading
              </button>
              .
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
