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
      <div className="form-group">
        <label htmlFor="caseName">Case Name</label>
        <input
          id="caseName"
          type="text"
          value={metadata.caseName}
          onChange={(e) => handleChange('caseName', e.target.value)}
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
        <label htmlFor="court">Court</label>
        <input
          id="court"
          type="text"
          value={metadata.court}
          onChange={(e) => handleChange('court', e.target.value)}
          placeholder="e.g., Superior Court of California"
        />
      </div>

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
  )
}
