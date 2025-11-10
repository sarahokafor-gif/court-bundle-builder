import { useState, useEffect } from 'react'
import { X, Trash2, Check } from 'lucide-react'
import { Document } from '../types'
import './PageManager.css'

interface PageManagerProps {
  document: Document
  onClose: () => void
  onSave: (selectedPages: number[]) => void
}

export default function PageManager({ document, onClose, onSave }: PageManagerProps) {
  const [selectedPages, setSelectedPages] = useState<number[]>(() => {
    // If document has selectedPages, use that, otherwise all pages are selected
    return document.selectedPages || Array.from({ length: document.pageCount }, (_, i) => i)
  })
  const [selectAll, setSelectAll] = useState(true)

  useEffect(() => {
    setSelectAll(selectedPages.length === document.pageCount)
  }, [selectedPages, document.pageCount])

  const togglePage = (pageIndex: number) => {
    setSelectedPages(prev => {
      if (prev.includes(pageIndex)) {
        return prev.filter(p => p !== pageIndex)
      } else {
        return [...prev, pageIndex].sort((a, b) => a - b)
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPages([])
    } else {
      setSelectedPages(Array.from({ length: document.pageCount }, (_, i) => i))
    }
  }

  const handleSave = () => {
    if (selectedPages.length === 0) {
      alert('Please select at least one page.')
      return
    }
    onSave(selectedPages)
    onClose()
  }

  return (
    <div className="page-manager-overlay" onClick={onClose}>
      <div className="page-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="page-manager-header">
          <div>
            <h2>Manage Pages</h2>
            <p className="page-manager-subtitle">{document.name}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="page-manager-controls">
          <div className="page-selection-info">
            <Check size={18} />
            <span>{selectedPages.length} of {document.pageCount} pages selected</span>
          </div>
          <button className="toggle-all-button" onClick={toggleSelectAll}>
            {selectAll ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="page-grid">
          {Array.from({ length: document.pageCount }, (_, i) => {
            const isSelected = selectedPages.includes(i)
            return (
              <div
                key={i}
                className={`page-card ${isSelected ? 'selected' : 'deselected'}`}
                onClick={() => togglePage(i)}
              >
                <div className="page-number-badge">
                  Page {i + 1}
                </div>
                <div className="page-preview-placeholder">
                  <div className="page-icon">📄</div>
                  {!isSelected && (
                    <div className="deselected-overlay">
                      <Trash2 size={24} />
                      <span>Excluded</span>
                    </div>
                  )}
                </div>
                <div className="page-selection-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePage(i)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="page-manager-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Selection
          </button>
        </div>
      </div>
    </div>
  )
}
