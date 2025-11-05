import { Info } from 'lucide-react'
import { BundleType } from '../types'
import './BundleTypeSelector.css'

interface BundleTypeOption {
  value: BundleType
  label: string
  description: string
  guidance: string[]
  practiceDirection?: string
}

const BUNDLE_TYPES: BundleTypeOption[] = [
  {
    value: 'family',
    label: 'Family Court Bundle',
    description: 'For family proceedings in England & Wales',
    guidance: [
      'Follow Practice Direction 27A',
      'Include chronology and case summary',
      'Number pages continuously',
      'Use tabs/dividers between sections',
      'Maximum 350 pages (seek permission for larger bundles)',
    ],
    practiceDirection: 'https://www.justice.gov.uk/courts/procedure-rules/family/practice_directions/pd_part_27a',
  },
  {
    value: 'civil',
    label: 'Civil Court Bundle',
    description: 'For civil proceedings',
    guidance: [
      'Follow CPR Practice Direction 39A',
      'Include key documents only',
      'Number pages sequentially',
      'Include index at front',
      'Agreed bundles where possible',
    ],
    practiceDirection: 'https://www.justice.gov.uk/courts/procedure-rules/civil',
  },
  {
    value: 'employment',
    label: 'Employment Tribunal',
    description: 'For employment tribunal hearings',
    guidance: [
      'Follow tribunal practice directions',
      'Include statement of issues',
      'Chronological order usually best',
      'Include witness statements',
      'Agreed bundle if possible',
    ],
  },
  {
    value: 'inquest',
    label: 'Inquest Bundle',
    description: "For coroner's inquests",
    guidance: [
      "Follow coroner's directions",
      'Include Rule 43 reports if applicable',
      'Chronological medical records',
      'Witness statements',
      'Police reports/investigation documents',
    ],
  },
  {
    value: 'tribunal',
    label: 'Other Tribunal',
    description: 'For other tribunal proceedings',
    guidance: [
      'Check specific tribunal rules',
      'Include relevant statutory provisions',
      'Chronological order typically required',
      'Include all relied-upon documents',
      'Follow any case management directions',
    ],
  },
  {
    value: 'court-of-protection',
    label: 'Court of Protection Bundle',
    description: 'For Court of Protection proceedings (mental capacity)',
    guidance: [
      'Follow Practice Direction 14E',
      'Include all relevant assessments (medical, social work)',
      'Include care plans and support documents',
      'Chronological order for medical evidence',
      'Maximum 350 pages (seek permission for larger)',
      'Consider P\'s views and wishes',
    ],
    practiceDirection: 'https://www.gov.uk/courts-tribunals/court-of-protection',
  },
  {
    value: 'general',
    label: 'General Court Bundle',
    description: 'For other court proceedings',
    guidance: [
      'Check specific court requirements',
      'Number pages continuously',
      'Include clear index',
      'Use section dividers',
      'Include only relevant documents',
    ],
  },
]

interface BundleTypeSelectorProps {
  selectedType?: BundleType
  onTypeChange: (type: BundleType) => void
}

export default function BundleTypeSelector({ selectedType, onTypeChange }: BundleTypeSelectorProps) {
  const selectedOption = BUNDLE_TYPES.find(t => t.value === selectedType)

  return (
    <div className="bundle-type-selector">
      <h3>Bundle Type & Guidance</h3>

      <div className="type-select-wrapper">
        <label htmlFor="bundle-type">What type of bundle are you creating?</label>
        <select
          id="bundle-type"
          value={selectedType || 'general'}
          onChange={(e) => onTypeChange(e.target.value as BundleType)}
          className="type-select"
        >
          <option value="">Select bundle type...</option>
          {BUNDLE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {selectedOption && (
        <div className="type-guidance">
          <div className="guidance-header">
            <Info size={20} />
            <h4>{selectedOption.label} - Key Requirements</h4>
          </div>

          <p className="guidance-description">{selectedOption.description}</p>

          <ul className="guidance-list">
            {selectedOption.guidance.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          {selectedOption.practiceDirection && (
            <a
              href={selectedOption.practiceDirection}
              target="_blank"
              rel="noopener noreferrer"
              className="practice-direction-link"
            >
              View Official Practice Direction →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
