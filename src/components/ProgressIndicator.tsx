import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import './ProgressIndicator.css'

export type ProgressStatus = 'idle' | 'loading' | 'success' | 'error'

interface ProgressIndicatorProps {
  status: ProgressStatus
  progress?: number // 0-100
  message?: string
  showPercentage?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'linear' | 'circular'
}

export default function ProgressIndicator({
  status,
  progress = 0,
  message,
  showPercentage = true,
  size = 'medium',
  variant = 'linear',
}: ProgressIndicatorProps) {
  if (status === 'idle') return null

  const clampedProgress = Math.min(100, Math.max(0, progress))

  if (variant === 'circular') {
    return (
      <div className={`progress-indicator progress-indicator-circular progress-indicator-${size}`}>
        <div className="progress-circular-content">
          {status === 'loading' && <Loader2 className="progress-spinner" size={size === 'small' ? 20 : size === 'large' ? 32 : 24} />}
          {status === 'success' && <CheckCircle className="progress-success-icon" size={size === 'small' ? 20 : size === 'large' ? 32 : 24} />}
          {status === 'error' && <AlertCircle className="progress-error-icon" size={size === 'small' ? 20 : size === 'large' ? 32 : 24} />}
          {message && <p className="progress-message">{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`progress-indicator progress-indicator-linear progress-indicator-${size}`}>
      <div className="progress-header">
        <div className="progress-icon-message">
          {status === 'loading' && <Loader2 className="progress-spinner" size={16} />}
          {status === 'success' && <CheckCircle className="progress-success-icon" size={16} />}
          {status === 'error' && <AlertCircle className="progress-error-icon" size={16} />}
          {message && <span className="progress-message">{message}</span>}
        </div>
        {showPercentage && status === 'loading' && (
          <span className="progress-percentage">{Math.round(clampedProgress)}%</span>
        )}
      </div>

      {status === 'loading' && (
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${clampedProgress}%` }}
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
    </div>
  )
}

interface ProgressStepProps {
  steps: Array<{
    label: string
    status: 'pending' | 'active' | 'completed' | 'error'
  }>
}

export function ProgressSteps({ steps }: ProgressStepProps) {
  return (
    <div className="progress-steps">
      {steps.map((step, index) => (
        <div key={index} className={`progress-step progress-step-${step.status}`}>
          <div className="progress-step-indicator">
            {step.status === 'completed' && <CheckCircle size={16} />}
            {step.status === 'active' && <Loader2 className="progress-spinner" size={16} />}
            {step.status === 'error' && <AlertCircle size={16} />}
            {step.status === 'pending' && <span className="progress-step-number">{index + 1}</span>}
          </div>
          <span className="progress-step-label">{step.label}</span>
          {index < steps.length - 1 && <div className="progress-step-connector" />}
        </div>
      ))}
    </div>
  )
}
