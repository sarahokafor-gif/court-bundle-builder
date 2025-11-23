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
  const [error, setError] = useState<string | null>(null)

  // Debug logging - runs on every render
  if (document) {
    const fileToCheck = document.modifiedFile || document.file
    console.log('DocumentPreview RENDER:', {
      documentName: document.name,
      hasFile: !!document.file,
      hasModifiedFile: !!document.modifiedFile,
      fileType: typeof fileToCheck,
      fileIsFile: fileToCheck instanceof File,
      fileIsBlob: fileToCheck instanceof Blob,
      fileConstructor: fileToCheck?.constructor?.name,
      fileSize: fileToCheck?.size,
      fileName: fileToCheck?.name,
    })
  }

  useEffect(() => {
    if (document) {
      try {
        // Use modifiedFile if it exists (edited/redacted version), otherwise use original file
        const fileToPreview = document.modifiedFile || document.file

        // Validate that we have a valid Blob/File object (File extends Blob)
        // Accept both File and Blob instances
        const isValidBlob = fileToPreview && fileToPreview instanceof Blob
        if (!isValidBlob) {
          console.error('Invalid file object - not a Blob:', {
            hasFile: !!fileToPreview,
            type: typeof fileToPreview,
          })
          setError('Invalid file format. Cannot preview this document.')
          setPreviewUrl(null)
          return
        }

        // Create object URL from Blob/File
        const url = URL.createObjectURL(fileToPreview)
        setPreviewUrl(url)
        setError(null)

        return () => {
          URL.revokeObjectURL(url)
        }
      } catch (err) {
        console.error('Error creating preview URL:', err)
        setError('Failed to load preview. The file may be corrupted.')
        setPreviewUrl(null)
      }
    } else {
      setPreviewUrl(null)
      setError(null)
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
          {error ? (
            <div className="preview-error">
              <p>{error}</p>
              <p style={{ fontSize: '0.9em', marginTop: '0.5rem', color: '#666' }}>
                Try uploading the document again or contact support if the problem persists.
              </p>
            </div>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              title={document.name}
              className="preview-iframe"
            />
          ) : (
            <div className="preview-loading">
              <p>Loading preview...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
