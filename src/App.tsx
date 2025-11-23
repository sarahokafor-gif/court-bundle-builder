import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Section, Document, BundleMetadata, PageNumberSettings, BatesNumberSettings, BundleType, DatePrecision } from './types'
import MetadataForm from './components/MetadataForm'
import DocumentUploader from './components/DocumentUploader'
import SectionManager from './components/SectionManager'
import SectionDocumentList from './components/SectionDocumentList'
import BundleGenerator from './components/BundleGenerator'
import DocumentPreview from './components/DocumentPreview'
import PageNumberSettingsComponent from './components/PageNumberSettings'
import BatesNumberSettingsComponent from './components/BatesNumberSettings'
import SaveLoadButtons from './components/SaveLoadButtons'
import BundleRequirementsInfo from './components/BundleRequirementsInfo'
import PricingDisplay from './components/PricingDisplay'
import AutoSaveRecovery from './components/AutoSaveRecovery'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import BundleValidation from './components/BundleValidation'
import TemplateSelector from './components/TemplateSelector'
import { useToast } from './components/Toast'
import { saveBundle, loadBundle, deserializeSections } from './utils/saveLoad'
import {
  autoSaveToLocalStorage,
  getAutoSaveData,
  clearAutoSave,
  hasAutoSave,
  AUTO_SAVE_INTERVAL,
} from './utils/autoSave'
import { getPdfPageCount } from './utils/pdfUtils'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import './App.css'

