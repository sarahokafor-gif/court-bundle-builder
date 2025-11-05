import { ChevronUp, ChevronDown, Trash2, FileText } from 'lucide-react'
import { Document } from '../types'
import './DocumentList.css'

interface DocumentListProps {
  documents: Document[]
  onRemove: (id: string) => void
  onReorder: (startIndex: number, endIndex: number) => void
}

export default function DocumentList({ documents, onRemove, onReorder }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="document-list-empty">
        <FileText size={48} />
        <p>No documents added yet</p>
        <p className="empty-hint">Upload PDF files to get started</p>
      </div>
    )
  }

  const totalPages = documents.reduce((sum, doc) => sum + doc.pageCount, 0)

  return (
    <div className="document-list">
      <div className="document-list-header">
        <span>{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
        <span>{totalPages} total page{totalPages !== 1 ? 's' : ''}</span>
      </div>

      <div className="document-items">
        {documents.map((doc, index) => (
          <div key={doc.id} className="document-item">
            <div className="document-info">
              <FileText size={20} className="document-icon" />
              <div className="document-details">
                <div className="document-name">{doc.name}</div>
                <div className="document-pages">{doc.pageCount} page{doc.pageCount !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="document-actions">
              <button
                className="action-button"
                onClick={() => onReorder(index, index - 1)}
                disabled={index === 0}
                title="Move up"
              >
                <ChevronUp size={18} />
              </button>
              <button
                className="action-button"
                onClick={() => onReorder(index, index + 1)}
                disabled={index === documents.length - 1}
                title="Move down"
              >
                <ChevronDown size={18} />
              </button>
              <button
                className="action-button delete-button"
                onClick={() => onRemove(doc.id)}
                title="Remove"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
