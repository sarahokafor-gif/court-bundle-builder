import { BundleMetadata, Party } from '../types'
import { Plus, Trash2 } from 'lucide-react'
import './MetadataForm.css'

interface MetadataFormProps {
  metadata: BundleMetadata
  onChange: (metadata: BundleMetadata) => void
}

const APPLICANT_DESIGNATIONS = [
  'Claimant', 'First Claimant', 'Second Claimant', 'Third Claimant',
  'Applicant', 'First Applicant', 'Second Applicant',
  'Appellant', 'First Appellant', 'Second Appellant',
]

const RESPONDENT_DESIGNATIONS = [
  'Defendant', 'First Defendant', 'Second Defendant', 'Third Defendant',
  'Respondent', 'First Respondent', 'Second Respondent', 'Third Respondent',
  'Interested Party', 'Intervener',
]

export default function MetadataForm({ metadata, onChange }: MetadataFormProps) {
  const handleChange = (field: keyof BundleMetadata, value: string | boolean) => {
    onChange({
      ...metadata,
      [field]: value,
    })
  }

  const handleAddApplicant = () => {
    const currentApplicants = metadata.applicants || []
    const defaultDesignation = currentApplicants.length === 0 ? 'Claimant' :
      `${['First', 'Second', 'Third'][Math.min(currentApplicants.length, 2)]} Claimant`
    onChange({
      ...metadata,
      applicants: [...currentApplicants, { name: '', designation: defaultDesignation }],
    })
  }

  const handleAddRespondent = () => {
    const currentRespondents = metadata.respondents || []
    const defaultDesignation = currentRespondents.length === 0 ? 'Defendant' :
      `${['First', 'Second', 'Third'][Math.min(currentRespondents.length, 2)]} Defendant`
    onChange({
      ...metadata,
      respondents: [...currentRespondents, { name: '', designation: defaultDesignation }],
    })
  }

  const handleUpdateApplicant = (index: number, field: keyof Party, value: string) => {
    const updated = [...(metadata.applicants || [])]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...metadata, applicants: updated })
  }

  const handleUpdateRespondent = (index: number, field: keyof Party, value: string) => {
    const updated = [...(metadata.respondents || [])]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...metadata, respondents: updated })
  }

  const handleRemoveApplicant = (index: number) => {
    const updated = (metadata.applicants || []).filter((_, i) => i !== index)
    onChange({ ...metadata, applicants: updated.length > 0 ? updated : undefined })
  }

  const handleRemoveRespondent = (index: number) => {
    const updated = (metadata.respondents || []).filter((_, i) => i !== index)
    onChange({ ...metadata, respondents: updated.length > 0 ? updated : undefined })
  }

  const hasParties = (metadata.applicants?.length || 0) > 0 || (metadata.respondents?.length || 0) > 0

  return (
    <div className="metadata-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="caseNumber">Case Number</label>
          <input
            id="caseNumber"
            type="text"
            value={metadata.caseNumber}
            onChange={(e) => handleChange('caseNumber', e.target.value)}
            placeholder="e.g., QB-2024-001234"
            aria-describedby="caseNumber-hint"
          />
          <small id="caseNumber-hint" className="form-hint">The court reference number</small>
        </div>

        <div className="form-group">
          <label htmlFor="court">Court</label>
          <input
            id="court"
            type="text"
            value={metadata.court}
            onChange={(e) => handleChange('court', e.target.value)}
            placeholder="e.g., High Court of Justice, King's Bench Division"
            aria-describedby="court-hint"
          />
          <small id="court-hint" className="form-hint">Full court name as it appears on orders</small>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">Bundle Date</label>
          <input
            id="date"
            type="date"
            value={metadata.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="proceedingType">Proceeding Type</label>
          <select
            id="proceedingType"
            value={metadata.isAdversarial === undefined ? '' : metadata.isAdversarial ? 'adversarial' : 'non-adversarial'}
            onChange={(e) => {
              if (e.target.value === '') {
                onChange({ ...metadata, isAdversarial: undefined })
              } else {
                handleChange('isAdversarial', e.target.value === 'adversarial')
              }
            }}
            aria-describedby="proceedingType-hint"
          >
            <option value="">Select type...</option>
            <option value="adversarial">Adversarial (-v-)</option>
            <option value="non-adversarial">Non-Adversarial (-and-)</option>
          </select>
          <small id="proceedingType-hint" className="form-hint">
            Civil litigation uses -v-, Court of Protection uses -and-
          </small>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="caseName">
          {hasParties ? 'Matter Description (optional)' : 'Case Name / Matter'}
        </label>
        <input
          id="caseName"
          type="text"
          value={metadata.caseName}
          onChange={(e) => handleChange('caseName', e.target.value)}
          placeholder={hasParties ? 'e.g., Application for Charging Order' : 'e.g., Smith v Jones'}
          aria-describedby="caseName-hint"
        />
        <small id="caseName-hint" className="form-hint">
          {hasParties
            ? 'Optional description shown after "IN THE MATTER OF"'
            : 'Enter party names below for proper court formatting, or type case name here'}
        </small>
      </div>

      {/* Parties Section */}
      <div className="parties-section">
        <div className="parties-header">
          <h3>Parties</h3>
          {hasParties ? (
            <span className="parties-status parties-status-complete" role="status">
              ✓ {(metadata.applicants?.length || 0) + (metadata.respondents?.length || 0)} parties added
            </span>
          ) : (
            <span className="parties-status parties-status-missing" role="status">
              ⚠ No parties added
            </span>
          )}
        </div>
        <p className="parties-help">
          Add parties for proper court header formatting. Names will appear in CAPITALS with designations right-aligned.
          {!hasParties && <strong> Parties must be added and saved to appear in the index.</strong>}
        </p>

        {/* Applicants/Claimants */}
        <div className="party-group">
          <div className="party-group-header">
            <h4>Claimants / Applicants / Appellants</h4>
            <button
              type="button"
              className="add-party-btn"
              onClick={handleAddApplicant}
              aria-label="Add claimant or applicant"
            >
              <Plus size={16} /> Add Party
            </button>
          </div>

          {(metadata.applicants || []).map((party, index) => (
            <div key={index} className="party-entry">
              <div className="party-row">
                <input
                  type="text"
                  value={party.name}
                  onChange={(e) => handleUpdateApplicant(index, 'name', e.target.value)}
                  placeholder="Party name (e.g., JOHN SMITH)"
                  className="party-name-input"
                  aria-label={`Applicant ${index + 1} name`}
                />
                <select
                  value={party.designation}
                  onChange={(e) => handleUpdateApplicant(index, 'designation', e.target.value)}
                  className="party-designation-select"
                  aria-label={`Applicant ${index + 1} designation`}
                >
                  {APPLICANT_DESIGNATIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="remove-party-btn"
                  onClick={() => handleRemoveApplicant(index)}
                  aria-label={`Remove applicant ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="litigation-friend-row">
                <input
                  type="text"
                  value={party.litigationFriend || ''}
                  onChange={(e) => handleUpdateApplicant(index, 'litigationFriend', e.target.value)}
                  placeholder="Litigation friend (e.g., by his litigation friend, JANE DOE)"
                  className="litigation-friend-input"
                  aria-label={`Applicant ${index + 1} litigation friend`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Separator indicator */}
        {hasParties && (
          <div className="party-separator-preview">
            {metadata.isAdversarial ? '-v-' : '-and-'}
          </div>
        )}

        {/* Respondents/Defendants */}
        <div className="party-group">
          <div className="party-group-header">
            <h4>Defendants / Respondents</h4>
            <button
              type="button"
              className="add-party-btn"
              onClick={handleAddRespondent}
              aria-label="Add defendant or respondent"
            >
              <Plus size={16} /> Add Party
            </button>
          </div>

          {(metadata.respondents || []).map((party, index) => (
            <div key={index} className="party-entry">
              <div className="party-row">
                <input
                  type="text"
                  value={party.name}
                  onChange={(e) => handleUpdateRespondent(index, 'name', e.target.value)}
                  placeholder="Party name (e.g., ACME CORPORATION LTD)"
                  className="party-name-input"
                  aria-label={`Respondent ${index + 1} name`}
                />
                <select
                  value={party.designation}
                  onChange={(e) => handleUpdateRespondent(index, 'designation', e.target.value)}
                  className="party-designation-select"
                  aria-label={`Respondent ${index + 1} designation`}
                >
                  {RESPONDENT_DESIGNATIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="remove-party-btn"
                  onClick={() => handleRemoveRespondent(index)}
                  aria-label={`Remove respondent ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="litigation-friend-row">
                <input
                  type="text"
                  value={party.litigationFriend || ''}
                  onChange={(e) => handleUpdateRespondent(index, 'litigationFriend', e.target.value)}
                  placeholder="Litigation friend (e.g., by her litigation friend, THE OFFICIAL SOLICITOR)"
                  className="litigation-friend-input"
                  aria-label={`Respondent ${index + 1} litigation friend`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
