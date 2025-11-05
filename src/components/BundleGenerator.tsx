import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Section, BundleMetadata, PageNumberSettings } from '../types'
import { generateBundle } from '../utils/bundleGenerator'
import './BundleGenerator.css'

interface BundleGeneratorProps {
  metadata: BundleMetadata
  sections: Section[]
  pageNumberSettings: PageNumberSettings
}

export default function BundleGenerator({ metadata, sections, pageNumberSettings }: BundleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
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

  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)
  const totalPages = sections.reduce(
    (sum, section) => sum + section.documents.reduce((docSum, doc) => docSum + doc.pageCount, 0),
    0
  )

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

      <button
        className="generate-button"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        <Download size={20} />
        {isGenerating ? 'Generating Bundle...' : 'Generate & Download Bundle'}
      </button>

      <p className="generate-hint">
        The generated bundle will include a table of contents with sections, dividers, page numbers, and all documents.
      </p>
    </div>
  )
}
