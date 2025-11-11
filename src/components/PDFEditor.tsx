import { useState, useEffect, useRef } from 'react'
import { X, Square, Eraser, Save, Trash2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { Document } from '../types'
import './PDFEditor.css'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
  page: number
  type: 'redact' | 'erase'
}

interface PDFEditorProps {
  document: Document
  onClose: () => void
  onSave: (rectangles: Rectangle[]) => void
}

export default function PDFEditor({ document, onClose, onSave }: PDFEditorProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [tool, setTool] = useState<'redact' | 'erase'>('erase')
  const [rectangles, setRectangles] = useState<Rectangle[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number; page: number } | null>(null)
  const [viewMode, setViewMode] = useState<'single' | 'scroll'>('scroll')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const arrayBuffer = await document.file.arrayBuffer()
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
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current!
      const context = canvas.getContext('2d')!

      canvas.width = viewport.width
      canvas.height = viewport.height

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise

      // Draw existing rectangles for this page
      rectangles
        .filter(rect => rect.page === currentPage)
        .forEach(rect => {
          context.fillStyle = rect.type === 'redact' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 1)'
          context.fillRect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale)

          // Border for visibility
          context.strokeStyle = rect.type === 'redact' ? '#000' : '#999'
          context.lineWidth = 2
          context.strokeRect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale)
        })
    }

    renderPage()
  }, [pdfDoc, currentPage, scale, rectangles])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setIsDrawing(true)
    setStartPos({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !canvasRef.current || !pdfDoc) return

    const rect = canvasRef.current.getBoundingClientRect()
    const currentX = (e.clientX - rect.left) / scale
    const currentY = (e.clientY - rect.top) / scale

    // Re-render page to clear previous preview
    const renderPreview = async () => {
      const page = await pdfDoc.getPage(currentPage)
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current!
      const context = canvas.getContext('2d')!

      canvas.width = viewport.width
      canvas.height = viewport.height

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise

      // Draw existing rectangles for this page
      rectangles
        .filter(r => r.page === currentPage)
        .forEach(r => {
          context.fillStyle = r.type === 'redact' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 1)'
          context.fillRect(r.x * scale, r.y * scale, r.width * scale, r.height * scale)
          context.strokeStyle = r.type === 'redact' ? '#000' : '#999'
          context.lineWidth = 2
          context.strokeRect(r.x * scale, r.y * scale, r.width * scale, r.height * scale)
        })

      // Draw preview rectangle
      const width = currentX - startPos.x
      const height = currentY - startPos.y

      context.fillStyle = tool === 'redact' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)'
      context.strokeStyle = tool === 'redact' ? '#000' : '#999'
      context.lineWidth = 2
      context.setLineDash([5, 5]) // Dashed line for preview
      context.strokeRect(startPos.x * scale, startPos.y * scale, width * scale, height * scale)
      context.fillRect(startPos.x * scale, startPos.y * scale, width * scale, height * scale)
      context.setLineDash([]) // Reset line dash
    }

    renderPreview()
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const endX = (e.clientX - rect.left) / scale
    const endY = (e.clientY - rect.top) / scale

    const width = endX - startPos.x
    const height = endY - startPos.y

    // Only add rectangle if it has meaningful size
    if (Math.abs(width) > 5 && Math.abs(height) > 5) {
      const newRect: Rectangle = {
        x: Math.min(startPos.x, endX),
        y: Math.min(startPos.y, endY),
        width: Math.abs(width),
        height: Math.abs(height),
        page: currentPage,
        type: tool,
      }
      setRectangles(prev => [...prev, newRect])
    }

    setIsDrawing(false)
    setStartPos(null)
  }

  const handleSave = () => {
    onSave(rectangles)
    onClose()
  }

  const handleClearPage = () => {
    setRectangles(prev => prev.filter(rect => rect.page !== currentPage))
  }

  const handleClearAll = () => {
    if (confirm('Clear all redactions and erasures from all pages?')) {
      setRectangles([])
    }
  }

  const rectanglesOnPage = rectangles.filter(r => r.page === currentPage).length

  return (
    <div className="pdf-editor-overlay" onClick={onClose}>
      <div className="pdf-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-editor-header">
          <div>
            <h2>PDF Editor - Redaction & Eraser</h2>
            <p className="pdf-editor-subtitle">{document.name}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="pdf-editor-toolbar">
          <div className="tool-group">
            <button
              className={`tool-button ${tool === 'redact' ? 'active' : ''}`}
              onClick={() => setTool('redact')}
              title="Redact - Black box for sensitive info"
            >
              <Square size={20} />
              Redact
            </button>
            <button
              className={`tool-button ${tool === 'erase' ? 'active' : ''}`}
              onClick={() => setTool('erase')}
              title="Erase - White box to remove old page numbers"
            >
              <Eraser size={20} />
              Erase
            </button>
          </div>

          <div className="tool-group">
            <button className="tool-button" onClick={() => setScale(s => Math.min(s + 0.25, 3))}>
              <ZoomIn size={20} />
            </button>
            <span className="zoom-level">{Math.round(scale * 100)}%</span>
            <button className="tool-button" onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}>
              <ZoomOut size={20} />
            </button>
          </div>

          <div className="tool-group">
            <button className="tool-button danger" onClick={handleClearPage} disabled={rectanglesOnPage === 0}>
              <Trash2 size={18} />
              Clear Page ({rectanglesOnPage})
            </button>
            <button className="tool-button danger" onClick={handleClearAll} disabled={rectangles.length === 0}>
              <Trash2 size={18} />
              Clear All ({rectangles.length})
            </button>
          </div>
        </div>

        <div className="pdf-editor-content" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="pdf-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsDrawing(false)
              setStartPos(null)
            }}
          />
        </div>

        <div className="pdf-editor-footer">
          <div className="page-controls">
            <button
              className="page-button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="page-info">
              Page {currentPage} of {pdfDoc?.numPages || 1}
            </span>
            <button
              className="page-button"
              onClick={() => setCurrentPage(p => Math.min(pdfDoc?.numPages || 1, p + 1))}
              disabled={currentPage === (pdfDoc?.numPages || 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="action-buttons">
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button className="save-button" onClick={handleSave}>
              <Save size={20} />
              Save Edits
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
