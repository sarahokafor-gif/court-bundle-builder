import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { Document } from '../types'
import { getPdfPageCount } from '../utils/pdfUtils'
import './DocumentUploader.css'

interface DocumentUploaderProps {
  onDocumentsAdded: (documents: Document[]) => void
}

export default function DocumentUploader({ onDocumentsAdded }: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newDocuments: Document[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (file.type !== 'application/pdf') {
        alert(`${file.name} is not a PDF file and will be skipped.`)
        continue
      }

      try {
        const pageCount = await getPdfPageCount(file)
        newDocuments.push({
          id: `${Date.now()}-${i}`,
          file,
          name: file.name,
          pageCount,
          order: 0, // Will be set by parent
        })
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        alert(`Error processing ${file.name}. It may be corrupted.`)
      }
    }

    if (newDocuments.length > 0) {
      onDocumentsAdded(newDocuments)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="document-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="file-upload"
      />
      <label htmlFor="file-upload" className="upload-button">
        <Upload size={20} />
        Upload PDF Documents
      </label>
      <p className="upload-hint">Select one or more PDF files to add to your bundle</p>
    </div>
  )
}