function App() {
  const [metadata, setMetadata] = useState<BundleMetadata>({
    bundleTitle: '',
    caseNumber: '',
    court: '',
    parties: [], // New: dynamic party list
    preparerName: '',
    preparerRole: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'default',
      name: 'Main Documents',
      documents: [],
      addDivider: false,
      order: 0,
      pagePrefix: 'A',
      startPage: 1,
    },
  ])
  const [pageNumberSettings, setPageNumberSettings] = useState<PageNumberSettings>({
    position: 'bottom-center',
    fontSize: 10,
    bold: false,
  })
  const [batesNumberSettings, setBatesNumberSettings] = useState<BatesNumberSettings>({
    enabled: false,
    prefix: 'DOC',
    startNumber: 1,
    digits: 3,
    position: 'top-right',
    fontSize: 10,
  })
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const autoSaveIntervalRef = useRef<number | null>(null)
  const isInitialMount = useRef(true)
  const generateButtonRef = useRef<HTMLButtonElement | null>(null)
  const generateIndexButtonRef = useRef<HTMLButtonElement | null>(null)
  const { showToast } = useToast()

  const handleAddDocuments = useCallback((newDocs: Document[]) => {
    // Add to the first section
    setSections(prev => {
      const updated = [...prev]
      updated[0] = {
        ...updated[0],
        documents: [...updated[0].documents, ...newDocs],
      }
      return updated
    })
    showToast('success', `Added ${newDocs.length} document${newDocs.length !== 1 ? 's' : ''}`)
  }, [showToast])

  const handleAddSection = useCallback((name: string, pagePrefix: string) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name,
      documents: [],
      addDivider: false,
      order: sections.length,
      pagePrefix,
      startPage: 1,
    }
    setSections(prev => [...prev, newSection])
  }, [sections.length])

  const handleUpdatePagination = useCallback((id: string, pagePrefix: string, startPage: number) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, pagePrefix, startPage } : section
      )
    )
  }, [])

  const handleRemoveSection = useCallback((id: string) => {
    setSections(prev => prev.filter(section => section.id !== id))
  }, [])

  const handleRenameSection = useCallback((id: string, name: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, name } : section
      )
    )
  }, [])

  const handleToggleDivider = useCallback((id: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, addDivider: !section.addDivider } : section
      )
    )
  }, [])

  const handleRemoveDocument = useCallback((sectionId: string, docId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, documents: section.documents.filter(doc => doc.id !== docId) }
          : section
      )
    )
  }, [])

  const handleReorderDocument = useCallback((sectionId: string, docIndex: number, newIndex: number) => {
    if (newIndex < 0) return

    setSections(prev =>
      prev.map(section => {
        if (section.id !== sectionId) return section

        if (newIndex >= section.documents.length) return section

        const docs = [...section.documents]
        const [removed] = docs.splice(docIndex, 1)
        docs.splice(newIndex, 0, removed)

        return {
          ...section,
          documents: docs.map((doc, index) => ({ ...doc, order: index })),
        }
      })
    )
  }, [])

  const handleMoveToSection = useCallback((docId: string, fromSectionId: string, toSectionId: string) => {
    if (fromSectionId === toSectionId) return

    setSections(prev => {
      const fromSection = prev.find(s => s.id === fromSectionId)
      const doc = fromSection?.documents.find(d => d.id === docId)

      if (!doc) return prev

      return prev.map(section => {
        if (section.id === fromSectionId) {
          return {
            ...section,
            documents: section.documents.filter(d => d.id !== docId),
          }
        }
        if (section.id === toSectionId) {
          return {
            ...section,
            documents: [...section.documents, doc],
          }
        }
        return section
      })
    })
  }, [])

  const handleUpdateDocumentDate = useCallback((sectionId: string, docId: string, date: string, precision?: DatePrecision) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              documents: section.documents.map(doc =>
                doc.id === docId
                  ? {
                      ...doc,
                      documentDate: date,
                      // Use provided precision if given (from auto-extraction),
                      // otherwise use day precision for manual date picker,
                      // or none when clearing
                      datePrecision: precision || (date ? 'day' : 'none'),
                    }
                  : doc
              ),
            }
          : section
      )
    )
  }, [])

  /**
   * Sorts documents chronologically within each section with precision awareness
   * Sort order: none → year → month → day (oldest to newest within each precision level)
   */
  const handleSortDocumentsChronologically = useCallback(() => {
    setSections(prev =>
      prev.map(section => {
        // Group documents by precision level
        const docsByPrecision: {
          none: typeof section.documents
          year: typeof section.documents
          month: typeof section.documents
          day: typeof section.documents
        } = {
          none: [],
          year: [],
          month: [],
          day: [],
        }

        section.documents.forEach(doc => {
          const precision = doc.datePrecision || 'none'
          docsByPrecision[precision].push(doc)
        })

        // Helper function to parse dates based on precision
        const parseDate = (dateStr: string, precision: string): Date => {
          const parts = dateStr.split('-').map(Number)

          if (precision === 'day') {
            // DD-MM-YYYY format
            const [day, month, year] = parts
            return new Date(year, month - 1, day)
          } else if (precision === 'month') {
            // MM-YYYY format
            const [month, year] = parts
            return new Date(year, month - 1, 1)
          } else if (precision === 'year') {
            // YYYY format
            const year = parseInt(dateStr)
            return new Date(year, 0, 1)
          }

          return new Date(0) // Fallback
        }

        // Sort each precision group chronologically (oldest to newest)
        const sortByDate = (docs: typeof section.documents, precision: string) => {
          return docs.sort((a, b) => {
            if (!a.documentDate || !b.documentDate) return 0

            const dateA = parseDate(a.documentDate, precision)
            const dateB = parseDate(b.documentDate, precision)

            return dateA.getTime() - dateB.getTime()
          })
        }

        // Sort each group
        const sortedNone = docsByPrecision.none
        const sortedYear = sortByDate(docsByPrecision.year, 'year')
        const sortedMonth = sortByDate(docsByPrecision.month, 'month')
        const sortedDay = sortByDate(docsByPrecision.day, 'day')

        // Combine in precision order: none → year → month → day
        const sortedDocuments = [
          ...sortedNone,
          ...sortedYear,
          ...sortedMonth,
          ...sortedDay,
        ]

        // Update order property
        sortedDocuments.forEach((doc, index) => {
          doc.order = index
        })

        return {
          ...section,
          documents: sortedDocuments,
        }
      })
    )
  }, [])

  const handleUpdateDocumentTitle = useCallback((sectionId: string, docId: string, title: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              documents: section.documents.map(doc =>
                doc.id === docId ? { ...doc, customTitle: title } : doc
              ),
            }
          : section
      )
    )
  }, [])

  const handleUpdateSelectedPages = useCallback((sectionId: string, docId: string, selectedPages: number[]) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              documents: section.documents.map(doc =>
                doc.id === docId ? { ...doc, selectedPages } : doc
              ),
            }
          : section
      )
    )
  }, [])

  const handleUpdateDocumentFile = useCallback(async (sectionId: string, docId: string, modifiedFile: File, newPageCount?: number) => {
    // Get page count of modified file if not provided
    let pageCount = newPageCount
    if (!pageCount) {
      try {
        pageCount = await getPdfPageCount(modifiedFile)
      } catch (error) {
        console.error('Failed to get page count:', error)
        return
      }
    }

    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              documents: section.documents.map(doc =>
                doc.id === docId
                  ? { ...doc, modifiedFile, pageCount } // Keep original file, set modifiedFile and update pageCount
                  : doc
              ),
            }
          : section
      )
    )
  }, [])

  const handleSelectTemplate = (newSections: Section[], bundleType: BundleType) => {
    setSections(newSections)
    setMetadata(prev => ({ ...prev, bundleType }))
    showToast('info', `Template applied: ${newSections.length} sections created`)
  }

  // Check for auto-save on mount
  useEffect(() => {
    if (hasAutoSave()) {
      setShowRecoveryModal(true)
    }
  }, [])

  // Auto-save interval (every 30 seconds)
  useEffect(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current)
    }

    autoSaveIntervalRef.current = window.setInterval(() => {
      autoSaveToLocalStorage(metadata, sections, pageNumberSettings, batesNumberSettings)
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [metadata, sections, pageNumberSettings, batesNumberSettings])

  // Auto-save on significant state changes (debounced)
  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Debounce: wait 2 seconds after last change before auto-saving
    const timeoutId = setTimeout(() => {
      autoSaveToLocalStorage(metadata, sections, pageNumberSettings, batesNumberSettings)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [metadata, sections, pageNumberSettings, batesNumberSettings])

  const handleRestoreAutoSave = () => {
    const autoSaveData = getAutoSaveData()
    if (autoSaveData) {
      setMetadata(autoSaveData.metadata)
      setSections(autoSaveData.deserializedSections) // Use deserialized sections with File objects
      setPageNumberSettings(autoSaveData.pageNumberSettings)
      if (autoSaveData.batesNumberSettings) {
        setBatesNumberSettings(autoSaveData.batesNumberSettings)
      }
      setShowRecoveryModal(false)
      showToast('success', 'Previous work restored successfully')
      clearAutoSave() // Clear auto-save after successful restore
    }
  }

  const handleDismissAutoSave = () => {
    clearAutoSave()
    setShowRecoveryModal(false)
    console.log('Auto-save dismissed')
  }

  const handleSave = async (filename?: string) => {
    try {
      await saveBundle(metadata, sections, pageNumberSettings, batesNumberSettings, filename)
      // Clear auto-save after successful manual save
      clearAutoSave()
      showToast('success', 'Bundle saved successfully')
    } catch (error) {
      console.error('Save failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showToast('error', `Failed to save bundle: ${errorMessage}`)
    }
  }

  const handleLoad = async (file: File) => {
    try {
      const savedBundle = await loadBundle(file)
      setMetadata(savedBundle.metadata)
      setSections(deserializeSections(savedBundle.sections))
      setPageNumberSettings(savedBundle.pageNumberSettings)
      if (savedBundle.batesNumberSettings) {
        setBatesNumberSettings(savedBundle.batesNumberSettings)
      }
      showToast('success', `Loaded "${file.name}" successfully`)
    } catch (error) {
      console.error('Load failed:', error)
      showToast('error', 'Failed to load bundle. The file may be corrupted.')
    }
  }


  const totalDocs = useMemo(() =>
    sections.reduce((sum, section) => sum + section.documents.length, 0),
    [sections]
  )

  // Generate suggested filename from case info
  const suggestedFilename = useMemo(() => {
    const parts = []
    if (metadata.caseNumber) parts.push(metadata.caseNumber)
    if (metadata.bundleTitle) parts.push(metadata.bundleTitle.replace(/\s+/g, '_'))
    return parts.length > 0 ? parts.join('_') : 'my_bundle_save'
  }, [metadata.caseNumber, metadata.bundleTitle])

  const autoSaveData = getAutoSaveData()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 's',
        ctrlKey: true,
        metaKey: true,
        description: 'Save bundle progress',
        action: () => handleSave(),
      },
      {
        key: 'g',
        ctrlKey: true,
        metaKey: true,
        description: 'Generate bundle PDF',
        action: () => generateButtonRef.current?.click(),
      },
      {
        key: 'i',
        ctrlKey: true,
        metaKey: true,
        description: 'Generate index only',
        action: () => generateIndexButtonRef.current?.click(),
      },
      {
        key: '?',
        description: 'Show keyboard shortcuts',
        action: () => setShowKeyboardShortcuts(true),
        preventDefault: false,
      },
      {
        key: 'Escape',
        description: 'Close modals',
        action: () => {
          setShowKeyboardShortcuts(false)
          setPreviewDoc(null)
        },
        preventDefault: false,
      },
    ],
  })

  return (
    <div className="app">
      {showRecoveryModal && autoSaveData && (
        <AutoSaveRecovery
          autoSaveData={autoSaveData}
          onRestore={handleRestoreAutoSave}
          onDismiss={handleDismissAutoSave}
        />
      )}

      <KeyboardShortcutsHelp
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <header className="app-header" role="banner">
        <h1>Court Bundle Builder</h1>
        <p>Create professional, court-ready bundles in 5 simple steps</p>

        <div className="workflow-progress">
          <div className={`workflow-step ${metadata.bundleTitle || metadata.caseNumber ? 'completed' : 'active'}`}>
            <span className="step-number">1</span>
            <span>Case Info</span>
          </div>
          <div className={`workflow-step ${metadata.bundleTitle || metadata.caseNumber ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span>Page Numbers</span>
          </div>
          <div className={`workflow-step ${sections.length > 1 || sections[0].documents.length > 0 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span>Sections</span>
          </div>
          <div className={`workflow-step ${totalDocs > 0 ? 'completed' : sections.length > 1 || sections[0].documents.length > 0 ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span>Documents</span>
          </div>
          <div className={`workflow-step ${totalDocs > 0 ? 'active' : ''}`}>
            <span className="step-number">5</span>
            <span>Generate</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="app-main" role="main" aria-label="Court Bundle Builder Workflow">
        <section className="section" aria-labelledby="pricing-heading">
          <PricingDisplay />
        </section>

        <section className="section" aria-labelledby="bundle-info-heading">
          <div className="section-header-with-actions">
            <h2 id="bundle-info-heading">📋 Step 1: Bundle Information</h2>
            <SaveLoadButtons
              onSave={handleSave}
              onLoad={handleLoad}
              suggestedFilename={suggestedFilename}
            />
          </div>
          <div className="section-help">
            <p>
              <strong>Start here:</strong> Enter your case details below. This information will appear on the front page and index of your bundle.
              You can save your work at any time using the <strong>Save Progress</strong> button above.
            </p>
          </div>

          <BundleRequirementsInfo />

          <MetadataForm metadata={metadata} onChange={setMetadata} />
        </section>

        <section className="section" aria-labelledby="page-settings-heading">
          <h2 id="page-settings-heading">🔢 Step 2: Page Numbering</h2>
          <div className="section-help">
            <p>
              <strong>Auto-configured:</strong> Pages will be numbered automatically using section prefixes (A-1, A-2, B-1, etc.)
              with numbers at the bottom center of each page. This follows standard court bundle formatting.
            </p>
          </div>

          <div className="auto-settings-summary">
            <div className="auto-setting-item">
              <span className="setting-label">Position:</span>
              <span className="setting-value">Bottom Center</span>
            </div>
            <div className="auto-setting-item">
              <span className="setting-label">Format:</span>
              <span className="setting-value">Section Prefix + Number (A-1, B-1, etc.)</span>
            </div>
          </div>

          {/* Customize Settings - Collapsible */}
          <div className="advanced-options-wrapper">
            <button
              className="advanced-options-toggle"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              aria-expanded={showAdvancedOptions}
              aria-controls="advanced-options-content"
            >
              <span>{showAdvancedOptions ? '▼' : '▶'} Customize Settings</span>
              <span className="advanced-hint">Change defaults if needed</span>
            </button>

            {showAdvancedOptions && (
              <div id="advanced-options-content" className="advanced-options-content">
                <PageNumberSettingsComponent
                  settings={pageNumberSettings}
                  onChange={setPageNumberSettings}
                />

                <div style={{ marginTop: 'var(--spacing-xl)' }}>
                  <BatesNumberSettingsComponent
                    settings={batesNumberSettings}
                    onChange={setBatesNumberSettings}
                    pageNumberPosition={pageNumberSettings.position}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="section" aria-labelledby="sections-heading">
          <h2 id="sections-heading">📑 Step 3: Organize Your Sections</h2>
          <div className="section-help">
            <p>
              <strong>Create sections:</strong> Organize your documents into logical sections (e.g., "Witness Statements", "Evidence", "Correspondence").
              Each section can have its own page numbering prefix (A, B, C, etc.) and optional divider pages.
              The default "Main Documents" section is provided to get you started.
            </p>
          </div>

          <TemplateSelector
            onSelectTemplate={handleSelectTemplate}
            currentSectionCount={sections.length}
            currentDocCount={totalDocs}
          />

          <SectionManager
            sections={sections}
            onAddSection={handleAddSection}
            onRemoveSection={handleRemoveSection}
            onRenameSection={handleRenameSection}
            onToggleDivider={handleToggleDivider}
            onUpdatePagination={handleUpdatePagination}
          />
        </section>

        <section className="section" aria-labelledby="documents-heading">
          <h2 id="documents-heading">📄 Step 4: Upload and Manage Documents</h2>
          <div className="section-help">
            <p>
              <strong>Add your PDF documents:</strong> Click the upload button below to add PDFs to your bundle. After uploading, you can:
            </p>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8', color: 'var(--color-primary)' }}>
              <li><strong>Reorder documents</strong> using the up/down arrow buttons or drag-and-drop</li>
              <li><strong>Move documents</strong> between sections using the dropdown menu</li>
              <li><strong>Edit PDFs</strong> to add annotations or redact information</li>
              <li><strong>Remove pages</strong> you don't need from any document</li>
              <li><strong>Add custom titles</strong> and dates for the index</li>
            </ul>

            <div style={{
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              backgroundColor: '#e3f2fd',
              border: '2px solid #2196F3',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
            }}>
              <p style={{ margin: 0, marginBottom: 'var(--spacing-sm)', fontWeight: 'var(--font-weight-semibold)', color: '#1976D2' }}>
                📅 Smart Date Detection & Chronological Sorting
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                <li>
                  <strong>Auto-detection:</strong> Dates are automatically extracted from filenames when you upload documents.
                  <br />
                  <span style={{ fontSize: '0.85em', color: '#555', fontStyle: 'italic' }}>
                    Supported formats: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, YYYYMMDD, DD.MM.YYYY
                  </span>
                  <br />
                  <span style={{ fontSize: '0.85em', color: '#555', fontStyle: 'italic' }}>
                    Example: "Witness_Statement_15-01-2024.pdf" → Date: 15/01/2024 (auto-detected ✓)
                  </span>
                </li>
                <li>
                  <strong>Manual entry:</strong> Click any document's date field to add or change dates manually using the calendar picker
                </li>
                <li>
                  <strong>Visual indicators:</strong> Green badge = auto-detected date | Yellow badge = no date set
                </li>
                <li>
                  <strong>Sort chronologically:</strong> Click the "📅 Sort by Date" button to arrange all documents by date.
                  Documents without dates appear first, then dated documents from oldest to newest.
                </li>
              </ul>
            </div>
          </div>

          <DocumentUploader onDocumentsAdded={handleAddDocuments} />

          {/* Sort by Date Button */}
          {totalDocs > 0 && (
            <div style={{
              marginTop: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              backgroundColor: '#f5f5f5',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #ddd',
            }}>
              <button
                className="btn btn-secondary"
                onClick={handleSortDocumentsChronologically}
                title="Sort all documents chronologically within each section"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                📅 Sort All Documents by Date
              </button>
              <div style={{
                marginTop: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
                color: '#666',
                lineHeight: '1.6',
              }}>
                <p style={{ margin: 0, marginBottom: 'var(--spacing-xs)' }}>
                  <strong>How it works:</strong>
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  <li>Sorts documents <strong>within each section</strong> independently</li>
                  <li>Documents <strong>without dates</strong> appear at the <strong>top</strong> of each section</li>
                  <li>Documents <strong>with dates</strong> are arranged <strong>oldest to newest</strong></li>
                  <li>You can still manually reorder documents after sorting if needed</li>
                </ul>
              </div>
            </div>
          )}

          <SectionDocumentList
            sections={sections}
            bundleType={metadata.bundleType}
            onRemoveDocument={handleRemoveDocument}
            onReorderDocument={handleReorderDocument}
            onMoveToSection={handleMoveToSection}
            onPreview={setPreviewDoc}
            onUpdateDocumentDate={handleUpdateDocumentDate}
            onUpdateDocumentTitle={handleUpdateDocumentTitle}
            onUpdateSelectedPages={handleUpdateSelectedPages}
            onUpdateDocumentFile={handleUpdateDocumentFile}
          />
        </section>

        {totalDocs > 0 && (
          <section className="section" aria-labelledby="generate-heading">
            <h2 id="generate-heading">✅ Step 5: Generate Your Bundle</h2>
            <div className="section-help">
              <p>
                <strong>You're ready to generate!</strong> Your bundle will include:
              </p>
              <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8', color: 'var(--color-primary)' }}>
                <li>A <strong>professional front page</strong> with your case information</li>
                <li>A <strong>clickable index</strong> linking to each document</li>
                <li><strong>Section dividers</strong> (if you've enabled them)</li>
                <li><strong>Sequential page numbering</strong> throughout the bundle</li>
                <li><strong>Bookmarks</strong> for easy navigation in PDF readers</li>
              </ul>
              <p style={{ marginTop: 'var(--spacing-md)' }}>
                Documents under 20 pages total are <strong>free</strong>. Larger bundles require a small fee.
              </p>
            </div>

            <BundleValidation metadata={metadata} sections={sections} />

            <BundleGenerator
              metadata={metadata}
              sections={sections}
              pageNumberSettings={pageNumberSettings}
              generateButtonRef={generateButtonRef}
              generateIndexButtonRef={generateIndexButtonRef}
            />
          </section>
        )}
      </main>

      <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />

      {/* Floating Keyboard Shortcuts Help Button */}
      <button
        className="keyboard-shortcuts-fab"
        onClick={() => setShowKeyboardShortcuts(true)}
        aria-label="Show keyboard shortcuts"
        title="Keyboard Shortcuts (Press ?)"
      >
        ?
      </button>
    </div>
  )
}

export default App
