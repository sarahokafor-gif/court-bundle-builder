import { Hash, AlertTriangle } from 'lucide-react'
import { BatesNumberSettings, PageNumberPosition } from '../types'
import './BatesNumberSettings.css'

interface BatesNumberSettingsProps {
  settings: BatesNumberSettings
  onChange: (settings: BatesNumberSettings) => void
  pageNumberPosition?: PageNumberPosition
}

export default function BatesNumberSettingsComponent({ settings, onChange, pageNumberPosition }: BatesNumberSettingsProps) {
  const handleToggle = () => {
    onChange({ ...settings, enabled: !settings.enabled })
  }

  // Check for position conflict with page numbers
  const hasPositionConflict = settings.enabled && pageNumberPosition &&
    pageNumberPosition.includes(settings.position.split('-')[0]) &&
    pageNumberPosition.includes(settings.position.split('-')[1])

  const handlePrefixChange = (prefix: string) => {
    // Only allow uppercase letters and numbers
    const sanitized = prefix.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    onChange({ ...settings, prefix: sanitized })
  }

  const handleStartNumberChange = (value: string) => {
    const num = parseInt(value) || 1
    onChange({ ...settings, startNumber: Math.max(1, num) })
  }

  const handleDigitsChange = (value: string) => {
    const num = parseInt(value) || 3
    onChange({ ...settings, digits: Math.min(6, Math.max(3, num)) })
  }

  const handlePositionChange = (position: BatesNumberSettings['position']) => {
    onChange({ ...settings, position })
  }

  const handleFontSizeChange = (value: string) => {
    const size = parseInt(value) || 10
    onChange({ ...settings, fontSize: Math.min(14, Math.max(8, size)) })
  }

  // Generate preview
  const generatePreview = () => {
    const paddedNumber = settings.startNumber.toString().padStart(settings.digits, '0')
    return settings.prefix ? `${settings.prefix}-${paddedNumber}` : paddedNumber
  }

  return (
    <div className="bates-number-settings">
      <div className="bates-header">
        <div className="bates-title">
          <Hash size={20} />
          <h3>Bates Numbering</h3>
        </div>
        <label className="bates-toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={handleToggle}
            aria-label="Enable Bates numbering"
          />
          <span className="toggle-switch"></span>
          <span className="toggle-label">{settings.enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      <div className="bates-help">
        <p>
          <strong>Bates numbering</strong> adds unique sequential identifiers to each page for legal document reference.
          {!settings.enabled && ' Enable to configure.'}
        </p>
      </div>

      {settings.enabled && (
        <div className="bates-controls">
          <div className="bates-preview-card">
            <span className="preview-label">Preview:</span>
            <span className="preview-value">{generatePreview()}</span>
          </div>

          <div className="bates-row">
            <div className="bates-field">
              <label htmlFor="bates-prefix">
                Prefix
                <span className="field-hint">Letters/numbers only</span>
              </label>
              <input
                id="bates-prefix"
                type="text"
                value={settings.prefix}
                onChange={(e) => handlePrefixChange(e.target.value)}
                placeholder="e.g., CASE, DOC"
                maxLength={10}
                className="bates-input"
              />
            </div>

            <div className="bates-field">
              <label htmlFor="bates-start">
                Start Number
                <span className="field-hint">Minimum 1</span>
              </label>
              <input
                id="bates-start"
                type="number"
                value={settings.startNumber}
                onChange={(e) => handleStartNumberChange(e.target.value)}
                min={1}
                className="bates-input"
              />
            </div>

            <div className="bates-field">
              <label htmlFor="bates-digits">
                Digits
                <span className="field-hint">Zero padding (3-6)</span>
              </label>
              <input
                id="bates-digits"
                type="number"
                value={settings.digits}
                onChange={(e) => handleDigitsChange(e.target.value)}
                min={3}
                max={6}
                className="bates-input"
              />
            </div>
          </div>

          <div className="bates-row">
            <div className="bates-field">
              <label htmlFor="bates-position">Position on Page</label>
              <select
                id="bates-position"
                value={settings.position}
                onChange={(e) => handlePositionChange(e.target.value as BatesNumberSettings['position'])}
                className={`bates-select ${hasPositionConflict ? 'conflict' : ''}`}
              >
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
              {hasPositionConflict && (
                <div className="position-conflict-warning">
                  <AlertTriangle size={14} />
                  <span>Same position as page numbers</span>
                </div>
              )}
            </div>

            <div className="bates-field">
              <label htmlFor="bates-font-size">
                Font Size
                <span className="field-hint">8-14pt</span>
              </label>
              <input
                id="bates-font-size"
                type="number"
                value={settings.fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                min={8}
                max={14}
                className="bates-input"
              />
            </div>
          </div>

          <div className="bates-examples">
            <p className="examples-title">Examples with current settings:</p>
            <div className="examples-list">
              <code>{generatePreview()}</code>
              <code>{settings.prefix ? `${settings.prefix}-${(settings.startNumber + 1).toString().padStart(settings.digits, '0')}` : (settings.startNumber + 1).toString().padStart(settings.digits, '0')}</code>
              <code>{settings.prefix ? `${settings.prefix}-${(settings.startNumber + 2).toString().padStart(settings.digits, '0')}` : (settings.startNumber + 2).toString().padStart(settings.digits, '0')}</code>
              <span className="examples-ellipsis">...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
