import { useState } from 'react'
import { ChevronUp, ChevronDown, Trash2, FileText, Eye, Layers, Edit3, Pen } from 'lucide-react'
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
  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)
  const totalPages = sections.reduce(
    (sum, section) => sum + section.documents.reduce((docSum, doc) => docSum + doc.pageCount, 0),
    0
  )

  if (totalDocs === 0) {
    return (
      <div className="section-document-list-empty">
        <FileText size={48} />
        <p>No documents added yet</p>
        <p className="empty-hint">Upload PDF files and they'll appear here</p>
      </div>
    )
  }

  return (
    <div className="section-document-list">
      <div className="section-document-list-header">
        <span>{totalDocs} document{totalDocs !== 1 ? 's' : ''} in {sections.length} section{sections.length !== 1 ? 's' : ''}</span>
        <span>{totalPages} total page{totalPages !== 1 ? 's' : ''}</span>
      </div>

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
              {/* Show divider page if enabled */}
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

              {section.documents.map((doc, index) => (
                <div key={doc.id} className="document-item">
                  <div className="document-info">
                    <FileText size={18} className="document-icon" />
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
                      <input
                        type="text"
                        className="document-title-input"
                        value={doc.customTitle || ''}
                        onChange={(e) => onUpdateDocumentTitle(section.id, doc.id, e.target.value)}
                        placeholder="Custom title for index (optional)"
                        title="Custom title to display in the bundle index"
                      />
                      <input
                        type="date"
                        className="document-date-input"
                        value={doc.documentDate ? doc.documentDate.split('-').reverse().join('-') : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            // Convert from YYYY-MM-DD to DD-MM-YYYY
                            const [year, month, day] = e.target.value.split('-')
                            onUpdateDocumentDate(section.id, doc.id, `${day}-${month}-${year}`)
                          } else {
                            onUpdateDocumentDate(section.id, doc.id, '')
                          }
                        }}
                        placeholder="Document date (optional)"
                        title="Document date (optional)"
                      />
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
                      className="action-button"
                      onClick={() => onReorderDocument(section.id, index, index - 1)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className="action-button"
                      onClick={() => onReorderDocument(section.id, index, index + 1)}
                      disabled={index === section.documents.length - 1}
                      title="Move down"
                    >
                      <ChevronDown size={16} />
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
              ))}
            </div>
          )}
        </div>
      ))}

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
              // Burn the rectangles into the PDF
              const modifiedFile = await burnRectanglesIntoPDF(editingDocument.doc.file, rectangles)

              // Update the document with the modified file
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
