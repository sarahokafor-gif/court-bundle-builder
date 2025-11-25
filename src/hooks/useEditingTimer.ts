import { useState, useEffect, useRef } from 'react'

/**
 * Warning thresholds for editing time
 */
export const WARNING_THRESHOLDS = {
  FIRST_WARNING: 0.75, // 75% of time used (25% remaining)
  FINAL_WARNING: 0.90, // 90% of time used (10% remaining)
} as const

/**
 * Timer state
 */
export interface TimerState {
  isActive: boolean
  isUnlimited: boolean
  totalMinutes: number
  remainingMs: number
  percentUsed: number
  percentRemaining: number
  formattedRemaining: string
  hasFirstWarning: boolean
  hasFinalWarning: boolean
  isExpired: boolean
}

/**
 * Format milliseconds to human-readable time string
 */
function formatTime(ms: number): string {
  if (ms <= 0) return '0:00'

  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Hook for managing editing timer with warnings
 *
 * @param endTime - Unix timestamp when editing expires (null for unlimited)
 * @param totalMinutes - Total editing minutes purchased
 * @param onFirstWarning - Callback when 75% of time has been used
 * @param onFinalWarning - Callback when 90% of time has been used
 * @param onExpired - Callback when time has completely expired
 */
export function useEditingTimer(
  endTime: number | null,
  totalMinutes: number,
  onFirstWarning?: () => void,
  onFinalWarning?: () => void,
  onExpired?: () => void
): TimerState {
  const [timerState, setTimerState] = useState<TimerState>(() => ({
    isActive: false,
    isUnlimited: endTime === null,
    totalMinutes,
    remainingMs: 0,
    percentUsed: 0,
    percentRemaining: 100,
    formattedRemaining: 'Unlimited',
    hasFirstWarning: false,
    hasFinalWarning: false,
    isExpired: false,
  }))

  // Track which warnings have been fired to prevent duplicate callbacks
  const firstWarningFired = useRef(false)
  const finalWarningFired = useRef(false)
  const expiredFired = useRef(false)

  // Reset warning flags when endTime changes (new session)
  useEffect(() => {
    firstWarningFired.current = false
    finalWarningFired.current = false
    expiredFired.current = false
  }, [endTime])

  // Timer update logic
  useEffect(() => {
    // Unlimited editing - no timer needed
    if (endTime === null) {
      setTimerState({
        isActive: true,
        isUnlimited: true,
        totalMinutes,
        remainingMs: -1,
        percentUsed: 0,
        percentRemaining: 100,
        formattedRemaining: 'Unlimited',
        hasFirstWarning: false,
        hasFinalWarning: false,
        isExpired: false,
      })
      return
    }

    const totalMs = totalMinutes * 60 * 1000

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, endTime - now)
      const used = totalMs - remaining
      const percentUsed = Math.min(100, (used / totalMs) * 100)
      const percentRemaining = 100 - percentUsed

      const hasFirstWarning = percentUsed >= WARNING_THRESHOLDS.FIRST_WARNING * 100
      const hasFinalWarning = percentUsed >= WARNING_THRESHOLDS.FINAL_WARNING * 100
      const isExpired = remaining <= 0

      // Fire callbacks only once per threshold
      if (hasFirstWarning && !firstWarningFired.current && onFirstWarning) {
        firstWarningFired.current = true
        onFirstWarning()
      }

      if (hasFinalWarning && !finalWarningFired.current && onFinalWarning) {
        finalWarningFired.current = true
        onFinalWarning()
      }

      if (isExpired && !expiredFired.current && onExpired) {
        expiredFired.current = true
        onExpired()
      }

      setTimerState({
        isActive: !isExpired,
        isUnlimited: false,
        totalMinutes,
        remainingMs: remaining,
        percentUsed,
        percentRemaining,
        formattedRemaining: formatTime(remaining),
        hasFirstWarning,
        hasFinalWarning,
        isExpired,
      })
    }

    // Initial update
    updateTimer()

    // Update every second while timer is active
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime, totalMinutes, onFirstWarning, onFinalWarning, onExpired])

  return timerState
}

/**
 * Simplified hook that uses payment status
 */
export function useEditingTimerFromPayment(
  editingPaid: boolean,
  editingEndTime: number | null,
  editingTimeMinutes: number,
  callbacks?: {
    onFirstWarning?: () => void
    onFinalWarning?: () => void
    onExpired?: () => void
  }
): TimerState {
  const defaultState: TimerState = {
    isActive: false,
    isUnlimited: false,
    totalMinutes: 0,
    remainingMs: 0,
    percentUsed: 0,
    percentRemaining: 100,
    formattedRemaining: '--:--',
    hasFirstWarning: false,
    hasFinalWarning: false,
    isExpired: false,
  }

  const timerState = useEditingTimer(
    editingPaid ? editingEndTime : null,
    editingTimeMinutes,
    callbacks?.onFirstWarning,
    callbacks?.onFinalWarning,
    callbacks?.onExpired
  )

  // Return default state if editing not paid
  if (!editingPaid) {
    return defaultState
  }

  return timerState
}

/**
 * Get warning level based on timer state
 * Returns: 'none' | 'first' | 'final' | 'expired'
 */
export function getWarningLevel(timerState: TimerState): 'none' | 'first' | 'final' | 'expired' {
  if (timerState.isExpired) return 'expired'
  if (timerState.hasFinalWarning) return 'final'
  if (timerState.hasFirstWarning) return 'first'
  return 'none'
}

/**
 * Get warning message based on timer state
 */
export function getWarningMessage(timerState: TimerState): string | null {
  if (timerState.isUnlimited) return null

  if (timerState.isExpired) {
    return 'Your editing time has expired. Purchase more time to continue editing.'
  }

  if (timerState.hasFinalWarning) {
    return `Only ${timerState.formattedRemaining} remaining! Save your work now.`
  }

  if (timerState.hasFirstWarning) {
    return `${timerState.formattedRemaining} remaining. Consider saving your progress.`
  }

  return null
}

export default useEditingTimer
