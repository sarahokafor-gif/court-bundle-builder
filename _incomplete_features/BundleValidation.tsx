import { useMemo } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import { Section, BundleMetadata, BundleType } from '../types'
import './BundleValidation.css'

interface BundleValidationProps {
  metadata: BundleMetadata
  sections: Section[]
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  details?: string
}

// Court-specific requirements
const COURT_REQUIREMENTS: Record<BundleType | 'general', {
  maxPages?: number
  requiredSections?: string[]
  tips?: string[]
}> = {
  family: {
    maxPages: 350,
    tips: [
      'Include chronology at the start',
      'Separate section for position statements',
    ],
  },
  civil: {
    maxPages: 500,
    tips: [
      'Include case summary',
      'Chronological order for correspondence',
    ],
  },
  employment: {
    maxPages: 500,
    tips: [
      'Include ET1 and ET3 forms',
      'Separate section for witness statements',
    ],
  },
  tribunal: {
    maxPages: 500,
    tips: [
      'Include decision under appeal',
    ],
  },
  inquest: {
    maxPages: 500,
    tips: [
      'Include medical records in separate section',
    ],
  },
  'court-of-protection': {
    maxPages: 350,
    tips: [
      'Include capacity assessments',
      'Separate section for care plans',
    ],
  },
  general: {
    maxPages: 500,
  },
}

export default function BundleValidation({ metadata, sections }: BundleValidationProps) {
  const validation = useMemo(() => {
    const issues: ValidationIssue[] = []

    const totalDocs = sections.reduce((sum, s) => sum + s.documents.length, 0)
    const totalPages = sections.reduce(
      (sum, s) => sum + s.documents.reduce((dSum, d) => dSum + d.pageCount, 0),
      0
    )

    // Required metadata checks
    if (!metadata.bundleTitle.trim()) {
      issues.push({
        type: 'error',
        message: 'Bundle title is required',
        details: 'Enter the bundle title for the bundle front page',
      })
    }

    if (!metadata.caseNumber.trim()) {
      issues.push({
        type: 'error',
        message: 'Case number is required',
        details: 'Enter the case/claim number',
      })
    }

    if (!metadata.court.trim()) {
      issues.push({
        type: 'warning',
        message: 'Court name not specified',
        details: 'Adding the court name improves bundle clarity',
      })
    }

    // Document checks
    if (totalDocs === 0) {
      issues.push({
        type: 'error',
        message: 'No documents uploaded',
        details: 'Upload at least one PDF document',
      })
    }

    // Page count check based on bundle type
    const bundleType = metadata.bundleType || 'general'
    const requirements = COURT_REQUIREMENTS[bundleType]

    if (requirements.maxPages && totalPages > requirements.maxPages) {
      issues.push({
        type: 'warning',
        message: `Bundle exceeds ${requirements.maxPages} page limit`,
        details: `Current: ${totalPages} pages. Consider splitting into volumes or removing unnecessary documents.`,
      })
    }

    // Section organization checks
    if (sections.length === 1 && totalDocs > 10) {
      issues.push({
        type: 'info',
        message: 'Consider organizing into sections',
        details: 'Multiple sections (e.g., Statements, Correspondence, Evidence) improve navigation',
      })
    }

    // Empty sections check
    const emptySections = sections.filter(s => s.documents.length === 0)
    if (emptySections.length > 0 && totalDocs > 0) {
      issues.push({
        type: 'warning',
        message: `${emptySections.length} empty section(s)`,
        details: `Remove or add documents to: ${emptySections.map(s => s.name).join(', ')}`,
      })
    }

    // Document date checks
    const docsWithoutDates = sections.flatMap(s =>
      s.documents.filter(d => !d.documentDate)
    )
    if (docsWithoutDates.length > 0 && totalDocs > 3) {
      issues.push({
        type: 'info',
        message: `${docsWithoutDates.length} document(s) without dates`,
        details: 'Adding dates helps with chronological organization in the index',
      })
    }

    // Large single document warning
    const largeDocs = sections.flatMap(s =>
      s.documents.filter(d => d.pageCount > 50)
    )
    if (largeDocs.length > 0) {
      issues.push({
        type: 'info',
        message: `${largeDocs.length} large document(s) (50+ pages)`,
        details: 'Consider if all pages are necessary or if excerpts would suffice',
      })
    }

    return {
      issues,
      hasErrors: issues.some(i => i.type === 'error'),
      hasWarnings: issues.some(i => i.type === 'warning'),
      isValid: !issues.some(i => i.type === 'error'),
      totalDocs,
      totalPages,
      bundleType,
      tips: requirements.tips || [],
    }
  }, [metadata, sections])

  const errorCount = validation.issues.filter(i => i.type === 'error').length
  const warningCount = validation.issues.filter(i => i.type === 'warning').length
  const infoCount = validation.issues.filter(i => i.type === 'info').length

  return (
    <div className={`bundle-validation ${validation.isValid ? 'valid' : 'invalid'}`}>
      <div className="validation-header">
        {validation.isValid ? (
          <>
            <CheckCircle size={20} className="validation-icon success" />
            <span className="validation-title">Ready to generate</span>
          </>
        ) : (
          <>
            <XCircle size={20} className="validation-icon error" />
            <span className="validation-title">Issues found</span>
          </>
        )}

        <div className="validation-counts">
          {errorCount > 0 && (
            <span className="count-badge error">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
          )}
          {warningCount > 0 && (
            <span className="count-badge warning">{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
          )}
          {infoCount > 0 && (
            <span className="count-badge info">{infoCount} tip{infoCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {validation.issues.length > 0 && (
        <div className="validation-issues">
          {validation.issues.map((issue, index) => (
            <div key={index} className={`validation-issue ${issue.type}`}>
              <div className="issue-icon">
                {issue.type === 'error' && <XCircle size={16} />}
                {issue.type === 'warning' && <AlertTriangle size={16} />}
                {issue.type === 'info' && <Info size={16} />}
              </div>
              <div className="issue-content">
                <span className="issue-message">{issue.message}</span>
                {issue.details && (
                  <span className="issue-details">{issue.details}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {validation.tips.length > 0 && validation.isValid && (
        <div className="validation-tips">
          <span className="tips-title">Tips for {validation.bundleType} bundles:</span>
          <ul>
            {validation.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
