import { useState, useEffect, useRef } from 'react'
import { X, Square, Eraser, Save, Trash2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Minimize, RotateCw } from 'lucide-react'
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
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [tool, setTool] = useState<'redact' | 'erase'>('erase')
  const [rectangles, setRectangles] = useState<Rectangle[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredRectIndex, setHoveredRectIndex] = useState<number | null>(null)
  const [pageViewport, setPageViewport] = useState<{ width: number; height: number } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const arrayBuffer = await document.file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        setPdfDoc(pdf)

        // Calculate optimal scale to fit window
        if (containerRef.current) {
          const page = await pdf.getPage(1)
          const viewport = page.getViewport({ scale: 1, rotation: 0 })
          const containerHeight = containerRef.current.clientHeight - 80 // Account for padding
          const containerWidth = containerRef.current.clientWidth - 80

          const scaleHeight = containerHeight / viewport.height
          const scaleWidth = containerWidth / viewport.width
          const optimalScale = Math.min(scaleHeight, scaleWidth, 3) // Max 3x zoom

          setScale(Math.max(optimalScale, 0.5)) // Min 0.5x zoom
        }
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

      // Store viewport dimensions at scale 1 for fit calculations
      const baseViewport = page.getViewport({ scale: 1, rotation })
      setPageViewport({ width: baseViewport.width, height: baseViewport.height })

      canvas.width = viewport.width
      canvas.height = viewport.height

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise

      // Draw existing rectangles for this page
      const pageRectangles = rectangles
        .map((rect, index) => ({ rect, index }))
        .filter(({ rect }) => rect.page === currentPage)

      pageRectangles.forEach(({ rect, index }) => {
        const isHovered = index === hoveredRectIndex

        context.fillStyle = rect.type === 'redact' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 1)'
        context.fillRect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale)

        // Border for visibility - only show for hovered or redaction
        if (isHovered) {
          context.strokeStyle = '#FF0000'
          context.lineWidth = 4
          context.strokeRect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale)
        } else if (rect.type === 'redact') {
          context.strokeStyle = '#000'
          context.lineWidth = 2
          context.strokeRect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale)
        }
        // No border for erase rectangles when not hovered - they blend with the page
      })
    }

    renderPage()
  }, [pdfDoc, currentPage, scale, rotation, rectangles, hoveredRectIndex])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clickX = (e.clientX - rect.left) / scale
    const clickY = (e.clientY - rect.top) / scale

    // Check if user clicked on an existing rectangle to delete it
    const clickedRectIndex = rectangles.findIndex(r => {
      if (r.page !== currentPage) return false
      return (
        clickX >= r.x &&
        clickX <= r.x + r.width &&
        clickY >= r.y &&
        clickY <= r.y + r.height
      )
    })

    if (clickedRectIndex !== -1) {
      // Delete the clicked rectangle
      setRectangles(prev => prev.filter((_, index) => index !== clickedRectIndex))
      return
    }

    // Start drawing a new rectangle
    setIsDrawing(true)
    setStartPos({
      x: clickX,
      y: clickY,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !pdfDoc) return

    const rect = canvasRef.current.getBoundingClientRect()
    const currentX = (e.clientX - rect.left) / scale
    const currentY = (e.clientY - rect.top) / scale

    // If not drawing, check for hover to highlight deletable rectangles
    if (!isDrawing) {
      const hoveredIndex = rectangles.findIndex(r => {
        if (r.page !== currentPage) return false
        return (
          currentX >= r.x &&
          currentX <= r.x + r.width &&
          currentY >= r.y &&
          currentY <= r.y + r.height
        )
      })

      setHoveredRectIndex(hoveredIndex !== -1 ? hoveredIndex : null)

      // Update cursor
      if (canvasRef.current) {
        canvasRef.current.style.cursor = hoveredIndex !== -1 ? 'pointer' : 'crosshair'
      }
      return
    }

    // Continue with drawing preview if we are drawing
    if (!startPos) return

    // Re-render page to clear previous preview
    const renderPreview = async () => {
      const page = await pdfDoc.getPage(currentPage)
      const viewport = page.getViewport({ scale, rotation })
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
          // Only draw border for redaction rectangles, not for erase
          if (r.type === 'redact') {
            context.strokeStyle = '#000'
            context.lineWidth = 2
            context.strokeRect(r.x * scale, r.y * scale, r.width * scale, r.height * scale)
          }
        })

      // Draw preview rectangle
      const width = currentX - startPos.x
      const height = currentY - startPos.y

      if (tool === 'redact') {
        // Black semi-transparent fill for redaction
        context.fillStyle = 'rgba(0, 0, 0, 0.6)'
        context.fillRect(startPos.x * scale, startPos.y * scale, width * scale, height * scale)
        // Dashed black border
        context.strokeStyle = '#000'
        context.lineWidth = 3
        context.setLineDash([8, 4])
        context.strokeRect(startPos.x * scale, startPos.y * scale, width * scale, height * scale)
      } else {
        // For erase: bright colored border to show selection, semi-transparent white fill
        context.fillStyle = 'rgba(255, 255, 255, 0.7)'
        context.fillRect(startPos.x * scale, startPos.y * scale, width * scale, height * scale)
        // Bright blue dashed border for high visibility
        context.strokeStyle = '#00BFFF'
        context.lineWidth = 3
        context.setLineDash([8, 4])
        context.strokeRect(startPos.x * scale, startPos.y * scale, width * scale, height * scale)
      }
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

  // Mouse wheel scrolling for page navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Only change pages if not drawing
      if (isDrawing) return

      // Prevent default scrolling
      e.preventDefault()

      if (e.deltaY > 0) {
        // Scroll down = next page
        setCurrentPage(p => Math.min(pdfDoc?.numPages || 1, p + 1))
      } else if (e.deltaY < 0) {
        // Scroll up = previous page
        setCurrentPage(p => Math.max(1, p - 1))
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [isDrawing, pdfDoc])

  const rectanglesOnPage = rectangles.filter(r => r.page === currentPage).length

  // Rotate page 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  // Fit to width: scale so page width matches container width
  const handleFitToWidth = () => {
    if (!pageViewport || !containerRef.current) return
    const containerWidth = containerRef.current.clientWidth - 80 // Account for padding
    const newScale = containerWidth / pageViewport.width
    setScale(Math.min(Math.max(newScale, 0.5), 3)) // Clamp between 0.5 and 3
  }

  // Fit to page: scale to fit entire page in view (whatever is smaller)
  const handleFitToPage = () => {
    if (!pageViewport || !containerRef.current) return
    const containerWidth = containerRef.current.clientWidth - 80
    const containerHeight = containerRef.current.clientHeight - 80
    const scaleWidth = containerWidth / pageViewport.width
    const scaleHeight = containerHeight / pageViewport.height
    const newScale = Math.min(scaleWidth, scaleHeight)
    setScale(Math.min(Math.max(newScale, 0.5), 3))
  }

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
            <button className="tool-button" onClick={handleRotate} title="Rotate page 90° clockwise">
              <RotateCw size={20} />
            </button>
            <button className="tool-button" onClick={() => setScale(s => Math.min(s + 0.25, 3))} title="Zoom in">
              <ZoomIn size={20} />
            </button>
            <span className="zoom-level">{Math.round(scale * 100)}%</span>
            <button className="tool-button" onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} title="Zoom out">
              <ZoomOut size={20} />
            </button>
            <button className="tool-button" onClick={handleFitToWidth} title="Fit to width">
              <Maximize size={18} style={{ transform: 'rotate(90deg)' }} />
            </button>
            <button className="tool-button" onClick={handleFitToPage} title="Fit whole page">
              <Minimize size={18} />
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
