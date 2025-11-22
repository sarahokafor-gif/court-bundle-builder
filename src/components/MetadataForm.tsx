import { BundleMetadata, Party, PartyRole } from '../types'
import { Plus, X } from 'lucide-react'
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

  const handleAddParty = () => {
    const newParty: Party = {
      id: `party-${Date.now()}`,
      name: '',
      role: 'applicant',
      order: metadata.parties.length,
    }
    onChange({
      ...metadata,
      parties: [...metadata.parties, newParty],
    })
  }

  const handleRemoveParty = (partyId: string) => {
    onChange({
      ...metadata,
      parties: metadata.parties.filter(p => p.id !== partyId),
    })
  }

  const handlePartyChange = (partyId: string, field: keyof Party, value: string | PartyRole) => {
    onChange({
      ...metadata,
      parties: metadata.parties.map(p =>
        p.id === partyId ? { ...p, [field]: value } : p
      ),
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

      {/* Parties Section */}
      <div className="parties-section">
        <div className="parties-header">
          <label>Parties</label>
          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={handleAddParty}
            aria-label="Add party"
          >
            <Plus size={16} />
            Add Party
          </button>
        </div>

        {metadata.parties.length === 0 && (
          <p className="parties-hint">
            Click "Add Party" to add applicants, respondents, or other parties to the case.
          </p>
        )}

        <div className="parties-list">
          {metadata.parties.map((party, index) => (
            <div key={party.id} className="party-item">
              <div className="party-number">{index + 1}.</div>

              <div className="party-fields">
                <div className="form-group">
                  <input
                    type="text"
                    value={party.name}
                    onChange={(e) => handlePartyChange(party.id, 'name', e.target.value)}
                    placeholder="Party name"
                    aria-label={`Party ${index + 1} name`}
                  />
                </div>

                <div className="form-group">
                  <select
                    value={party.role}
                    onChange={(e) => handlePartyChange(party.id, 'role', e.target.value as PartyRole)}
                    aria-label={`Party ${index + 1} role`}
                  >
                    <option value="applicant">Applicant</option>
                    <option value="respondent">Respondent</option>
                    <option value="claimant">Claimant</option>
                    <option value="defendant">Defendant</option>
                    <option value="appellant">Appellant</option>
                    <option value="interested-person">Interested Person</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {party.role === 'other' && (
                  <div className="form-group">
                    <input
                      type="text"
                      value={party.customRole || ''}
                      onChange={(e) => handlePartyChange(party.id, 'customRole', e.target.value)}
                      placeholder="Specify role"
                      aria-label={`Party ${index + 1} custom role`}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-sm btn-danger party-remove-btn"
                onClick={() => handleRemoveParty(party.id)}
                aria-label={`Remove party ${index + 1}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
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
