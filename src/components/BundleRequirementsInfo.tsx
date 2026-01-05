import { useState } from 'react'
import { Info, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import bundleRequirementsData from '../data/bundleRequirements.json'
import './BundleRequirementsInfo.css'

export default function BundleRequirementsInfo() {
  const [isExpanded, setIsExpanded] = useState(false)

  const { version, last_updated, next_review_due, bundle_types } = bundleRequirementsData

  return (
    <div className="bundle-requirements-info">
      <button
        className="requirements-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Toggle bundle requirements information"
      >
        <Info size={20} />
        <span>📚 Bundle Requirements Guide - {Object.keys(bundle_types).length} Bundle Types</span>
        <span className="version-badge">v{version}</span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="requirements-content">
          <div className="requirements-header">
            <div className="review-status">
              <p className="last-updated">
                Last verified: <strong>{last_updated}</strong>
              </p>
              <p className="next-review">
                Next review due: <strong>{next_review_due}</strong>
              </p>
            </div>
            <p className="requirements-description">
              This guide contains official court bundle requirements from Practice Directions
              and court guidance. Requirements are reviewed monthly and sourced from official
              court websites.
            </p>
          </div>

          <div className="bundle-types-grid">
            {Object.entries(bundle_types).map(([key, bundleType]) => (
              <div key={key} className="bundle-type-card">
                <div className="bundle-type-header">
                  <span className="bundle-icon">{bundleType.icon}</span>
                  <h3>{bundleType.name}</h3>
                </div>

                <div className="bundle-type-details">
                  <div className="detail-row">
                    <span className="detail-label">Practice Direction:</span>
                    <span className="detail-value">{bundleType.practice_direction}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Last Reviewed:</span>
                    <span className="detail-value">{bundleType.last_reviewed}</span>
                  </div>

                  {bundleType.page_limit && (
                    <div className="detail-row">
                      <span className="detail-label">Page Limit:</span>
                      <span className="detail-value page-limit">
                        {bundleType.page_limit} pages
                      </span>
                    </div>
                  )}

                  {'notes' in bundleType && bundleType.notes && (
                    <div className="detail-row notes">
                      <span className="detail-label">Note:</span>
                      <span className="detail-value">{bundleType.notes}</span>
                    </div>
                  )}

                  {bundleType.source_url && (
                    <a
                      href={bundleType.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                      aria-label={`View official ${bundleType.name} Practice Direction`}
                    >
                      <ExternalLink size={14} />
                      View Official Practice Direction
                    </a>
                  )}
                </div>

                <div className="sections-summary">
                  <span className="sections-count">
                    {bundleType.sections.length} section template{bundleType.sections.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="requirements-footer">
            <p>
              <strong>⚠️ Important:</strong> Always verify requirements with your local court
              before submission. Requirements may vary by jurisdiction and case type.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
