import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Document } from '../types'
import './DocumentPreview.css'

interface DocumentPreviewProps {
  document: Document | null
  onClose: () => void
}

export default function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (document) {
      const url = URL.createObjectURL(document.file)
      setPreviewUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [document])

  if (!document) return null

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <div className="preview-title">
            <h3>{document.name}</h3>
            <span className="preview-pages">{document.pageCount} page{document.pageCount !== 1 ? 's' : ''}</span>
          </div>
          <button className="preview-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="preview-content">
          {previewUrl && (
            <iframe
              src={previewUrl}
              title={document.name}
              className="preview-iframe"
            />
          )}
        </div>
      </div>
    </div>
  )
}
