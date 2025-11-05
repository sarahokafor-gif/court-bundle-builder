import { PageNumberSettings as PageNumberSettingsType, PageNumberPosition } from '../types'
import './PageNumberSettings.css'

interface PageNumberSettingsProps {
  settings: PageNumberSettingsType
  onChange: (settings: PageNumberSettingsType) => void
}

export default function PageNumberSettings({ settings, onChange }: PageNumberSettingsProps) {
  const positions: { value: PageNumberPosition; label: string }[] = [
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
  ]

  return (
    <div className="page-number-settings">
      <div className="settings-row">
        <div className="setting-group">
          <label htmlFor="position">Position</label>
          <select
            id="position"
            value={settings.position}
            onChange={(e) =>
              onChange({ ...settings, position: e.target.value as PageNumberPosition })
            }
          >
            {positions.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>

        <div className="setting-group">
          <label htmlFor="fontSize">Font Size</label>
          <input
            id="fontSize"
            type="number"
            min="8"
            max="16"
            value={settings.fontSize}
            onChange={(e) =>
              onChange({ ...settings, fontSize: Math.min(16, Math.max(8, parseInt(e.target.value) || 10)) })
            }
          />
        </div>

        <div className="setting-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={settings.bold}
              onChange={(e) => onChange({ ...settings, bold: e.target.checked })}
            />
            <span>Bold</span>
          </label>
        </div>
      </div>

      <div className="settings-preview">
        <span
          className="preview-text"
          style={{
            fontSize: `${settings.fontSize}px`,
            fontWeight: settings.bold ? 'bold' : 'normal',
          }}
        >
          Preview: A1
        </span>
      </div>
    </div>
  )
}
