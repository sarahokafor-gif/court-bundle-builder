import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Document } from '../types'
import { getPdfPageCount } from '../utils/pdfUtils'
import { generatePDFThumbnail } from '../utils/pdfThumbnail'
import ProgressIndicator from './ProgressIndicator'
import './DocumentUploader.css'

interface DocumentUploaderProps {
  onDocumentsAdded: (documents: Document[]) => void
}

export default function DocumentUploader({ onDocumentsAdded }: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string>('')

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    setProcessingProgress(0)
    const newDocuments: Document[] = []
    const totalFiles = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setCurrentFile(file.name)

      if (file.type !== 'application/pdf') {
        alert(`${file.name} is not a PDF file and will be skipped.`)
        // Update progress even for skipped files
        setProcessingProgress(((i + 1) / totalFiles) * 100)
        continue
      }

      try {
        // Get page count and generate thumbnail in parallel
        const [pageCount, thumbnail] = await Promise.all([
          getPdfPageCount(file),
          generatePDFThumbnail(file),
        ])

        newDocuments.push({
          id: `${Date.now()}-${i}`,
          file,
          name: file.name,
          pageCount,
          order: 0, // Will be set by parent
          thumbnail,
        })

        // Update progress after successfully processing each file
        setProcessingProgress(((i + 1) / totalFiles) * 100)
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        alert(`Error processing ${file.name}. It may be corrupted.`)
        setProcessingProgress(((i + 1) / totalFiles) * 100)
      }
    }

    if (newDocuments.length > 0) {
      onDocumentsAdded(newDocuments)
    }

    setIsProcessing(false)
    setProcessingProgress(0)
    setCurrentFile('')

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
        aria-label="Upload PDF documents"
        disabled={isProcessing}
      />
      <label
        htmlFor="file-upload"
        className={`btn btn-primary btn-lg ${isProcessing ? 'disabled' : ''}`}
        style={{ cursor: isProcessing ? 'wait' : 'pointer', pointerEvents: isProcessing ? 'none' : 'auto' }}
      >
        <Upload size={20} />
        {isProcessing ? 'Processing PDFs...' : 'Upload PDF Documents'}
      </label>

      {isProcessing && (
        <div className="upload-progress">
          <ProgressIndicator
            status="loading"
            progress={processingProgress}
            message={`Processing: ${currentFile}`}
            showPercentage={true}
          />
        </div>
      )}

      {!isProcessing && (
        <p className="upload-hint">
          Select one or more PDF files to add to your bundle
        </p>
      )}
    </div>
  )
}
