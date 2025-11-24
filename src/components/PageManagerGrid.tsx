import { useState, useEffect } from 'react'
import { X, Trash2, Check, CheckSquare, Square } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { Document } from '../types'
import { extractSelectedPages } from '../utils/pdfUtils'
import './PageManagerGrid.css'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PageManagerGridProps {
  document: Document
  onClose: () => void
  onUpdateFile: (newFile: File, newPageCount: number) => void
}

interface PageThumbnail {
  pageNumber: number
  dataUrl: string | null
  selected: boolean
}

export default function PageManagerGrid({ document, onClose, onUpdateFile }: PageManagerGridProps) {
  const [, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([])
  const [loading, setLoading] = useState(true)
  const [selectAll, setSelectAll] = useState(true)

  // Load PDF and generate thumbnails
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true)
        // Use modifiedFile if it exists (preserves previous edits)
        const fileToLoad = document.modifiedFile || document.file
        const arrayBuffer = await fileToLoad.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        setPdfDoc(pdf)

        // Initialize thumbnails array - all selected by default
        const initialThumbnails: PageThumbnail[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          initialThumbnails.push({
            pageNumber: i,
            dataUrl: null,
            selected: true,
          })
        }
        setThumbnails(initialThumbnails)

        // Generate thumbnail images
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 0.5 }) // Small scale for thumbnails

          const canvas = window.document.createElement('canvas')
          const context = canvas.getContext('2d')!
          canvas.width = viewport.width
          canvas.height = viewport.height

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise

          const dataUrl = canvas.toDataURL()

          setThumbnails(prev => prev.map(t =>
            t.pageNumber === i ? { ...t, dataUrl } : t
          ))
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading PDF:', error)
        alert('Failed to load PDF')
        setLoading(false)
      }
    }
    loadPdf()
  }, [document])

  const togglePage = (pageNumber: number) => {
    setThumbnails(prev => prev.map(t =>
      t.pageNumber === pageNumber ? { ...t, selected: !t.selected } : t
    ))
  }

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)
    setThumbnails(prev => prev.map(t => ({ ...t, selected: newSelectAll })))
  }

  const selectedCount = thumbnails.filter(t => t.selected).length

  const handleSave = async () => {
    console.log('[PageManagerGrid] handleSave called, selectedCount:', selectedCount, 'totalPages:', thumbnails.length)

    if (selectedCount === 0) {
      alert('Please select at least one page to keep.')
      return
    }

    if (selectedCount === thumbnails.length) {
      console.log('[PageManagerGrid] All pages selected, no extraction needed')
      // All pages selected - no need to extract, just close
      onClose()
      return
    }

    try {
      setLoading(true)

      // Get 0-indexed page numbers of selected pages
      const selectedPageIndices = thumbnails
        .filter(t => t.selected)
        .map(t => t.pageNumber - 1) // Convert to 0-indexed

      console.log('[PageManagerGrid] Extracting pages:', selectedPageIndices)

      // Use modifiedFile if it exists (preserves previous edits)
      const baseFile = document.modifiedFile || document.file
      console.log('[PageManagerGrid] Using file:', baseFile.name, 'size:', baseFile.size)

      // Extract selected pages
      const newFile = await extractSelectedPages(baseFile, selectedPageIndices, document.name)
      console.log('[PageManagerGrid] Extracted file:', newFile.name, 'size:', newFile.size, 'pages:', selectedCount)

      // Update the document with the new file
      console.log('[PageManagerGrid] Calling onUpdateFile with new file')
      onUpdateFile(newFile, selectedCount)
      onClose()
    } catch (error) {
      console.error('[PageManagerGrid] Error extracting pages:', error)
      alert('Failed to extract selected pages. Please try again.')
      setLoading(false)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedCount === thumbnails.length) {
      alert('Cannot delete all pages. Please keep at least one page.')
      return
    }

    if (confirm(`Delete ${selectedCount} selected page(s)?`)) {
      // Invert selection - delete selected means keep unselected
      setThumbnails(prev => prev.map(t => ({ ...t, selected: !t.selected })))
    }
  }

  return (
    <div className="page-manager-overlay" onClick={onClose}>
      <div className="page-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="page-manager-header">
          <div>
            <h2>Select Pages to Keep</h2>
            <p className="page-manager-subtitle">
              {document.name} - {selectedCount} of {thumbnails.length} pages selected
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="page-manager-toolbar">
          <button
            className="toolbar-button"
            onClick={toggleSelectAll}
            title={selectAll ? 'Deselect all' : 'Select all'}
          >
            {selectAll ? <CheckSquare size={18} /> : <Square size={18} />}
            {selectAll ? 'Deselect All' : 'Select All'}
          </button>

          <button
            className="toolbar-button danger"
            onClick={handleDeleteSelected}
            disabled={selectedCount === 0}
            title="Delete selected pages"
          >
            <Trash2 size={18} />
            Delete {selectedCount} Selected
          </button>

          <div className="toolbar-spacer" />

          <div className="page-count-info">
            {selectedCount} page{selectedCount !== 1 ? 's' : ''} will be kept
          </div>
        </div>

        <div className="thumbnail-grid">
          {loading && thumbnails.some(t => !t.dataUrl) && (
            <div className="loading-message">
              Generating thumbnails... {thumbnails.filter(t => t.dataUrl).length} of {thumbnails.length}
            </div>
          )}

          {thumbnails.map(({ pageNumber, dataUrl, selected }) => (
            <div
              key={pageNumber}
              className={`thumbnail-item ${selected ? 'selected' : 'unselected'}`}
              onClick={() => togglePage(pageNumber)}
            >
              <div className="thumbnail-checkbox">
                {selected ? (
                  <Check size={20} className="check-icon" />
                ) : (
                  <div className="checkbox-empty" />
                )}
              </div>

              {dataUrl ? (
                <img src={dataUrl} alt={`Page ${pageNumber}`} className="thumbnail-image" />
              ) : (
                <div className="thumbnail-loading">Loading...</div>
              )}

              <div className="thumbnail-label">
                Page {pageNumber}
                {!selected && <span className="delete-badge">DELETE</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="page-manager-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={loading || selectedCount === 0}
          >
            <Check size={20} />
            Keep {selectedCount} Page{selectedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
