import { useState } from 'react'
import { GripVertical, Trash2, FileText, Eye, Layers, Edit3, Pen, CheckSquare, Square, ArrowUpDown } from 'lucide-react'
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Section, Document } from '../types'
import PageManager from './PageManager'
import PDFEditor from './PDFEditor'
import { burnRectanglesIntoPDF } from '../utils/pdfEditing'
import './SectionDocumentList.css'

interface SectionDocumentListProps {
  sections: Section[]
  onRemoveDocument: (sectionId: string, docId: string) => void
  onReorderDocument: (sectionId: string, docIndex: number, newIndex: number) => void
  onMoveToSection: (docId: string, fromSectionId: string, toSectionId: string) => void
  onPreview: (doc: Document) => void
  onUpdateDocumentDate: (sectionId: string, docId: string, date: string) => void
  onUpdateDocumentTitle: (sectionId: string, docId: string, title: string) => void
  onUpdateSelectedPages: (sectionId: string, docId: string, selectedPages: number[]) => void
  onUpdateDocumentFile: (sectionId: string, docId: string, modifiedFile: File) => void
  onSortSectionByDate: (sectionId: string) => void
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
  onUpdateDocumentDate: (sectionId: string, docId: string, date: string) => void
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`document-item ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
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
          <label className="sr-only" htmlFor={`title-${doc.id}`}>Custom title for {doc.name}</label>
          <input
            id={`title-${doc.id}`}
            type="text"
            className="document-title-input"
            value={doc.customTitle || ''}
            onChange={(e) => onUpdateDocumentTitle(section.id, doc.id, e.target.value)}
            placeholder="Custom title for index (optional)"
            aria-label={`Custom title for ${doc.name}`}
          />
          <div className="date-input-wrapper">
            <label className="date-label" htmlFor={`date-${doc.id}`}>
              📅 Document Date:
            </label>
            <input
              id={`date-${doc.id}`}
              type="date"
              className="document-date-input"
              value={doc.documentDate ? doc.documentDate.split('-').reverse().join('-') : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [year, month, day] = e.target.value.split('-')
                  onUpdateDocumentDate(section.id, doc.id, `${day}-${month}-${year}`)
                } else {
                  onUpdateDocumentDate(section.id, doc.id, '')
                }
              }}
              aria-label={`Set date for ${doc.name}`}
              aria-describedby={`date-help-${doc.id}`}
            />
            <span id={`date-help-${doc.id}`} className="sr-only">
              Enter the document date to enable automatic date sorting
            </span>
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
          <Pen size={14} />
          <span>Redact</span>
        </button>
        <button
          className="action-button manage-pages-button"
          onClick={() => setManagingDocument({ sectionId: section.id, doc })}
          title="Manage Pages - Select/Remove pages"
        >
          <Edit3 size={14} />
          <span>Pages</span>
        </button>
        <button
          className="action-button preview-button"
          onClick={() => onPreview(doc)}
          title="Preview Document"
        >
          <Eye size={14} />
          <span>View</span>
        </button>
        <button
          className="action-button delete-button"
          onClick={() => onRemoveDocument(section.id, doc.id)}
          title="Delete Document"
        >
          <Trash2 size={14} />
          <span>Delete</span>
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
  onSortSectionByDate,
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

  // Count documents with dates set
  const docsWithDates = sections.reduce(
    (sum, section) => sum + section.documents.filter(doc => doc.documentDate).length,
    0
  )

  return (
    <div className="section-document-list" role="region" aria-label="Document list organised by sections">
      <div className="section-document-list-header">
        <span>{totalDocs} document{totalDocs !== 1 ? 's' : ''} in {sections.length} section{sections.length !== 1 ? 's' : ''}</span>
        <span>{totalPages} total page{totalPages !== 1 ? 's' : ''}</span>
      </div>

      {/* Accessibility Guide */}
      <div className="document-guide" role="note" aria-label="Instructions for managing documents">
        <h3 className="guide-title">📋 How to Organise Your Documents</h3>
        <ol className="guide-steps">
          <li><strong>Set document dates:</strong> Use the date picker on each document to enter when it was created or received</li>
          <li><strong>Sort automatically:</strong> Click the yellow <strong>"SORT BY DATE"</strong> button in any section header to arrange documents (undated first, then oldest to newest)</li>
          <li><strong>Drag to reorder:</strong> Use the grip handle (⋮⋮) on the left to manually drag documents into your preferred order</li>
          <li><strong>Move between sections:</strong> Use the dropdown menu to move a document to a different section</li>
        </ol>
        {totalDocs > 0 && (
          <p className="guide-status" aria-live="polite">
            <strong>Status:</strong> {docsWithDates} of {totalDocs} documents have dates set.
            {docsWithDates < totalDocs && " Add dates to enable automatic sorting."}
          </p>
        )}
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
              <div className="section-header-actions">
                {section.documents.length > 1 && (
                  <button
                    className="sort-by-date-btn"
                    onClick={() => onSortSectionByDate(section.id)}
                    aria-label={`Sort all ${section.documents.length} documents in ${section.name} by date, oldest first`}
                    title="Click to automatically arrange documents by date (undated first, then oldest to newest)"
                  >
                    <ArrowUpDown size={18} aria-hidden="true" />
                    <span>Sort by Date</span>
                  </button>
                )}
                <span className="section-doc-count" aria-label={`${section.documents.length} document${section.documents.length !== 1 ? 's' : ''} in this section`}>
                  {section.documents.length} doc{section.documents.length !== 1 ? 's' : ''}
                </span>
              </div>
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
