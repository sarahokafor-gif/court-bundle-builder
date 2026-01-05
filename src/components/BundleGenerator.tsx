import { useState } from 'react'
import { Download, FileText, List, Eye } from 'lucide-react'
import { Section, BundleMetadata, PageNumberSettings } from '../types'
import { generateBundle, generateIndexOnly, generateBundlePreview } from '../utils/bundleGenerator'
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

  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)
  const totalPages = sections.reduce(
    (sum, section) => sum + section.documents.reduce((docSum, doc) => docSum + doc.pageCount, 0),
    0
  )

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

  const handleDownload = async () => {
    if (!metadata.caseName || !metadata.caseNumber) {
      alert('Please fill in at least the case name and case number before generating the bundle.')
      return
    }

    setIsGenerating(true)

    try {
      await generateBundle(metadata, sections, pageNumberSettings)
    } catch (error) {
      console.error('Error generating bundle:', error)
      alert('An error occurred while generating the bundle. Please try again.')
    } finally {
      setIsGenerating(false)
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

      {/* Free Access Banner */}
      <div className="free-access-banner">
        <div className="free-badge">FREE</div>
        <div className="free-message">
          All features are free for registered users. No limits, no payments!
        </div>
      </div>

      {/* Generate Index Only Button */}
      <button
        className="btn btn-info btn-block"
        onClick={handleGenerateIndexOnly}
        disabled={isGeneratingIndex}
        aria-label="Generate index only as a free PDF"
      >
        <List size={20} />
        {isGeneratingIndex ? 'Generating Index...' : 'Generate Index Only'}
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
            aria-label="Generate preview bundle"
          >
            <Eye size={20} />
            {isGenerating ? 'Generating Preview...' : 'Generate Preview'}
          </button>

          <p className="generate-hint">
            Generate a preview to review before downloading the final bundle.
          </p>
        </>
      ) : (
        <>
          {/* Preview Display */}
          <div className="preview-container">
            <div className="preview-header">
              <h3>Bundle Preview</h3>
              <button className="btn btn-secondary btn-sm" onClick={handleClosePreview} aria-label="Close preview">
                Close
              </button>
            </div>
            <iframe
              src={previewUrl}
              className="pdf-preview"
              title="Bundle Preview"
            />
          </div>

          {/* Download Button - Always Free */}
          <button
            className="btn btn-success btn-lg btn-block"
            onClick={handleDownload}
            disabled={isGenerating}
            aria-label="Download clean bundle"
          >
            <Download size={20} />
            {isGenerating ? 'Generating...' : 'Download Bundle'}
          </button>
        </>
      )}
    </div>
  )
}
