import { useState, useRef, useEffect } from 'react'
import { GripVertical, Trash2, FileText, Eye, Layers, Edit3, Pen, CheckSquare, Square, Calendar, AlertCircle, BookTemplate } from 'lucide-react'
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Section, Document, DatePrecision } from '../types'
import { formatDateForInput, formatDateFromInput, extractDateWithPrecision } from '../utils/dateExtraction'
import { searchTemplates, getFirstPlaceholderRange } from '../utils/documentTemplates'
import PageManager from './PageManager'
import PDFEditor from './PDFEditor'
import { burnRectanglesIntoPDF } from '../utils/pdfEditing'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import './SectionDocumentList.css'

interface SectionDocumentListProps {
  sections: Section[]
  onRemoveDocument: (sectionId: string, docId: string) => void
  onReorderDocument: (sectionId: string, docIndex: number, newIndex: number) => void
  onMoveToSection: (docId: string, fromSectionId: string, toSectionId: string) => void
  onPreview: (doc: Document) => void
  onUpdateDocumentDate: (sectionId: string, docId: string, date: string, precision?: DatePrecision) => void
  onUpdateDocumentTitle: (sectionId: string, docId: string, title: string) => void
  onUpdateSelectedPages: (sectionId: string, docId: string, selectedPages: number[]) => void
  onUpdateDocumentFile: (sectionId: string, docId: string, modifiedFile: File) => void
}

interface SortableDocumentItemProps {
  doc: Document
  section: Section
  sections: Section[]
  isSelected: boolean
  onToggleSelection: (docId: string) => void
  onRemoveDocument: (sectionId: string, docId: string) => void
  onMoveToSection: (docId: string, fromSectionId: string, toSectionId: string) => void
  onPreview: (doc: Document) => void
  onUpdateDocumentDate: (sectionId: string, docId: string, date: string, precision?: DatePrecision) => void
  onUpdateDocumentTitle: (sectionId: string, docId: string, title: string) => void
  setManagingDocument: (value: { sectionId: string; doc: Document } | null) => void
  setEditingDocument: (value: { sectionId: string; doc: Document } | null) => void
}

