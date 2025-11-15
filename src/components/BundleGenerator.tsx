import { useState } from 'react'
import { Download, FileText, List, Eye, CreditCard } from 'lucide-react'
import { Section, BundleMetadata, PageNumberSettings } from '../types'
import { generateBundle, generateIndexOnly, generateBundlePreview } from '../utils/bundleGenerator'
import { getPricingTier, formatPrice, isPaymentRequired } from '../utils/pricing'
import './BundleGenerator.css'

interface BundleGeneratorProps {
  metadata: BundleMetadata
  sections: Section[]
  pageNumberSettings: PageNumberSettings
}

export default function BundleGenerator({ metadata, sections, pageNumberSettings }: BundleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingIndex, setIsGeneratingIndex] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)
  const totalPages = sections.reduce(
    (sum, section) => sum + section.documents.reduce((docSum, doc) => docSum + doc.pageCount, 0),
    0
  )

  const pricingTier = getPricingTier(totalDocs)
  const needsPayment = isPaymentRequired(totalDocs)

  const handleGenerateIndexOnly = async () => {
    if (!metadata.caseName || !metadata.caseNumber) {
      alert('Please fill in at least the case name and case number before generating the index.')
      return
    }

    setIsGeneratingIndex(true)

    try {
      await generateIndexOnly(metadata, sections)
    } catch (error) {
      console.error('Error generating index:', error)
      alert('An error occurred while generating the index. Please try again.')
    } finally {
      setIsGeneratingIndex(false)
    }
  }

  const handleGeneratePreview = async () => {
    if (!metadata.caseName || !metadata.caseNumber) {
      alert('Please fill in at least the case name and case number before generating the bundle.')
      return
    }

    setIsGenerating(true)

    try {
      const url = await generateBundlePreview(metadata, sections, pageNumberSettings)
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error generating preview:', error)
      alert('An error occurred while generating the preview. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePayAndDownload = async () => {
    if (!metadata.caseName || !metadata.caseNumber) {
      alert('Please fill in at least the case name and case number before generating the bundle.')
      return
    }

    setIsProcessingPayment(true)

    try {
      // TODO: Implement Stripe payment flow
      // For now, just generate clean bundle
      alert('Payment processing will be implemented here. For now, generating clean bundle...')
      await generateBundle(metadata, sections, pageNumberSettings)
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
          <span className="tier-label">{pricingTier.description}</span>
          <span className="tier-price">{formatPrice(pricingTier.price)}</span>
        </div>
      </div>

      {/* Generate Index Only Button (Always Available) */}
      <button
        className="btn btn-info btn-block"
        onClick={handleGenerateIndexOnly}
        disabled={isGeneratingIndex}
        aria-label="Generate index only as a free PDF"
      >
        <List size={20} />
        {isGeneratingIndex ? 'Generating Index...' : 'Generate Index Only (FREE)'}
      </button>

      <p className="index-hint">
        Generate a draft index PDF to share with other parties for review and approval before creating the full bundle.
      </p>

      {/* Preview or Generate Button */}
      {!previewUrl ? (
        <>
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleGeneratePreview}
            disabled={isGenerating}
            aria-label="Generate preview bundle with watermark"
          >
            <Eye size={20} />
            {isGenerating ? 'Generating Preview...' : 'Generate Preview (FREE)'}
          </button>

          <p className="generate-hint">
            Generate a watermarked preview to review before{' '}
            {needsPayment ? `paying ${formatPrice(pricingTier.price)} for` : 'downloading'} the final bundle.
          </p>
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
                ? ` Pay ${formatPrice(pricingTier.price)} to download the clean version for court submission.`
                : ' Download the clean version below.'}
            </div>
          </div>

          {/* Payment/Download Button */}
          {needsPayment ? (
            <button
              className="btn btn-warning btn-lg btn-block"
              onClick={handlePayAndDownload}
              disabled={isProcessingPayment}
              aria-label={`Pay ${formatPrice(pricingTier.price)} and download clean bundle`}
            >
              <CreditCard size={20} />
              {isProcessingPayment
                ? 'Processing Payment...'
                : `Pay ${formatPrice(pricingTier.price)} & Download Clean Version`}
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
    </div>
  )
}
