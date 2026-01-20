import { Clock, AlertTriangle, AlertCircle, Infinity, CreditCard } from 'lucide-react'
import { TimerState, getWarningLevel, getWarningMessage } from '../hooks/useEditingTimer'
import './EditingTimer.css'

interface EditingTimerProps {
  timerState: TimerState
  onExtendTime?: () => void
  compact?: boolean
}

export default function EditingTimer({
  timerState,
  onExtendTime,
  compact = false,
}: EditingTimerProps) {
  const warningLevel = getWarningLevel(timerState)
  const warningMessage = getWarningMessage(timerState)

  // Don't render if no timer is active
  if (!timerState.isActive && !timerState.isExpired) {
    return null
  }

  // Compact mode for toolbar/header
  if (compact) {
    return (
      <div className={`editing-timer-compact ${warningLevel}`}>
        {timerState.isUnlimited ? (
          <>
            <Infinity size={16} />
            <span>Unlimited</span>
          </>
        ) : timerState.isExpired ? (
          <>
            <AlertCircle size={16} />
            <span>Expired</span>
          </>
        ) : (
          <>
            <Clock size={16} />
            <span>{timerState.formattedRemaining}</span>
          </>
        )}
      </div>
    )
  }

  // Full mode with progress bar
  return (
    <div className={`editing-timer ${warningLevel}`}>
      <div className="timer-header">
        <div className="timer-icon">
          {timerState.isUnlimited ? (
            <Infinity size={20} />
          ) : timerState.isExpired ? (
            <AlertCircle size={20} />
          ) : warningLevel !== 'none' ? (
            <AlertTriangle size={20} />
          ) : (
            <Clock size={20} />
          )}
        </div>
        <div className="timer-info">
          <span className="timer-label">
            {timerState.isExpired ? 'Editing Time Expired' : 'Editing Time Remaining'}
          </span>
          <span className="timer-value">
            {timerState.isUnlimited ? 'Unlimited' : timerState.formattedRemaining}
          </span>
        </div>
      </div>

      {/* Progress bar (not for unlimited) */}
      {!timerState.isUnlimited && (
        <div className="timer-progress-container">
          <div className="timer-progress-bar">
            <div
              className="timer-progress-fill"
              style={{ width: `${timerState.percentRemaining}%` }}
            />
          </div>
          <span className="timer-percent">{Math.round(timerState.percentRemaining)}%</span>
        </div>
      )}

      {/* Warning message */}
      {warningMessage && (
        <div className="timer-warning">
          <AlertTriangle size={14} />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Extend time button */}
      {(warningLevel === 'first' || warningLevel === 'final' || warningLevel === 'expired') && onExtendTime && (
        <button className="extend-time-btn" onClick={onExtendTime}>
          <CreditCard size={16} />
          {timerState.isExpired ? 'Purchase More Time' : 'Extend Time'}
        </button>
      )}
    </div>
  )
}

/**
 * Floating timer that appears in corner of screen
 */
export function FloatingEditingTimer({
  timerState,
  onExtendTime,
  onClose,
}: EditingTimerProps & { onClose?: () => void }) {
  const warningLevel = getWarningLevel(timerState)

  // Don't render if no timer is active
  if (!timerState.isActive && !timerState.isExpired) {
    return null
  }

  return (
    <div className={`floating-timer ${warningLevel}`}>
      <div className="floating-timer-content">
        <div className="floating-timer-icon">
          {timerState.isUnlimited ? (
            <Infinity size={24} />
          ) : timerState.isExpired ? (
            <AlertCircle size={24} />
          ) : warningLevel !== 'none' ? (
            <AlertTriangle size={24} />
          ) : (
            <Clock size={24} />
          )}
        </div>
        <div className="floating-timer-info">
          <span className="floating-timer-time">
            {timerState.isUnlimited ? 'Unlimited' : timerState.formattedRemaining}
          </span>
          {!timerState.isUnlimited && (
            <span className="floating-timer-label">editing time</span>
          )}
        </div>
      </div>

      {/* Quick extend button when warning */}
      {warningLevel !== 'none' && onExtendTime && (
        <button className="floating-extend-btn" onClick={onExtendTime}>
          <CreditCard size={14} />
          Extend
        </button>
      )}

      {onClose && (
        <button className="floating-close-btn" onClick={onClose} aria-label="Close timer">
          ×
        </button>
      )}
    </div>
  )
}
