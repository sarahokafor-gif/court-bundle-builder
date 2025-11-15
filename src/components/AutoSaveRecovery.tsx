import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { AutoSaveData, formatAutoSaveTime } from '../utils/autoSave'
import './AutoSaveRecovery.css'

interface AutoSaveRecoveryProps {
  autoSaveData: AutoSaveData
  onRestore: () => void
  onDismiss: () => void
}

export default function AutoSaveRecovery({ autoSaveData, onRestore, onDismiss }: AutoSaveRecoveryProps) {
  const { metadata, sections, timestamp } = autoSaveData

  // Calculate some stats about the auto-save
  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)
  const hasMetadata = !!(metadata.caseName || metadata.caseNumber || metadata.court)
  const timeAgo = formatAutoSaveTime(timestamp)

  return (
    <div className="autosave-overlay" role="dialog" aria-labelledby="autosave-title" aria-modal="true">
      <div className="autosave-modal">
        <div className="autosave-header">
          <AlertCircle size={32} className="autosave-icon" />
          <h2 id="autosave-title">Unsaved Work Found</h2>
        </div>

        <div className="autosave-content">
          <div className="autosave-info-item">
            <Clock size={18} />
            <span>Last saved: <strong>{timeAgo}</strong></span>
          </div>

          {hasMetadata && (
            <div className="autosave-details">
              <h3>Bundle Information:</h3>
              {metadata.caseName && <p>Case Name: <strong>{metadata.caseName}</strong></p>}
              {metadata.caseNumber && <p>Case Number: <strong>{metadata.caseNumber}</strong></p>}
              {metadata.court && <p>Court: <strong>{metadata.court}</strong></p>}
            </div>
          )}

          {totalDocs > 0 && (
            <div className="autosave-details">
              <h3>Documents:</h3>
              <p><strong>{totalDocs}</strong> document{totalDocs !== 1 ? 's' : ''} across <strong>{sections.length}</strong> section{sections.length !== 1 ? 's' : ''}</p>
            </div>
          )}

          <div className="autosave-question">
            Would you like to restore your previous work?
          </div>
        </div>

        <div className="autosave-actions">
          <button
            className="btn btn-success"
            onClick={onRestore}
            aria-label="Restore previous work"
          >
            <CheckCircle size={18} />
            Restore Work
          </button>
          <button
            className="btn btn-secondary"
            onClick={onDismiss}
            aria-label="Start fresh, discard auto-save"
          >
            <XCircle size={18} />
            Start Fresh
          </button>
        </div>

        <div className="autosave-hint">
          Your work is automatically saved every 30 seconds while you work.
        </div>
      </div>
    </div>
  )
}
