import { useState, useEffect, useRef } from 'react'
import { Section, Document, BundleMetadata, PageNumberSettings } from './types'
import { useAuth } from './contexts/AuthContext'
import AuthModal from './components/Auth/AuthModal'
import UserMenu from './components/Auth/UserMenu'
import MetadataForm from './components/MetadataForm'
import DocumentUploader from './components/DocumentUploader'
import SectionManager from './components/SectionManager'
import SectionDocumentList from './components/SectionDocumentList'
import BundleGenerator from './components/BundleGenerator'
import DocumentPreview from './components/DocumentPreview'
import PageNumberSettingsComponent from './components/PageNumberSettings'
import SaveLoadButtons from './components/SaveLoadButtons'
import BundleRequirementsInfo from './components/BundleRequirementsInfo'
import AutoSaveRecovery from './components/AutoSaveRecovery'
import HelpFAQ from './components/HelpFAQ'
import { saveBundle, loadBundle, deserializeSections, sortDocumentsByDate } from './utils/saveLoad'
import {
  autoSaveToLocalStorage,
  getAutoSaveData,
  clearAutoSave,
  hasAutoSave,
  AUTO_SAVE_INTERVAL,
} from './utils/autoSave'
import './App.css'

function App() {
  const { currentUser, loading } = useAuth()
  const [metadata, setMetadata] = useState<BundleMetadata>({
    caseName: '',
    caseNumber: '',
    court: '',
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
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const autoSaveIntervalRef = useRef<number | null>(null)
  const isInitialMount = useRef(true)

  const handleAddDocuments = (newDocs: Document[]) => {
    setSections(prev => {
      const updated = prev.map(section => ({ ...section, documents: [...section.documents] }))
      const unmatchedDocs: Document[] = []

      // Debug: Log documents needing re-upload
      const docsNeedingReupload = updated.flatMap(section =>
        section.documents.filter(doc => doc.needsReupload).map(doc => ({
          name: doc.name,
          originalFileName: doc.originalFileName,
          needsReupload: doc.needsReupload
        }))
      )
      console.log('[handleAddDocuments] Documents needing re-upload:', docsNeedingReupload)
      console.log('[handleAddDocuments] Uploaded files:', newDocs.map(d => ({ name: d.name, fileName: d.file.name })))

      for (const newDoc of newDocs) {
        let matched = false

        // Try to match with existing documents that need re-upload
        for (const section of updated) {
          const matchIndex = section.documents.findIndex(doc => {
            if (!doc.needsReupload) return false

            // Try multiple matching strategies
            const uploadedFileName = newDoc.file.name
            const matches =
              doc.originalFileName === uploadedFileName ||
              doc.originalFileName === newDoc.name ||
              doc.name === uploadedFileName ||
              doc.name === newDoc.name

            console.log(`[handleAddDocuments] Comparing: uploaded="${uploadedFileName}" vs doc.originalFileName="${doc.originalFileName}", doc.name="${doc.name}" => ${matches}`)
            return matches
          })

          if (matchIndex !== -1) {
            // Found a match - update the existing document with the uploaded file
            const existingDoc = section.documents[matchIndex]
            console.log(`[handleAddDocuments] ✓ MATCHED! Replacing "${existingDoc.name}" with uploaded file`)
            section.documents[matchIndex] = {
              ...existingDoc,
              file: newDoc.file,
              pageCount: newDoc.pageCount,
              thumbnail: newDoc.thumbnail,
              needsReupload: false, // Clear the re-upload flag
              originalFileName: undefined, // No longer needed
            }
            matched = true
            break
          }
        }

        if (!matched) {
          // No match found - add as new document
          console.log(`[handleAddDocuments] ✗ No match found for "${newDoc.file.name}", adding as new document`)
          unmatchedDocs.push(newDoc)
        }
      }

      // Add any unmatched documents to the first section
      if (unmatchedDocs.length > 0) {
        updated[0].documents = [...updated[0].documents, ...unmatchedDocs]
      }

      return updated
    })
  }

  const handleAddSection = (name: string, pagePrefix: string) => {
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
  }

  const handleUpdatePagination = (id: string, pagePrefix: string, startPage: number) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, pagePrefix, startPage } : section
      )
    )
  }

  const handleRemoveSection = (id: string) => {
    setSections(prev => prev.filter(section => section.id !== id))
  }

  const handleRenameSection = (id: string, name: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, name } : section
      )
    )
  }

  const handleToggleDivider = (id: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, addDivider: !section.addDivider } : section
      )
    )
  }

  const handleRemoveDocument = (sectionId: string, docId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, documents: section.documents.filter(doc => doc.id !== docId) }
          : section
      )
    )
  }

  const handleReorderDocument = (sectionId: string, docIndex: number, newIndex: number) => {
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
  }

  const handleMoveToSection = (docId: string, fromSectionId: string, toSectionId: string) => {
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
  }

  const handleUpdateDocumentDate = (sectionId: string, docId: string, date: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              documents: section.documents.map(doc =>
                doc.id === docId ? { ...doc, documentDate: date } : doc
              ),
            }
          : section
      )
    )
  }

  const handleUpdateDocumentTitle = (sectionId: string, docId: string, title: string) => {
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
  }

  const handleUpdateSelectedPages = (sectionId: string, docId: string, selectedPages: number[]) => {
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
  }

  const handleUpdateDocumentFile = (sectionId: string, docId: string, modifiedFile: File) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              documents: section.documents.map(doc =>
                doc.id === docId ? { ...doc, file: modifiedFile, modifiedFile } : doc
              ),
            }
          : section
      )
    )
  }

  const handleSortSectionByDate = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              documents: sortDocumentsByDate(section.documents).map((doc, index) => ({
                ...doc,
                order: index,
              })),
            }
          : section
      )
    )
  }

  const handleReplaceDocumentPdf = (sectionId: string, docId: string, newFile: File, pageCount: number, thumbnail?: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
              ...section,
              documents: section.documents.map(doc =>
                doc.id === docId
                  ? {
                      ...doc,
                      file: newFile,
                      pageCount,
                      thumbnail,
                      needsReupload: false,
                      originalFileName: undefined,
                    }
                  : doc
              ),
            }
          : section
      )
    )
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
      autoSaveToLocalStorage(metadata, sections, pageNumberSettings)
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [metadata, sections, pageNumberSettings])

  // Auto-save on significant state changes (debounced)
  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Debounce: wait 2 seconds after last change before auto-saving
    const timeoutId = setTimeout(() => {
      autoSaveToLocalStorage(metadata, sections, pageNumberSettings)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [metadata, sections, pageNumberSettings])

  const handleRestoreAutoSave = () => {
    const autoSaveData = getAutoSaveData()
    if (autoSaveData) {
      setMetadata(autoSaveData.metadata)
      setSections(autoSaveData.sections)
      setPageNumberSettings(autoSaveData.pageNumberSettings)
      setShowRecoveryModal(false)
      console.log('Auto-save restored successfully')
    }
  }

  const handleDismissAutoSave = () => {
    clearAutoSave()
    setShowRecoveryModal(false)
    console.log('Auto-save dismissed')
  }

  const handleSave = async (filename?: string) => {
    await saveBundle(metadata, sections, pageNumberSettings, filename)
    // Clear auto-save after successful manual save
    clearAutoSave()
  }

  const handleLoad = async (file: File) => {
    const savedBundle = await loadBundle(file)
    setMetadata(savedBundle.metadata)
    setSections(deserializeSections(savedBundle.sections))
    setPageNumberSettings(savedBundle.pageNumberSettings)
  }


  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)

  // Generate suggested filename from case info
  const suggestedFilename = (() => {
    const parts = []
    if (metadata.caseNumber) parts.push(metadata.caseNumber)
    if (metadata.caseName) parts.push(metadata.caseName.replace(/\s+/g, '_'))
    return parts.length > 0 ? parts.join('_') : 'my_bundle_save'
  })()

  const autoSaveData = getAutoSaveData()

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Show login/register modal if not authenticated
  if (!currentUser) {
    return <AuthModal />
  }

  // User is authenticated - show the main app
  return (
    <div className="app">
      {showRecoveryModal && autoSaveData && (
        <AutoSaveRecovery
          autoSaveData={autoSaveData}
          onRestore={handleRestoreAutoSave}
          onDismiss={handleDismissAutoSave}
        />
      )}

      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <header className="app-header" role="banner">
        <div className="header-top">
          <h1>Court Bundle Builder</h1>
          <UserMenu />
        </div>
        <p>Create professional, court-ready bundles in 5 simple steps</p>

        <div className="workflow-progress">
          <div className={`workflow-step ${metadata.caseName || metadata.caseNumber ? 'completed' : 'active'}`}>
            <span className="step-number">1</span>
            <span>Case Info</span>
          </div>
          <div className={`workflow-step ${metadata.caseName || metadata.caseNumber ? 'active' : ''}`}>
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
        <HelpFAQ />

        <section className="section" aria-labelledby="bundle-info-heading">
          <div className="section-header-with-actions">
            <h2 id="bundle-info-heading">Step 1: Bundle Information</h2>
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
          <h2 id="page-settings-heading">Step 2: Page Number Settings</h2>
          <div className="section-help">
            <p>
              <strong>Configure page numbering:</strong> Choose where page numbers appear on each page (e.g., bottom center is standard for court bundles).
              You can also adjust the font size and make numbers bold if needed.
            </p>
          </div>
          <PageNumberSettingsComponent
            settings={pageNumberSettings}
            onChange={setPageNumberSettings}
          />
        </section>

        <section className="section" aria-labelledby="sections-heading">
          <h2 id="sections-heading">Step 3: Organize Your Sections</h2>
          <div className="section-help">
            <p>
              <strong>Create sections:</strong> Organize your documents into logical sections (e.g., "Witness Statements", "Evidence", "Correspondence").
              Each section can have its own page numbering prefix (A, B, C, etc.) and optional divider pages.
              The default "Main Documents" section is provided to get you started.
            </p>
          </div>
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
          <h2 id="documents-heading">Step 4: Upload and Manage Documents</h2>
          <div className="section-help">
            <p>
              <strong>Add your PDF documents:</strong> Click the upload button below to add PDFs to your bundle. After uploading, you can:
            </p>
            <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8', color: 'var(--color-primary)' }}>
              <li><strong>Reorder documents</strong> using the up/down arrow buttons</li>
              <li><strong>Move documents</strong> between sections using the dropdown menu</li>
              <li><strong>Edit PDFs</strong> to add annotations or redact information</li>
              <li><strong>Remove pages</strong> you don't need from any document</li>
              <li><strong>Add custom titles</strong> and dates for the index</li>
            </ul>
          </div>
          <DocumentUploader onDocumentsAdded={handleAddDocuments} />
          <SectionDocumentList
            sections={sections}
            onRemoveDocument={handleRemoveDocument}
            onReorderDocument={handleReorderDocument}
            onMoveToSection={handleMoveToSection}
            onPreview={setPreviewDoc}
            onUpdateDocumentDate={handleUpdateDocumentDate}
            onUpdateDocumentTitle={handleUpdateDocumentTitle}
            onUpdateSelectedPages={handleUpdateSelectedPages}
            onUpdateDocumentFile={handleUpdateDocumentFile}
            onSortSectionByDate={handleSortSectionByDate}
            onReplaceDocumentPdf={handleReplaceDocumentPdf}
          />
        </section>

        {totalDocs > 0 && (
          <section className="section" aria-labelledby="generate-heading">
            <h2 id="generate-heading">Step 5: Generate Your Bundle</h2>
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
            </div>
            <BundleGenerator
              metadata={metadata}
              sections={sections}
              pageNumberSettings={pageNumberSettings}
            />
          </section>
        )}
      </main>

      <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />

      <footer className="app-footer">
        <div className="footer-promo">
          <p>
            <strong>Also try:</strong>{' '}
            <a href="https://splitsmart.pages.dev" target="_blank" rel="noopener noreferrer">
              SplitSmart PDF Tool
            </a>{' '}
            - Free PDF splitting, merging, and redacting. Same trusted platform.
          </p>
        </div>
        <div className="footer-content">
          <p className="copyright">
            © {new Date().getFullYear()} Chambers of Sarah Okafor. All rights reserved.
          </p>
          <p className="footer-tagline">
            Free legal technology tools for professionals
          </p>
          <div className="footer-links">
            <a href="https://www.facebook.com/sarah.okafor" target="_blank" rel="noopener noreferrer">Facebook</a>
            <span className="footer-divider">|</span>
            <a href="mailto:contact@courtbundlebuilder.co.uk">Contact</a>
            <span className="footer-divider">|</span>
            <a href="https://splitsmart.pages.dev" target="_blank" rel="noopener noreferrer">SplitSmart</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
