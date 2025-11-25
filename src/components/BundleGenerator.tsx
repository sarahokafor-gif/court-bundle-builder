import { useState, useEffect } from 'react'
import { Download, FileText, Eye, CreditCard, Sparkles } from 'lucide-react'
import { Section, BundleMetadata, PageNumberSettings } from '../types'
import { generateBundle, generateIndexOnly, generateBundlePreview, generateIndexPreview } from '../utils/bundleGenerator'
import {
  calculateBaseCost,
  calculateEditingCost,
  formatPrice,
  isPaymentRequired,
  getEditingTimeLimitString
} from '../utils/pricing'
import { usePaymentContext } from '../context/PaymentContext'
import PaymentModal from './PaymentModal'
import ProgressIndicator from './ProgressIndicator'
import './BundleGenerator.css'

interface BundleGeneratorProps {
  metadata: BundleMetadata
  sections: Section[]
  pageNumberSettings: PageNumberSettings
  generateButtonRef?: React.RefObject<HTMLButtonElement>
  generateIndexButtonRef?: React.RefObject<HTMLButtonElement>
}

export default function BundleGenerator({
  metadata,
  sections,
  pageNumberSettings,
  generateButtonRef,
  generateIndexButtonRef
}: BundleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingIndex, setIsGeneratingIndex] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [indexPreviewUrl, setIndexPreviewUrl] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [generationStep, setGenerationStep] = useState<string>('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Payment context
  const payment = usePaymentContext()

  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)
  const totalPages = sections.reduce(
    (sum, section) => sum + section.documents.reduce((docSum, doc) => docSum + doc.pageCount, 0),
    0
  )

  // Update payment context when page count changes
  useEffect(() => {
    if (totalPages > 0) {
      payment.setCurrentPageCount(totalPages)
      // Initialize bundle if not already done
      if (!payment.currentBundleId) {
        payment.initializeBundle(totalPages)
      }
    }
  }, [totalPages])

  // Auto-download bundle after successful payment callback
  useEffect(() => {
    if (payment.paymentJustCompleted && payment.isBaseUnlocked) {
      // Clear the flag first
      payment.clearPaymentCompleted()

      // Auto-generate and download the bundle
      const autoDownload = async () => {
        try {
          setGenerationStep('Payment successful! Generating your bundle...')
          await generateBundle(metadata, sections, pageNumberSettings)
          setGenerationStep('')
        } catch (error) {
          console.error('Error generating bundle after payment:', error)
          alert('Payment successful! But there was an error generating the bundle. Please try the download button.')
        }
      }
      autoDownload()
    }
  }, [payment.paymentJustCompleted, payment.isBaseUnlocked, metadata, sections, pageNumberSettings])

  // Page-based pricing
  const baseCost = calculateBaseCost(totalPages)
  const editingCost = calculateEditingCost(totalPages)
  const editingTimeString = getEditingTimeLimitString(totalPages)
  const needsPayment = isPaymentRequired(totalPages)

  const handleGenerateIndexPreview = async () => {
    if (!metadata.bundleTitle && !metadata.caseName) {
      alert('Please fill in at least the bundle title before generating the index.')
      return
    }

    setIsGeneratingIndex(true)
    setGenerationStep('Generating index preview...')

    try {
      const url = await generateIndexPreview(metadata, sections)
      setIndexPreviewUrl(url)
      setGenerationStep('Index preview ready!')
    } catch (error) {
      console.error('Error generating index preview:', error)
      alert('An error occurred while generating the index preview. Please try again.')
    } finally {
      setTimeout(() => {
        setIsGeneratingIndex(false)
        setGenerationStep('')
      }, 1000)
    }
  }

  const handleGenerateIndexOnly = async () => {
    if (!metadata.bundleTitle && !metadata.caseName) {
      alert('Please fill in at least the bundle title before generating the index.')
      return
    }

    setIsGeneratingIndex(true)
    setGenerationStep('Generating index...')

    try {
      await generateIndexOnly(metadata, sections)
      setGenerationStep('Index generated successfully!')
    } catch (error) {
      console.error('Error generating index:', error)
      alert('An error occurred while generating the index. Please try again.')
    } finally {
      setTimeout(() => {
        setIsGeneratingIndex(false)
        setGenerationStep('')
      }, 1000)
    }
  }

  const handleCloseIndexPreview = () => {
    if (indexPreviewUrl) {
      URL.revokeObjectURL(indexPreviewUrl)
      setIndexPreviewUrl(null)
    }
  }

  const handleGeneratePreview = async () => {
    if (!metadata.caseName || !metadata.caseNumber) {
      alert('Please fill in at least the case name and case number before generating the bundle.')
      return
    }

    setIsGenerating(true)
    setGenerationStep('Preparing bundle...')

    try {
      setTimeout(() => setGenerationStep('Merging documents...'), 500)
      setTimeout(() => setGenerationStep('Adding page numbers...'), 1500)
      setTimeout(() => setGenerationStep('Creating index...'), 2500)
      setTimeout(() => setGenerationStep('Adding watermark...'), 3500)

      const url = await generateBundlePreview(metadata, sections, pageNumberSettings)
      setPreviewUrl(url)
      setGenerationStep('Preview ready!')
    } catch (error) {
      console.error('Error generating preview:', error)
      alert('An error occurred while generating the preview. Please try again.')
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationStep('')
      }, 1000)
    }
  }

  const handlePayAndDownload = async () => {
    if (!metadata.caseName || !metadata.caseNumber) {
      alert('Please fill in at least the case name and case number before generating the bundle.')
      return
    }

    // Show payment modal
    setShowPaymentModal(true)
  }

  // Handle basic bundle purchase (no editing)
  const handlePurchaseBasic = async () => {
    setShowPaymentModal(false)
    setIsProcessingPayment(true)

    try {
      // Free tier - just generate the bundle
      if (!needsPayment) {
        await generateBundle(metadata, sections, pageNumberSettings)
        return
      }

      // Redirect to Stripe Checkout for paid tier
      await payment.handlePurchaseBase()
      // Note: User will be redirected to Stripe, then back to success URL
      // The bundle generation happens after successful payment callback
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handle bundle + editing purchase
  const handlePurchaseWithEditing = async () => {
    setShowPaymentModal(false)
    setIsProcessingPayment(true)

    try {
      // Redirect to Stripe Checkout with editing add-on
      await payment.handlePurchaseWithEditing()
      // Note: User will be redirected to Stripe, then back to success URL
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className="bundle-generator">
      <div className="bundle-summary">
        <FileText size={24} />
        <div className="summary-details">
          <div className="summary-item">
            <strong>Sections:</strong> {sections.length}
          </div>
          <div className="summary-item">
            <strong>Documents:</strong> {totalDocs}
          </div>
          <div className="summary-item">
            <strong>Total Pages:</strong> {totalPages}
          </div>
          <div className="summary-item">
            <strong>Case:</strong> {metadata.caseName || 'Not specified'} ({metadata.caseNumber || 'No case number'})
          </div>
        </div>
      </div>

      {/* Pricing Tier Display */}
      <div className={`pricing-tier ${needsPayment ? 'paid-tier' : 'free-tier'}`}>
        <div className="tier-info">
          <span className="tier-label">{totalPages} pages</span>
          <span className="tier-price">{formatPrice(baseCost)}</span>
        </div>
        {baseCost > 0 && (
          <div className="tier-editing-addon">
            <Sparkles size={14} />
            <span>+ Editing: {formatPrice(editingCost)} ({editingTimeString})</span>
          </div>
        )}
      </div>

      {/* Index Generation Section */}
      <div className="index-generation-section">
        <div className="button-group">
          <button
            className="btn btn-info"
            onClick={handleGenerateIndexPreview}
            disabled={isGeneratingIndex}
            aria-label="Preview index before downloading"
            style={{ flex: 1 }}
          >
            <Eye size={20} />
            Preview Index
          </button>

          <button
            ref={generateIndexButtonRef}
            className="btn btn-success"
            onClick={handleGenerateIndexOnly}
            disabled={isGeneratingIndex}
            aria-label="Download index as PDF"
            style={{ flex: 1 }}
          >
            <Download size={20} />
            Download Index
          </button>
        </div>

        {isGeneratingIndex && generationStep && (
          <div className="generation-progress">
            <ProgressIndicator
              status="loading"
              message={generationStep}
              variant="circular"
              size="medium"
            />
          </div>
        )}

        {!isGeneratingIndex && (
          <p className="index-hint">
            Preview the index to verify formatting, or download directly. Both options are FREE.
          </p>
        )}

        {/* Index Preview Display */}
        {indexPreviewUrl && (
          <div className="preview-container">
            <div className="preview-header">
              <h3>Index Preview (Draft)</h3>
              <button className="btn btn-secondary btn-sm" onClick={handleCloseIndexPreview} aria-label="Close index preview">
                ✕ Close
              </button>
            </div>
            <iframe
              src={indexPreviewUrl}
              className="pdf-preview"
              title="Index Preview"
            />
            <div className="preview-notice">
              <strong>ℹ️ Draft Preview:</strong> This index is marked as "DRAFT FOR REVIEW". Use the Download button above to get the final version.
            </div>
          </div>
        )}
      </div>

      {/* Preview or Generate Button */}
      {!previewUrl ? (
        <>
          <button
            ref={generateButtonRef}
            className="btn btn-primary btn-lg btn-block"
            onClick={handleGeneratePreview}
            disabled={isGenerating}
            aria-label="Generate preview bundle with watermark"
          >
            <Eye size={20} />
            {isGenerating ? 'Generating Preview...' : 'Generate Preview (FREE)'}
          </button>

          {isGenerating && generationStep && (
            <div className="generation-progress">
              <ProgressIndicator
                status="loading"
                message={generationStep}
                variant="circular"
                size="medium"
              />
            </div>
          )}

          {!isGenerating && (
            <p className="generate-hint">
              Generate a watermarked preview to review before{' '}
              {needsPayment ? `paying ${formatPrice(baseCost)} for` : 'downloading'} the final bundle.
            </p>
          )}
        </>
      ) : (
        <>
          {/* Preview Display */}
          <div className="preview-container">
            <div className="preview-header">
              <h3>Bundle Preview (Watermarked)</h3>
              <button className="btn btn-secondary btn-sm" onClick={handleClosePreview} aria-label="Close preview">
                ✕ Close
              </button>
            </div>
            <iframe
              src={previewUrl}
              className="pdf-preview"
              title="Bundle Preview"
            />
            <div className="preview-notice">
              <strong>⚠️ Preview Only:</strong> This PDF contains a "PREVIEW - NOT FOR OFFICIAL USE" watermark.
              {needsPayment
                ? ` Pay ${formatPrice(baseCost)} to download the clean version for court submission.`
                : ' Download the clean version below.'}
            </div>
          </div>

          {/* Payment/Download Button */}
          {needsPayment ? (
            <button
              className="btn btn-warning btn-lg btn-block"
              onClick={handlePayAndDownload}
              disabled={isProcessingPayment}
              aria-label={`Pay ${formatPrice(baseCost)} and download clean bundle`}
            >
              <CreditCard size={20} />
              {isProcessingPayment
                ? 'Processing Payment...'
                : `Pay ${formatPrice(baseCost)} & Download Clean Version`}
            </button>
          ) : (
            <button
              className="btn btn-success btn-lg btn-block"
              onClick={async () => {
                try {
                  await generateBundle(metadata, sections, pageNumberSettings)
                } catch (error) {
                  alert('An error occurred while generating the bundle.')
                }
              }}
              aria-label="Download clean bundle for free"
            >
              <Download size={20} />
              Download Clean Version (FREE)
            </button>
          )}
        </>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        pageCount={totalPages}
        bundleId={payment.currentBundleId || 'new-bundle'}
        onSelectBasic={handlePurchaseBasic}
        onSelectWithEditing={handlePurchaseWithEditing}
      />
    </div>
  )
}
