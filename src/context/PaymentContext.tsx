import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react'
import { usePayment } from '../hooks/usePayment'
import { useEditingTimerFromPayment, TimerState } from '../hooks/useEditingTimer'
import { calculateBaseCost, calculateEditingCost, getEditingTimeLimit, isFreeTier } from '../utils/pricing'
import { redirectToCheckout } from '../utils/stripe'

interface PaymentContextValue {
  // Current bundle state
  currentBundleId: string | null
  currentPageCount: number
  setCurrentPageCount: (count: number) => void

  // Payment status
  isBaseUnlocked: boolean
  isEditingUnlocked: boolean
  isEditingExpired: boolean

  // Timer state
  timerState: TimerState

  // Pricing
  baseCost: number
  editingCost: number
  totalCost: number
  editingTimeMinutes: number
  isFree: boolean

  // Actions
  initializeBundle: (pageCount: number) => string
  handlePurchaseBase: () => Promise<void>
  handlePurchaseWithEditing: () => Promise<void>
  handleExtendTime: () => void

  // Modal state
  showPaymentModal: boolean
  setShowPaymentModal: (show: boolean) => void
  paymentModalMode: 'bundle' | 'extend'
  setPaymentModalMode: (mode: 'bundle' | 'extend') => void

  // For development/demo: simulate payment success
  simulatePayment: (includesEditing: boolean) => void
}

const PaymentContext = createContext<PaymentContextValue | null>(null)

interface PaymentProviderProps {
  children: ReactNode
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const payment = usePayment()
  const [currentPageCount, setCurrentPageCount] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentModalMode, setPaymentModalMode] = useState<'bundle' | 'extend'>('bundle')

  // Get current bundle status
  const status = payment.getCurrentBundleStatus()

  // Calculate pricing based on current page count
  const baseCost = calculateBaseCost(currentPageCount)
  const editingCost = calculateEditingCost(currentPageCount)
  const totalCost = baseCost + editingCost
  const editingTimeMinutes = getEditingTimeLimit(currentPageCount)
  const isFree = isFreeTier(currentPageCount)

  // Timer state for editing
  const timerState = useEditingTimerFromPayment(
    status?.editingPaid ?? false,
    status?.editingEndTime ?? null,
    status?.editingTimeMinutes ?? 0,
    {
      onFirstWarning: () => {
        console.log('75% of editing time used - first warning')
        // Could show a toast notification here
      },
      onFinalWarning: () => {
        console.log('90% of editing time used - final warning')
        // Could show a more urgent notification
      },
      onExpired: () => {
        console.log('Editing time expired')
        // Could show expiration modal
      },
    }
  )

  // Initialize bundle when page count changes significantly
  const initializeBundle = useCallback((pageCount: number): string => {
    setCurrentPageCount(pageCount)
    return payment.createBundle(pageCount)
  }, [payment])

  // Handle purchase actions
  const handlePurchaseBase = useCallback(async () => {
    if (!payment.currentBundleId) return

    // If free tier, just mark as paid
    if (isFree) {
      payment.recordBasePayment(payment.currentBundleId)
      setShowPaymentModal(false)
      return
    }

    // Redirect to Stripe checkout
    try {
      await redirectToCheckout({
        bundleId: payment.currentBundleId,
        pageCount: currentPageCount,
        includesEditing: false,
      })
    } catch (error) {
      console.error('Failed to initiate checkout:', error)
      alert('Failed to initiate checkout. Please try again.')
    }
  }, [payment, isFree, currentPageCount])

  const handlePurchaseWithEditing = useCallback(async () => {
    if (!payment.currentBundleId) return

    // Redirect to Stripe checkout
    try {
      await redirectToCheckout({
        bundleId: payment.currentBundleId,
        pageCount: currentPageCount,
        includesEditing: true,
      })
    } catch (error) {
      console.error('Failed to initiate checkout:', error)
      alert('Failed to initiate checkout. Please try again.')
    }
  }, [payment, currentPageCount])

  const handleExtendTime = useCallback(() => {
    setPaymentModalMode('extend')
    setShowPaymentModal(true)
  }, [])

  // Simulate payment for development/demo purposes
  const simulatePayment = useCallback((includesEditing: boolean) => {
    if (!payment.currentBundleId) {
      const bundleId = initializeBundle(currentPageCount || 50)
      if (includesEditing) {
        payment.recordEditingPayment(bundleId, 'simulated_session')
      } else {
        payment.recordBasePayment(bundleId, 'simulated_session')
      }
    } else {
      if (includesEditing) {
        payment.recordEditingPayment(payment.currentBundleId, 'simulated_session')
      } else {
        payment.recordBasePayment(payment.currentBundleId, 'simulated_session')
      }
    }
    setShowPaymentModal(false)
  }, [payment, currentPageCount, initializeBundle])

  // Check URL for payment success callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const bundleId = params.get('bundle_id')
    const includesEditing = params.get('editing') === 'true'

    if (sessionId && bundleId) {
      // Payment was successful
      if (includesEditing) {
        payment.recordEditingPayment(bundleId, sessionId)
      } else {
        payment.recordBasePayment(bundleId, sessionId)
      }
      payment.setCurrentBundleId(bundleId)

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [payment])

  const value: PaymentContextValue = {
    currentBundleId: payment.currentBundleId,
    currentPageCount,
    setCurrentPageCount,

    isBaseUnlocked: payment.currentBundleId ? payment.isBaseUnlocked(payment.currentBundleId) : false,
    isEditingUnlocked: payment.currentBundleId ? payment.isEditingUnlocked(payment.currentBundleId) : false,
    isEditingExpired: payment.currentBundleId ? payment.isEditingExpired(payment.currentBundleId) : false,

    timerState,

    baseCost,
    editingCost,
    totalCost,
    editingTimeMinutes,
    isFree,

    initializeBundle,
    handlePurchaseBase,
    handlePurchaseWithEditing,
    handleExtendTime,

    showPaymentModal,
    setShowPaymentModal,
    paymentModalMode,
    setPaymentModalMode,

    simulatePayment,
  }

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  )
}

export function usePaymentContext() {
  const context = useContext(PaymentContext)
  if (!context) {
    throw new Error('usePaymentContext must be used within a PaymentProvider')
  }
  return context
}

export default PaymentContext