function SortableDocumentItem({
  doc,
  section,
  sections,
  isSelected,
  onToggleSelection,
  onRemoveDocument,
  onMoveToSection,
  onPreview,
  onUpdateDocumentDate,
  onUpdateDocumentTitle,
  setManagingDocument,
  setEditingDocument,
}: SortableDocumentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Template and autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [titleInputValue, setTitleInputValue] = useState(doc.customTitle || '')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // Update local state when doc.customTitle changes
  useEffect(() => {
    setTitleInputValue(doc.customTitle || '')
  }, [doc.customTitle])

  // Get autocomplete suggestions based on current input
  const suggestions = showAutocomplete && titleInputValue.trim()
    ? searchTemplates(titleInputValue, 8)
    : []

  // Handle clicking outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        titleInputRef.current &&
        !titleInputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false)
      }
    }

    if (showAutocomplete) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAutocomplete])

  const handleTitleChange = (value: string) => {
    setTitleInputValue(value)
    setShowAutocomplete(value.trim().length > 0)
  }

  const handleTitleBlur = () => {
    // Save the title when input loses focus
    if (titleInputValue !== doc.customTitle) {
      onUpdateDocumentTitle(section.id, doc.id, titleInputValue)

      // Auto-extract date with precision when title is saved
      const extractionResult = extractDateWithPrecision(titleInputValue)
      if (extractionResult.date && extractionResult.precision !== 'none') {
        onUpdateDocumentDate(section.id, doc.id, extractionResult.date, extractionResult.precision)
      }
    }
  }

  const handleSelectTemplate = (templateName: string) => {
    setTitleInputValue(templateName)
    onUpdateDocumentTitle(section.id, doc.id, templateName)
    setShowAutocomplete(false)

    // Auto-select first placeholder
    setTimeout(() => {
      if (titleInputRef.current) {
        const range = getFirstPlaceholderRange(templateName)
        if (range) {
          titleInputRef.current.focus()
          titleInputRef.current.setSelectionRange(range.start, range.end)
        }
      }
    }, 0)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`document-item ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
      data-document-id={doc.id}
    >
      <button
        className="document-select-checkbox"
        onClick={() => onToggleSelection(doc.id)}
        aria-label={isSelected ? 'Deselect document' : 'Select document'}
        title={isSelected ? 'Deselect document' : 'Select document'}
      >
        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
      </button>

      <div className="document-drag-handle" {...attributes} {...listeners}>
        <GripVertical size={18} />
      </div>

      <div className="document-info">
        {doc.thumbnail ? (
          <img src={doc.thumbnail} alt={`${doc.name} preview`} className="document-thumbnail" />
        ) : (
          <FileText size={18} className="document-icon" />
        )}
        <div className="document-details">
          <div className="document-name">{doc.name}</div>
          <div className="document-pages">
            {doc.pageCount} page{doc.pageCount !== 1 ? 's' : ''}
            {doc.selectedPages && doc.selectedPages.length !== doc.pageCount && (
              <span className="selected-pages-badge">
                {doc.selectedPages.length} selected
              </span>
            )}
          </div>
          <div className="document-title-wrapper" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                ref={titleInputRef}
                type="text"
                className="document-title-input"
                value={titleInputValue}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                onFocus={() => {
                  if (titleInputValue.trim().length > 0) {
                    setShowAutocomplete(true)
                  }
                }}
                placeholder="Custom title for index (optional) - start typing for templates"
                title="Custom title to display in the bundle index. Start typing to see suggested templates with placeholders."
                aria-label="Document custom title with template suggestions"
              />
              <button
                type="button"
                className="template-button"
                onClick={() => {
                  setShowAutocomplete(!showAutocomplete)
                  titleInputRef.current?.focus()
                }}
                title="Show document templates"
                aria-label="Show document name templates"
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}
              >
                <BookTemplate size={14} />
                Templates
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showAutocomplete && suggestions.length > 0 && (
              <div
                ref={autocompleteRef}
                className="autocomplete-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  marginTop: '2px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                {suggestions.map((template, index) => (
                  <div
                    key={index}
                    className="autocomplete-item"
                    onClick={() => handleSelectTemplate(template.name)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                      fontSize: '13px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f7ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white'
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{template.name}</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      {template.category === 'full-date' && '📅 Full date (day precision)'}
                      {template.category === 'month-year' && '📅 Month + year precision'}
                      {template.category === 'year-only' && '📅 Year only'}
                      {template.category === 'no-date' && 'No date'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="document-date-field">
            <input
              type="date"
              className="document-date-input"
              value={doc.documentDate ? formatDateForInput(doc.documentDate) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  onUpdateDocumentDate(section.id, doc.id, formatDateFromInput(e.target.value))
                } else {
                  onUpdateDocumentDate(section.id, doc.id, '')
                }
              }}
              placeholder="DD/MM/YYYY"
              title="Click to set document date. Used for chronological sorting. Dates are auto-detected from filenames when available."
              aria-label={`Document date for ${doc.name}${doc.documentDate ? ` (currently set to ${doc.documentDate})` : ' (not set)'}`}
            />
            {(() => {
              const precision = doc.datePrecision || 'none'

              if (precision === 'day' && doc.documentDate) {
                return (
                  <span
                    className="date-badge auto-detected"
                    title="📅 Full date detected (day precision). Most precise - appears last in chronological sort."
                    style={{
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      border: '1px solid #a5d6a7',
                    }}
                  >
                    <Calendar size={12} />
                    Full Date ✅
                  </span>
                )
              } else if (precision === 'month' && doc.documentDate) {
                return (
                  <span
                    className="date-badge manually-set"
                    title="📅 Month + year detected (month precision). Appears after year-only dates in chronological sort."
                    style={{
                      backgroundColor: '#fff3e0',
                      color: '#e65100',
                      border: '1px solid #ffcc80',
                    }}
                  >
                    <Calendar size={12} />
                    Month+Year ~
                  </span>
                )
              } else if (precision === 'year' && doc.documentDate) {
                return (
                  <span
                    className="date-badge manually-set"
                    title="📅 Year only detected (year precision). Appears after undated documents in chronological sort."
                    style={{
                      backgroundColor: '#e3f2fd',
                      color: '#1565c0',
                      border: '1px solid #90caf9',
                    }}
                  >
                    <Calendar size={12} />
                    Year Only
                  </span>
                )
              } else {
                return (
                  <span
                    className="date-badge no-date"
                    title="⚠️ No date detected. Documents without dates appear first when using chronological sort."
                  >
                    <AlertCircle size={12} />
                    No date
                  </span>
                )
              }
            })()}
          </div>
        </div>
      </div>

      <div className="document-actions">
        {sections.length > 1 && (
          <select
            className="section-selector"
            value={section.id}
            onChange={(e) => onMoveToSection(doc.id, section.id, e.target.value)}
            title="Move to section"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <button
          className="action-button edit-pdf-button"
          onClick={() => setEditingDocument({ sectionId: section.id, doc })}
          title="Edit PDF - Redact/Erase"
        >
          <Pen size={16} />
        </button>
        <button
          className="action-button manage-pages-button"
          onClick={() => setManagingDocument({ sectionId: section.id, doc })}
          title="Manage Pages - Select/Remove pages"
        >
          <Edit3 size={16} />
        </button>
        <button
          className="action-button"
          onClick={() => onPreview(doc)}
          title="Preview"
        >
          <Eye size={16} />
        </button>
        <button
          className="action-button delete-button"
          onClick={() => onRemoveDocument(section.id, doc.id)}
          title="Remove"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function SectionDocumentList({
  sections,
  onRemoveDocument,
  onReorderDocument,
  onMoveToSection,
  onPreview,
  onUpdateDocumentDate,
  onUpdateDocumentTitle,
  onUpdateSelectedPages,
  onUpdateDocumentFile,
}: SectionDocumentListProps) {
  const [managingDocument, setManagingDocument] = useState<{ sectionId: string; doc: Document } | null>(null)
  const [editingDocument, setEditingDocument] = useState<{ sectionId: string; doc: Document } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)
  const totalPages = sections.reduce(
    (sum, section) => sum + section.documents.reduce((docSum, doc) => docSum + doc.pageCount, 0),
    0
  )

  // Get all document IDs
  const allDocumentIds = sections.flatMap(section => section.documents.map(doc => doc.id))

  // Batch operations handlers
  const handleToggleSelection = (docId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    setSelectedDocuments(new Set(allDocumentIds))
  }

  const handleDeselectAll = () => {
    setSelectedDocuments(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedDocuments.size === 0) return

    const confirmMessage = `Delete ${selectedDocuments.size} selected document${selectedDocuments.size !== 1 ? 's' : ''}?`
    if (!confirm(confirmMessage)) return

    // Delete each selected document
    sections.forEach(section => {
      section.documents.forEach(doc => {
        if (selectedDocuments.has(doc.id)) {
          onRemoveDocument(section.id, doc.id)
        }
      })
    })

    setSelectedDocuments(new Set())
  }

  const handleBulkMoveToSection = (targetSectionId: string) => {
    if (selectedDocuments.size === 0) return

    // Move each selected document to the target section
    sections.forEach(section => {
      section.documents.forEach(doc => {
        if (selectedDocuments.has(doc.id) && section.id !== targetSectionId) {
          onMoveToSection(doc.id, section.id, targetSectionId)
        }
      })
    })

    setSelectedDocuments(new Set())
  }

  // Keyboard shortcuts for document management
  useKeyboardShortcuts({
    enabled: totalDocs > 0,
    shortcuts: [
      {
        key: 'a',
        ctrlKey: true,
        metaKey: true,
        description: 'Select all documents',
        action: handleSelectAll,
      },
      {
        key: 'd',
        ctrlKey: true,
        metaKey: true,
        description: 'Deselect all documents',
        action: handleDeselectAll,
      },
      {
        key: 'Delete',
        description: 'Delete selected documents',
        action: handleBulkDelete,
        preventDefault: false,
      },
      {
        key: 'Backspace',
        description: 'Delete selected documents',
        action: handleBulkDelete,
        preventDefault: false,
      },
      {
        key: 'Escape',
        description: 'Deselect all documents',
        action: handleDeselectAll,
        preventDefault: false,
      },
    ],
  })

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    // Find which section the dragged document is in
    let sourceSectionId = ''
    let sourceIndex = -1
    let targetSectionId = ''
    let targetIndex = -1

    sections.forEach((section) => {
      const activeIdx = section.documents.findIndex((doc) => doc.id === active.id)
      if (activeIdx !== -1) {
        sourceSectionId = section.id
        sourceIndex = activeIdx
      }

      const overIdx = section.documents.findIndex((doc) => doc.id === over.id)
      if (overIdx !== -1) {
        targetSectionId = section.id
        targetIndex = overIdx
      }
    })

    if (sourceSectionId && targetSectionId) {
      if (sourceSectionId === targetSectionId) {
        // Reorder within the same section
        onReorderDocument(sourceSectionId, sourceIndex, targetIndex)
      } else {
        // Move to different section
        // First move to the target section
        onMoveToSection(active.id as string, sourceSectionId, targetSectionId)
        // Then reorder to the correct position
        // Note: This is a simplified approach. You might need to enhance this
        // to get the exact target position after the move.
      }
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  if (totalDocs === 0) {
    return (
      <div className="section-document-list-empty">
        <FileText size={48} />
        <p>No documents added yet</p>
        <p className="empty-hint">Upload PDF files and they'll appear here</p>
      </div>
    )
  }

  // Find the active document for the drag overlay
  let activeDocument: Document | null = null
  let activeSection: Section | null = null
  if (activeId) {
    for (const section of sections) {
      const doc = section.documents.find((d) => d.id === activeId)
      if (doc) {
        activeDocument = doc
        activeSection = section
        break
      }
    }
  }

  return (
    <div className="section-document-list">
      <div className="section-document-list-header">
        <span>{totalDocs} document{totalDocs !== 1 ? 's' : ''} in {sections.length} section{sections.length !== 1 ? 's' : ''}</span>
        <span>{totalPages} total page{totalPages !== 1 ? 's' : ''}</span>
      </div>

      {/* Batch Operations Toolbar */}
      {totalDocs > 0 && (
        <div className="batch-operations-toolbar">
          <div className="batch-selection-controls">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSelectAll}
              disabled={selectedDocuments.size === allDocumentIds.length}
              aria-label="Select all documents"
            >
              Select All ({allDocumentIds.length})
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleDeselectAll}
              disabled={selectedDocuments.size === 0}
              aria-label="Deselect all documents"
            >
              Deselect All
            </button>
            {selectedDocuments.size > 0 && (
              <span className="selected-count">
                {selectedDocuments.size} selected
              </span>
            )}
          </div>

          {selectedDocuments.size > 0 && (
            <div className="batch-actions">
              {sections.length > 1 && (
                <div className="batch-move-section">
                  <label htmlFor="bulk-move-section">Move to:</label>
                  <select
                    id="bulk-move-section"
                    className="section-selector"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkMoveToSection(e.target.value)
                        e.target.value = '' // Reset dropdown
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select section...</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={handleBulkDelete}
                aria-label={`Delete ${selectedDocuments.size} selected document${selectedDocuments.size !== 1 ? 's' : ''}`}
              >
                <Trash2 size={16} />
                Delete Selected ({selectedDocuments.size})
              </button>
            </div>
          )}
        </div>
      )}

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {sections.map((section) => (
          <div key={section.id} className="section-block">
            <div className="section-block-header">
              <div className="section-block-title">
                <span className="section-name">{section.name}</span>
                {section.addDivider && <span className="divider-badge">Divider</span>}
              </div>
              <span className="section-doc-count">
                {section.documents.length} doc{section.documents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {section.documents.length === 0 && !section.addDivider ? (
              <div className="section-empty">
                <p>No documents in this section</p>
              </div>
            ) : (
              <div className="section-documents">
                {section.addDivider && (
                  <div className="divider-item">
                    <div className="divider-info">
                      <Layers size={18} className="divider-icon" />
                      <div className="divider-details">
                        <div className="divider-name">Divider: {section.name}</div>
                        <div className="divider-note">Section divider page</div>
                      </div>
                    </div>
                    <div className="divider-page-number">
                      {section.pagePrefix}{section.startPage.toString().padStart(3, '0')}
                    </div>
                  </div>
                )}

                <SortableContext
                  items={section.documents.map((doc) => doc.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {section.documents.map((doc) => (
                    <SortableDocumentItem
                      key={doc.id}
                      doc={doc}
                      section={section}
                      sections={sections}
                      isSelected={selectedDocuments.has(doc.id)}
                      onToggleSelection={handleToggleSelection}
                      onRemoveDocument={onRemoveDocument}
                      onMoveToSection={onMoveToSection}
                      onPreview={onPreview}
                      onUpdateDocumentDate={onUpdateDocumentDate}
                      onUpdateDocumentTitle={onUpdateDocumentTitle}
                      setManagingDocument={setManagingDocument}
                      setEditingDocument={setEditingDocument}
                    />
                  ))}
                </SortableContext>
              </div>
            )}
          </div>
        ))}

        <DragOverlay>
          {activeDocument && activeSection && (
            <div className="document-item dragging-overlay">
              <div className="document-drag-handle">
                <GripVertical size={18} />
              </div>
              <div className="document-info">
                {activeDocument.thumbnail ? (
                  <img src={activeDocument.thumbnail} alt={`${activeDocument.name} preview`} className="document-thumbnail" />
                ) : (
                  <FileText size={18} className="document-icon" />
                )}
                <div className="document-details">
                  <div className="document-name">{activeDocument.name}</div>
                  <div className="document-pages">
                    {activeDocument.pageCount} page{activeDocument.pageCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {managingDocument && (
        <PageManager
          document={managingDocument.doc}
          onClose={() => setManagingDocument(null)}
          onSave={(selectedPages) => {
            onUpdateSelectedPages(managingDocument.sectionId, managingDocument.doc.id, selectedPages)
          }}
        />
      )}

      {editingDocument && (
        <PDFEditor
          document={editingDocument.doc}
          onClose={() => setEditingDocument(null)}
          onSave={async (rectangles) => {
            if (rectangles.length === 0) {
              setEditingDocument(null)
              return
            }

            try {
              const modifiedFile = await burnRectanglesIntoPDF(editingDocument.doc.file, rectangles)
              onUpdateDocumentFile(editingDocument.sectionId, editingDocument.doc.id, modifiedFile)
              alert(`Successfully applied ${rectangles.length} redaction${rectangles.length !== 1 ? 's' : ''}/erasure${rectangles.length !== 1 ? 's' : ''}!`)
              setEditingDocument(null)
            } catch (error) {
              console.error('Error saving PDF edits:', error)
              alert('Failed to save PDF edits. Please try again.')
            }
          }}
        />
      )}
    </div>
  )
}
