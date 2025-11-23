import './ConversionPrompt.css'

interface ConversionPromptProps {
  oldFormat: 'json'
  oldFileSize: number
  estimatedNewSize: number
  onConvert: () => void
  onKeep: () => void
}

export default function ConversionPrompt({
  oldFormat: _oldFormat,
  oldFileSize,
  estimatedNewSize,
  onConvert,
  onKeep,
}: ConversionPromptProps) {
  const formatOldSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatNewSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const savings = ((oldFileSize - estimatedNewSize) / oldFileSize * 100).toFixed(0)

  return (
    <div className="conversion-overlay">
      <div className="conversion-modal">
        <h2>Convert to New Format?</h2>
        <div className="conversion-content">
          <p className="conversion-main-message">
            Your bundle was loaded from an old JSON format file.
            We recommend converting it to the new ZIP format for better performance.
          </p>

          <div className="conversion-benefits">
            <h3>Benefits of Converting:</h3>
            <ul>
              <li>
                <strong>Smaller file size:</strong> {formatOldSize(oldFileSize)} → {formatNewSize(estimatedNewSize)}
                <span className="savings-badge">{savings}% smaller</span>
              </li>
              <li>
                <strong>Faster loading:</strong> No memory crashes, loads reliably every time
              </li>
              <li>
                <strong>Transferable:</strong> Easy to email, backup, and share
              </li>
              <li>
                <strong>Human-readable:</strong> You can unzip and view your PDFs directly
              </li>
            </ul>
          </div>

          <div className="conversion-note">
            <p>
              <strong>Note:</strong> This is a one-time conversion. Your old JSON file will not be deleted -
              you can keep it as a backup. The new ZIP file will be downloaded to your computer.
            </p>
          </div>
        </div>

        <div className="conversion-actions">
          <button className="btn-secondary" onClick={onKeep}>
            Keep JSON Format
          </button>
          <button className="btn-primary" onClick={onConvert}>
            Convert to ZIP
          </button>
        </div>
      </div>
    </div>
  )
}
