import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Section } from '../types'
import SearchableDropdown, { CategoryOption } from './SearchableDropdown'
import bundleRequirementsData from '../data/bundleRequirements.json'
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
  const [autoAlphabetical, setAutoAlphabetical] = useState(true)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [categorizedOptions, setCategorizedOptions] = useState<CategoryOption[]>([])

  // Build categorized options from bundleRequirementsData
  useEffect(() => {
    const categories: CategoryOption[] = []

    // Group bundle types by category
    const courtBundles = ['family_children', 'financial_remedy', 'court_of_appeal', 'civil_trial', 'court_of_protection']
    const tribunals = ['employment_tribunal', 'immigration_asylum', 'mental_health_tribunal', 'social_security', 'property_tribunal']
    const planningAppeals = ['planning_appeals']
    const appealsTribunals = ['upper_tribunal', 'employment_appeal']
    const general = ['general']

    const addCategory = (groupName: string, groupIcon: string, bundleKeys: string[]) => {
      bundleKeys.forEach(key => {
        const bundleType = bundleRequirementsData.bundle_types[key as keyof typeof bundleRequirementsData.bundle_types]
        if (bundleType) {
          categories.push({
            categoryName: bundleType.name,
            categoryIcon: bundleType.icon,
            options: bundleType.sections,
          })
        }
      })
    }

    // Add Court Bundles
    addCategory('Court Bundles', '⚖️', courtBundles)

    // Add First-Tier Tribunals
    addCategory('First-Tier Tribunals', '📋', tribunals)

    // Add Planning & Appeals
    addCategory('Planning & Land', '🏗️', planningAppeals)

    // Add Appeals Tribunals
    addCategory('Appeals Tribunals', '📊', appealsTribunals)

    // Add General
    addCategory('General', '📝', general)

    setCategorizedOptions(categories)
  }, [])

  const handleAddSection = () => {
    const sectionName = isCustomMode ? newSectionName.trim() : selectedTemplate

    if (!sectionName) return

    // Auto-generate alphabetical prefix if enabled
    const prefix = autoAlphabetical
      ? String.fromCharCode(65 + sections.length) // A, B, C, etc.
      : newSectionPrefix.trim() || String.fromCharCode(65 + sections.length)

    onAddSection(sectionName, prefix)

    // Reset form
    setNewSectionName('')
    setNewSectionPrefix('')
    setSelectedTemplate('')
    setIsCustomMode(false)
  }

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value)
    if (value && !isCustomMode) {
      // Template selected, not in custom mode
      setIsCustomMode(false)
    }
  }

  const handleCustomSelected = () => {
    setIsCustomMode(true)
    setSelectedTemplate('')
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
        <div className="section-add-header">
          <h3>Add New Section</h3>
          <label className="auto-alphabetical-toggle">
            <input
              type="checkbox"
              checked={autoAlphabetical}
              onChange={(e) => setAutoAlphabetical(e.target.checked)}
            />
            <span>Auto-alphabetical prefixes (A, B, C...)</span>
          </label>
        </div>

        {!isCustomMode ? (
          <SearchableDropdown
            categorizedOptions={categorizedOptions}
            value={selectedTemplate}
            onChange={handleTemplateChange}
            placeholder="Type to search or scroll to select a section template"
            customOptionLabel="Custom (Enter Your Own)"
            onCustomSelected={handleCustomSelected}
            label="Section Template"
            id="section-template"
          />
        ) : (
          <div className="custom-section-input">
            <label htmlFor="custom-section-name">Custom Section Name</label>
            <input
              id="custom-section-name"
              type="text"
              placeholder="Enter your custom section name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
              className="section-name-input"
              autoFocus
            />
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsCustomMode(false)
                setNewSectionName('')
              }}
              aria-label="Back to templates"
            >
              ← Back to Templates
            </button>
          </div>
        )}

        {!autoAlphabetical && (
          <input
            type="text"
            placeholder="Prefix (e.g., A)"
            value={newSectionPrefix}
            onChange={(e) => setNewSectionPrefix(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
            className="section-prefix-input"
            maxLength={3}
          />
        )}

        <button
          onClick={handleAddSection}
          className="btn btn-primary"
          disabled={!isCustomMode && !selectedTemplate}
          aria-label="Add new section"
        >
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
                  <button className="btn btn-icon" onClick={saveEditing} aria-label="Save section name">
                    <Check size={16} />
                  </button>
                  <button className="btn btn-icon" onClick={cancelEditing} aria-label="Cancel editing">
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
                      className="btn btn-icon"
                      onClick={() => startEditing(section)}
                      title="Rename section"
                      aria-label={`Rename ${section.name} section`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn btn-icon btn-danger"
                      onClick={() => onRemoveSection(section.id)}
                      title="Delete section"
                      aria-label={`Delete ${section.name} section`}
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
