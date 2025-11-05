import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { useState } from 'react'
import { Section } from '../types'
import './SectionManager.css'

interface SectionManagerProps {
  sections: Section[]
  onAddSection: (name: string, pagePrefix: string) => void
  onRemoveSection: (id: string) => void
  onRenameSection: (id: string, name: string) => void
  onToggleDivider: (id: string) => void
  onUpdatePagination: (id: string, pagePrefix: string, startPage: number) => void
}

export default function SectionManager({
  sections,
  onAddSection,
  onRemoveSection,
  onRenameSection,
  onToggleDivider,
  onUpdatePagination,
}: SectionManagerProps) {
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionPrefix, setNewSectionPrefix] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      // Auto-generate prefix if not provided (A, B, C, etc.)
      const prefix = newSectionPrefix.trim() || String.fromCharCode(65 + sections.length)
      onAddSection(newSectionName.trim(), prefix)
      setNewSectionName('')
      setNewSectionPrefix('')
    }
  }

  const startEditing = (section: Section) => {
    setEditingId(section.id)
    setEditingName(section.name)
  }

  const saveEditing = () => {
    if (editingId && editingName.trim()) {
      onRenameSection(editingId, editingName.trim())
      setEditingId(null)
      setEditingName('')
    }
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="section-manager">
      <div className="section-add">
        <input
          type="text"
          placeholder="Section name (e.g., Pleadings)"
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
          className="section-name-input"
        />
        <input
          type="text"
          placeholder="Prefix (e.g., A)"
          value={newSectionPrefix}
          onChange={(e) => setNewSectionPrefix(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
          className="section-prefix-input"
          maxLength={3}
        />
        <button onClick={handleAddSection} className="add-section-button">
          <Plus size={18} />
          Add Section
        </button>
      </div>

      <div className="sections-list">
        {sections.map((section) => (
          <div key={section.id} className="section-item">
            <div className="section-info">
              {editingId === section.id ? (
                <div className="section-edit">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEditing()}
                    autoFocus
                  />
                  <button className="icon-button save-button" onClick={saveEditing}>
                    <Check size={16} />
                  </button>
                  <button className="icon-button cancel-button" onClick={cancelEditing}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="section-details">
                    <div className="section-name-container">
                      <span className="section-name">{section.name}</span>
                      <span className="section-count">
                        ({section.documents.length} doc{section.documents.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="section-pagination">
                      <div className="pagination-field">
                        <label>Prefix:</label>
                        <input
                          type="text"
                          value={section.pagePrefix}
                          onChange={(e) =>
                            onUpdatePagination(section.id, e.target.value, section.startPage)
                          }
                          maxLength={3}
                          className="prefix-input"
                        />
                      </div>
                      <div className="pagination-field">
                        <label>Start:</label>
                        <input
                          type="number"
                          value={section.startPage}
                          onChange={(e) =>
                            onUpdatePagination(
                              section.id,
                              section.pagePrefix,
                              parseInt(e.target.value) || 1
                            )
                          }
                          min={1}
                          className="start-input"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="section-actions">
                    <label className="divider-toggle">
                      <input
                        type="checkbox"
                        checked={section.addDivider}
                        onChange={() => onToggleDivider(section.id)}
                      />
                      <span>{section.addDivider ? `✓ Divider: ${section.name}` : 'Add divider page'}</span>
                    </label>
                    <button
                      className="icon-button"
                      onClick={() => startEditing(section)}
                      title="Rename section"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="icon-button delete-button"
                      onClick={() => onRemoveSection(section.id)}
                      title="Delete section"
                      disabled={section.documents.length > 0}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="no-sections">
            <p>No sections yet. Add your first section above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
