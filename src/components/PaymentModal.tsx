import { useState } from 'react'
import { X, Check, Clock, CreditCard, Sparkles, FileText, Loader2 } from 'lucide-react'
import {
  calculateBaseCost,
  calculateEditingCost,
  calculateTotal,
  formatPrice,
  getEditingTimeLimitString,
  isFreeTier,
  getPricingBreakdown
} from '../utils/pricing'
import './PaymentModal.css'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  pageCount: number
  bundleId: string
  onSelectBasic: () => Promise<void>
  onSelectWithEditing: () => Promise<void>
}

export default function PaymentModal({
  isOpen,
  onClose,
  pageCount,
  bundleId,
  onSelectBasic,
  onSelectWithEditing,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'basic' | 'editing' | null>(null)

  if (!isOpen) return null

  const baseCost = calculateBaseCost(pageCount)
  const editingCost = calculateEditingCost(pageCount)
  const totalWithEditing = calculateTotal(pageCount, true)
  const editingTimeString = getEditingTimeLimitString(pageCount)
  const isFree = isFreeTier(pageCount)
  const breakdown = getPricingBreakdown(pageCount, false)

  const handleSelectBasic = async () => {
    setSelectedOption('basic')
    setIsProcessing(true)
    try {
      await onSelectBasic()
    } finally {
      setIsProcessing(false)
      setSelectedOption(null)
    }
  }

  const handleSelectWithEditing = async () => {
    setSelectedOption('editing')
    setIsProcessing(true)
    try {
      await onSelectWithEditing()
    } finally {
      setIsProcessing(false)
      setSelectedOption(null)
    }
  }

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>Choose Your Bundle Option</h2>
          <p className="modal-subtitle">
            {pageCount} page bundle • {bundleId.slice(0, 8)}...
          </p>
        </div>

        {/* Pricing Breakdown */}
        {!isFree && breakdown.tierBreakdown.length > 1 && (
          <div className="pricing-breakdown">
            <h4>Price Breakdown</h4>
            <div className="breakdown-rows">
              {breakdown.tierBreakdown.map((tier, idx) => (
                <div key={idx} className="breakdown-row">
                  <span>{tier.pages} pages @ {tier.rate}</span>
                  <span>{formatPrice(tier.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="payment-options">
          {/* Option A: Basic Bundle */}
          <div
            className={`payment-option ${selectedOption === 'basic' ? 'selected' : ''} ${isFree ? 'free-option' : ''}`}
            onClick={!isProcessing ? handleSelectBasic : undefined}
          >
            <div className="option-header">
              <FileText size={32} className="option-icon" />
              <div className="option-title">
                <h3>Basic Bundle</h3>
                <span className="option-price">{formatPrice(baseCost)}</span>
              </div>
            </div>

            <div className="option-features">
              <div className="feature-item">
                <Check size={16} />
                <span>Professional pagination</span>
              </div>
              <div className="feature-item">
                <Check size={16} />
                <span>Clickable table of contents</span>
              </div>
              <div className="feature-item">
                <Check size={16} />
                <span>Section dividers</span>
              </div>
              <div className="feature-item">
                <Check size={16} />
                <span>PDF download</span>
              </div>
            </div>

            <button
              className={`option-btn ${isFree ? 'btn-success' : 'btn-primary'}`}
              disabled={isProcessing}
            >
              {isProcessing && selectedOption === 'basic' ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Processing...
                </>
              ) : isFree ? (
                'Download Free'
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay {formatPrice(baseCost)}
                </>
              )}
            </button>
          </div>

          {/* Option B: Bundle + Editing */}
          <div
            className={`payment-option editing-option ${selectedOption === 'editing' ? 'selected' : ''}`}
            onClick={!isProcessing ? handleSelectWithEditing : undefined}
          >
            <div className="recommended-badge">
              <Sparkles size={14} />
              Recommended
            </div>

            <div className="option-header">
              <Sparkles size={32} className="option-icon editing-icon" />
              <div className="option-title">
                <h3>Bundle + Editing</h3>
                <span className="option-price">{formatPrice(totalWithEditing)}</span>
              </div>
            </div>

            <div className="option-subtitle">
              <Clock size={14} />
              <span>{editingTimeString} editing time</span>
            </div>

            <div className="option-features">
              <div className="feature-item included">
                <Check size={16} />
                <span>Everything in Basic</span>
              </div>
              <div className="feature-item highlight">
                <Check size={16} />
                <span>Redaction tools</span>
              </div>
              <div className="feature-item highlight">
                <Check size={16} />
                <span>Erasure/white-out</span>
              </div>
              <div className="feature-item highlight">
                <Check size={16} />
                <span>Page removal</span>
              </div>
              <div className="feature-item highlight">
                <Check size={16} />
                <span>Multi-page editing</span>
              </div>
            </div>

            <div className="editing-price-breakdown">
              <span>Base: {formatPrice(baseCost)}</span>
              <span>+</span>
              <span>Editing: {formatPrice(editingCost)}</span>
            </div>

            <button
              className="option-btn btn-warning"
              disabled={isProcessing}
            >
              {isProcessing && selectedOption === 'editing' ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay {formatPrice(totalWithEditing)}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <p className="secure-notice">
            <CreditCard size={14} />
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
