import { useState, useCallback, useEffect } from 'react'
import { calculateBaseCost, calculateEditingCost, getEditingTimeLimit } from '../utils/pricing'

/**
 * Payment status for a bundle
 */
export interface PaymentStatus {
  bundleId: string
  pageCount: number
  basePaid: boolean
  editingPaid: boolean
  editingTimeMinutes: number
  editingStartTime: number | null // timestamp when editing started
  editingEndTime: number | null // timestamp when editing expires
  stripeSessionId?: string
  createdAt: number
}

/**
 * Storage key for payment data
 */
const PAYMENT_STORAGE_KEY = 'court_bundle_payments'

/**
 * Generate a unique bundle ID
 */
function generateBundleId(): string {
  return `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Load payment data from localStorage
 */
function loadPaymentData(): Record<string, PaymentStatus> {
  try {
    const data = localStorage.getItem(PAYMENT_STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    console.error('Failed to load payment data from localStorage')
    return {}
  }
}

/**
 * Save payment data to localStorage
 */
function savePaymentData(data: Record<string, PaymentStatus>): void {
  try {
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(data))
  } catch {
    console.error('Failed to save payment data to localStorage')
  }
}

/**
 * Hook for managing payment state
 */
export function usePayment() {
  const [payments, setPayments] = useState<Record<string, PaymentStatus>>(() => loadPaymentData())
  const [currentBundleId, setCurrentBundleId] = useState<string | null>(null)

  // Persist payments to localStorage whenever they change
  useEffect(() => {
    savePaymentData(payments)
  }, [payments])

  /**
   * Create a new bundle session
   */
  const createBundle = useCallback((pageCount: number): string => {
    const bundleId = generateBundleId()
    const baseCost = calculateBaseCost(pageCount)
    const editingTimeMinutes = getEditingTimeLimit(pageCount)

    const newStatus: PaymentStatus = {
      bundleId,
      pageCount,
      basePaid: baseCost === 0, // Free tier is auto-paid
      editingPaid: false,
      editingTimeMinutes,
      editingStartTime: null,
      editingEndTime: null,
      createdAt: Date.now(),
    }

    setPayments(prev => ({
      ...prev,
      [bundleId]: newStatus,
    }))

    setCurrentBundleId(bundleId)
    return bundleId
  }, [])

  /**
   * Get payment status for a bundle
   */
  const getPaymentStatus = useCallback((bundleId: string): PaymentStatus | null => {
    return payments[bundleId] || null
  }, [payments])

  /**
   * Get current bundle status
   */
  const getCurrentBundleStatus = useCallback((): PaymentStatus | null => {
    if (!currentBundleId) return null
    return payments[currentBundleId] || null
  }, [currentBundleId, payments])

  /**
   * Record successful base payment
   */
  const recordBasePayment = useCallback((bundleId: string, stripeSessionId?: string): void => {
    setPayments(prev => {
      const existing = prev[bundleId]
      if (!existing) return prev

      return {
        ...prev,
        [bundleId]: {
          ...existing,
          basePaid: true,
          stripeSessionId: stripeSessionId || existing.stripeSessionId,
        },
      }
    })
  }, [])

  /**
   * Record successful editing payment and start timer
   */
  const recordEditingPayment = useCallback((bundleId: string, stripeSessionId?: string): void => {
    setPayments(prev => {
      const existing = prev[bundleId]
      if (!existing) return prev

      const now = Date.now()
      const editingMinutes = existing.editingTimeMinutes
      const endTime = editingMinutes === -1 ? null : now + (editingMinutes * 60 * 1000)

      return {
        ...prev,
        [bundleId]: {
          ...existing,
          basePaid: true, // Editing includes base
          editingPaid: true,
          editingStartTime: now,
          editingEndTime: endTime,
          stripeSessionId: stripeSessionId || existing.stripeSessionId,
        },
      }
    })
  }, [])

  /**
   * Record combined base + editing payment
   */
  const recordFullPayment = useCallback((bundleId: string, stripeSessionId?: string): void => {
    recordEditingPayment(bundleId, stripeSessionId)
  }, [recordEditingPayment])

  /**
   * Check if base bundle is unlocked
   */
  const isBaseUnlocked = useCallback((bundleId: string): boolean => {
    const status = payments[bundleId]
    return status?.basePaid ?? false
  }, [payments])

  /**
   * Check if editing features are unlocked and not expired
   */
  const isEditingUnlocked = useCallback((bundleId: string): boolean => {
    const status = payments[bundleId]
    if (!status?.editingPaid) return false

    // Unlimited editing (301+ pages)
    if (status.editingEndTime === null) return true

    // Check if timer has expired
    return Date.now() < status.editingEndTime
  }, [payments])

  /**
   * Get remaining editing time in milliseconds
   * Returns -1 for unlimited, 0 if expired, or remaining ms
   */
  const getRemainingEditingTime = useCallback((bundleId: string): number => {
    const status = payments[bundleId]
    if (!status?.editingPaid) return 0

    // Unlimited editing
    if (status.editingEndTime === null) return -1

    const remaining = status.editingEndTime - Date.now()
    return Math.max(0, remaining)
  }, [payments])

  /**
   * Extend editing time (for time extension purchases)
   */
  const extendEditingTime = useCallback((bundleId: string, additionalMinutes: number): void => {
    setPayments(prev => {
      const existing = prev[bundleId]
      if (!existing?.editingPaid || existing.editingEndTime === null) return prev

      const newEndTime = existing.editingEndTime + (additionalMinutes * 60 * 1000)

      return {
        ...prev,
        [bundleId]: {
          ...existing,
          editingEndTime: newEndTime,
        },
      }
    })
  }, [])

  /**
   * Check if editing time has expired
   */
  const isEditingExpired = useCallback((bundleId: string): boolean => {
    const status = payments[bundleId]
    if (!status?.editingPaid) return false
    if (status.editingEndTime === null) return false // Unlimited never expires

    return Date.now() >= status.editingEndTime
  }, [payments])

  /**
   * Clean up old payment records (older than 7 days)
   */
  const cleanupOldPayments = useCallback((): void => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

    setPayments(prev => {
      const cleaned: Record<string, PaymentStatus> = {}
      for (const [id, status] of Object.entries(prev)) {
        if (status.createdAt > sevenDaysAgo) {
          cleaned[id] = status
        }
      }
      return cleaned
    })
  }, [])

  /**
   * Get pricing for current page count
   */
  const getPricing = useCallback((pageCount: number) => {
    return {
      baseCost: calculateBaseCost(pageCount),
      editingCost: calculateEditingCost(pageCount),
      editingTimeMinutes: getEditingTimeLimit(pageCount),
    }
  }, [])

  return {
    // State
    currentBundleId,
    setCurrentBundleId,

    // Bundle management
    createBundle,
    getPaymentStatus,
    getCurrentBundleStatus,

    // Payment recording
    recordBasePayment,
    recordEditingPayment,
    recordFullPayment,

    // Access checks
    isBaseUnlocked,
    isEditingUnlocked,
    isEditingExpired,
    getRemainingEditingTime,

    // Time management
    extendEditingTime,

    // Utilities
    cleanupOldPayments,
    getPricing,
  }
}

export default usePayment
