import { ChevronUp, ChevronDown, Trash2, FileText, Eye, Layers } from 'lucide-react'
import { Section, Document } from '../types'
import './SectionDocumentList.css'

interface SectionDocumentListProps {
  sections: Section[]
  onRemoveDocument: (sectionId: string, docId: string) => void
  onReorderDocument: (sectionId: string, docIndex: number, newIndex: number) => void
  onMoveToSection: (docId: string, fromSectionId: string, toSectionId: string) => void
  onPreview: (doc: Document) => void
}

export default function SectionDocumentList({
  sections,
  onRemoveDocument,
  onReorderDocument,
  onMoveToSection,
  onPreview,
}: SectionDocumentListProps) {
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
                    {section.pagePrefix}{section.startPage}
                  </div>
                </div>
              )}

              {section.documents.map((doc, index) => (
                <div key={doc.id} className="document-item">
                  <div className="document-info">
                    <FileText size={18} className="document-icon" />
                    <div className="document-details">
                      <div className="document-name">{doc.name}</div>
                      <div className="document-pages">{doc.pageCount} page{doc.pageCount !== 1 ? 's' : ''}</div>
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
    </div>
  )
}
