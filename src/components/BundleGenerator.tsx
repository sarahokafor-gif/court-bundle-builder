import { useState } from 'react'
import { Download, FileText, Eye, CreditCard } from 'lucide-react'
import { Section, BundleMetadata, PageNumberSettings } from '../types'
import { generateBundle } from '../utils/bundleGenerator'
import { getPricingTier, formatPrice, isPaymentRequired } from '../utils/pricing'
import './BundleGenerator.css'

interface BundleGeneratorProps {
  metadata: BundleMetadata
  sections: Section[]
  pageNumberSettings: PageNumberSettings
}

export default function BundleGenerator({ metadata, sections, pageNumberSettings }: BundleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)
  const totalPages = sections.reduce(
    (sum, section) => sum + section.documents.reduce((docSum, doc) => docSum + doc.pageCount, 0),
    0
  )

  const pricingTier = getPricingTier(totalDocs)
  const needsPayment = isPaymentRequired(totalDocs)

  const handlePreview = async () => {
    if (!metadata.caseName || !metadata.caseNumber) {
      alert('Please fill in at least the case name and case number before previewing the bundle.')
      return
    }

    setIsGenerating(true)

    try {
      await generateBundle(metadata, sections, pageNumberSettings)
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
      // Call Netlify function to create Stripe checkout session
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentCount: totalDocs,
          bundleName: `${metadata.caseNumber} - ${metadata.caseName}`,
        }),
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Failed to initiate payment. Please try again.')
      setIsProcessingPayment(false)
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

      {/* Action Buttons */}
      {!needsPayment ? (
        // FREE tier: Direct download
        <button
          className="generate-button"
          onClick={handlePreview}
          disabled={isGenerating}
        >
          <Download size={20} />
          {isGenerating ? 'Generating Bundle...' : 'Generate & Download Bundle (FREE)'}
        </button>
      ) : (
        // PAID tier: Preview + Payment
        <div className="paid-bundle-actions">
          <button
            className="preview-button"
            onClick={handlePreview}
            disabled={isGenerating}
          >
            <Eye size={20} />
            {isGenerating ? 'Generating Preview...' : 'Preview Bundle (FREE)'}
          </button>

          <button
            className="payment-button"
            onClick={handlePayAndDownload}
            disabled={isProcessingPayment || isGenerating}
          >
            <CreditCard size={20} />
            {isProcessingPayment ? 'Processing...' : `Pay ${formatPrice(pricingTier.price)} & Download`}
          </button>
        </div>
      )}

      <p className="generate-hint">
        {!needsPayment
          ? 'The generated bundle will include a table of contents with sections, dividers, page numbers, and all documents.'
          : 'Preview your bundle for free. Payment is required to download bundles with 6+ documents.'}
      </p>
    </div>
  )
}
