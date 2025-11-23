import './LoadingProgress.css'

interface LoadingProgressProps {
  progress: number
  total: number
  message: string
}

export default function LoadingProgress({ progress, total, message }: LoadingProgressProps) {
  const percentage = Math.round((progress / total) * 100)

  return (
    <div className="loading-overlay">
      <div className="loading-modal">
        <h2>Loading Bundle</h2>
        <div className="loading-content">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${percentage}%` }} />
          </div>
          <div className="progress-text">
            <span className="progress-percentage">{percentage}%</span>
            <span className="progress-message">{message}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
