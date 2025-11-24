import { useState, useEffect, useRef } from 'react'
import { X, Trash2, Check, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { Document } from '../types'
import { extractSelectedPages } from '../utils/pdfUtils'
import './PageManager.css'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PageManagerProps {
  document: Document
  onClose: () => void
  onSave: (selectedPages: number[]) => void
  onUpdateModifiedFile: (modifiedFile: File) => void
}

export default function PageManager({ document, onClose, onSave, onUpdateModifiedFile }: PageManagerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [rotation, setRotation] = useState(0)
  const [selectedPages, setSelectedPages] = useState<number[]>(() => {
    // If document has selectedPages, use that, otherwise all pages are selected (0-indexed)
    return document.selectedPages || Array.from({ length: document.pageCount }, (_, i) => i)
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load PDF - use modifiedFile if it exists (preserves previous edits)
  useEffect(() => {
    const loadPdf = async () => {
      try {
        // CRITICAL: Use modifiedFile if it exists to preserve eraser/redaction edits
        const fileToLoad = document.modifiedFile || document.file
        const arrayBuffer = await fileToLoad.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        setPdfDoc(pdf)
      } catch (error) {
        console.error('Error loading PDF:', error)
        alert('Failed to load PDF')
      }
    }
    loadPdf()
  }, [document])

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage)
      const viewport = page.getViewport({ scale, rotation })
      const canvas = canvasRef.current!
      const context = canvas.getContext('2d')!

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise
    }

    renderPage()
  }, [pdfDoc, currentPage, scale, rotation])

  const isPageSelected = selectedPages.includes(currentPage - 1) // Convert to 0-indexed

  const handleDeletePage = () => {
    setSelectedPages(prev => prev.filter(p => p !== currentPage - 1))
  }

  const handleKeepPage = () => {
    setSelectedPages(prev => {
      if (!prev.includes(currentPage - 1)) {
        return [...prev, currentPage - 1].sort((a, b) => a - b)
      }
      return prev
    })
  }

  const handleSave = async () => {
    if (selectedPages.length === 0) {
      alert('Please keep at least one page.')
      return
    }

    try {
      // Use modifiedFile if it exists (preserves previous edits)
      const baseFile = document.modifiedFile || document.file

      // Create a new PDF with only the selected pages
      const modifiedFile = await extractSelectedPages(baseFile, selectedPages, document.name)

      // After extracting pages, the new PDF has different page count
      // So we reset selectedPages to "all pages" of the NEW PDF
      const newPageCount = selectedPages.length
      const allPagesSelected = Array.from({ length: newPageCount }, (_, i) => i)

      onSave(allPagesSelected) // Reset to all pages selected
      onUpdateModifiedFile(modifiedFile)
      onClose()
    } catch (error) {
      console.error('Error extracting pages:', error)
      alert('Failed to extract selected pages. Please try again.')
    }
  }

  const goToNextPage = () => {
    if (pdfDoc && currentPage < pdfDoc.numPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <div className="page-manager-overlay" onClick={onClose}>
      <div className="page-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="page-manager-header">
          <div>
            <h2>Page Extraction Editor</h2>
            <p className="page-manager-subtitle">{document.name}</p>
            <p className="page-manager-info">
              {selectedPages.length} of {document.pageCount} pages will be included in bundle
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="page-viewer-toolbar">
          <div className="toolbar-group">
            <button className="toolbar-button" onClick={handleRotate} title="Rotate 90°">
              <RotateCw size={20} />
            </button>
            <button className="toolbar-button" onClick={() => setScale(s => Math.min(s + 0.25, 3))} title="Zoom in">
              <ZoomIn size={20} />
            </button>
            <span className="zoom-level">{Math.round(scale * 100)}%</span>
            <button className="toolbar-button" onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} title="Zoom out">
              <ZoomOut size={20} />
            </button>
          </div>

          <div className="page-navigation">
            <button
              className="nav-button"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              title="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="page-counter">
              Page {currentPage} of {pdfDoc?.numPages || 1}
            </span>
            <button
              className="nav-button"
              onClick={goToNextPage}
              disabled={currentPage === (pdfDoc?.numPages || 1)}
              title="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="page-actions">
            {isPageSelected ? (
              <button className="delete-page-button" onClick={handleDeletePage}>
                <Trash2 size={18} />
                Delete This Page
              </button>
            ) : (
              <button className="keep-page-button" onClick={handleKeepPage}>
                <Check size={18} />
                Keep This Page
              </button>
            )}
          </div>
        </div>

        <div className="page-viewer-content">
          <div className="page-status-banner" style={{ backgroundColor: isPageSelected ? '#e8f5e9' : '#ffebee' }}>
            {isPageSelected ? (
              <span style={{ color: '#2e7d32' }}>✓ This page will be included in the bundle</span>
            ) : (
              <span style={{ color: '#c62828' }}>✗ This page will be excluded from the bundle</span>
            )}
          </div>
          <canvas ref={canvasRef} className="page-canvas" />
        </div>

        <div className="page-manager-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Changes ({selectedPages.length} pages)
          </button>
        </div>
      </div>
    </div>
  )
}
