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
      console.log('[Preview] Document file:', document.file)
      console.log('[Preview] File size:', document.file.size, 'bytes')
      console.log('[Preview] File type:', document.file.type)

      // Test: Try to read the file to verify its contents are accessible
      const reader = new FileReader()
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer
        if (arrayBuffer) {
          const bytes = new Uint8Array(arrayBuffer)
          const firstBytes = String.fromCharCode(...bytes.slice(0, 10))
          console.log('[Preview] File contents verified - first 10 bytes:', firstBytes)
          console.log('[Preview] Total bytes read:', bytes.length)
        }
      }
      reader.onerror = (err) => {
        console.error('[Preview] Error reading file:', err)
      }
      reader.readAsArrayBuffer(document.file)

      const url = URL.createObjectURL(document.file)
      console.log('[Preview] Created blob URL:', url)
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
