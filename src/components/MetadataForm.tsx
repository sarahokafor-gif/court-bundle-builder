import { BundleMetadata } from '../types'
import './MetadataForm.css'

interface MetadataFormProps {
  metadata: BundleMetadata
  onChange: (metadata: BundleMetadata) => void
}

export default function MetadataForm({ metadata, onChange }: MetadataFormProps) {
  const handleChange = (field: keyof BundleMetadata, value: string) => {
    onChange({
      ...metadata,
      [field]: value,
    })
  }

  return (
    <div className="metadata-form">
      {/* First row: 3 columns */}
      <div className="form-row form-row-3">
        <div className="form-group">
          <label htmlFor="bundleTitle">Bundle Title</label>
          <input
            id="bundleTitle"
            type="text"
            value={metadata.bundleTitle}
            onChange={(e) => handleChange('bundleTitle', e.target.value)}
            placeholder="e.g., Smith v. Jones"
          />
        </div>

        <div className="form-group">
          <label htmlFor="caseNumber">Case Number</label>
          <input
            id="caseNumber"
            type="text"
            value={metadata.caseNumber}
            onChange={(e) => handleChange('caseNumber', e.target.value)}
            placeholder="e.g., 2024-CV-12345"
          />
        </div>

        <div className="form-group">
          <label htmlFor="court">Court Name</label>
          <input
            id="court"
            type="text"
            value={metadata.court}
            onChange={(e) => handleChange('court', e.target.value)}
            placeholder="e.g., Superior Court of California"
          />
        </div>
      </div>

      {/* Second row: 2 columns */}
      <div className="form-row form-row-2">
        <div className="form-group">
          <label htmlFor="applicantName">Applicant Name</label>
          <input
            id="applicantName"
            type="text"
            value={metadata.applicantName}
            onChange={(e) => handleChange('applicantName', e.target.value)}
            placeholder="e.g., John Smith"
          />
        </div>

        <div className="form-group">
          <label htmlFor="respondentName">Respondent Name</label>
          <input
            id="respondentName"
            type="text"
            value={metadata.respondentName}
            onChange={(e) => handleChange('respondentName', e.target.value)}
            placeholder="e.g., Jane Jones"
          />
        </div>
      </div>

      {/* Third row: 2 columns */}
      <div className="form-row form-row-2">
        <div className="form-group">
          <label htmlFor="preparerName">Prepared By</label>
          <input
            id="preparerName"
            type="text"
            value={metadata.preparerName}
            onChange={(e) => handleChange('preparerName', e.target.value)}
            placeholder="e.g., Sarah Wilson"
          />
        </div>

        <div className="form-group">
          <label htmlFor="preparerRole">Role</label>
          <input
            id="preparerRole"
            type="text"
            value={metadata.preparerRole}
            onChange={(e) => handleChange('preparerRole', e.target.value)}
            placeholder="e.g., Solicitor / Legal Assistant"
          />
        </div>
      </div>

      {/* Date field */}
      <div className="form-row form-row-1">
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={metadata.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
