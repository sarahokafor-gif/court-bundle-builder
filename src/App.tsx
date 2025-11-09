import { useState } from 'react'
import { Section, Document, BundleMetadata, PageNumberSettings, BundleType } from './types'
import MetadataForm from './components/MetadataForm'
import DocumentUploader from './components/DocumentUploader'
import SectionManager from './components/SectionManager'
import SectionDocumentList from './components/SectionDocumentList'
import BundleGenerator from './components/BundleGenerator'
import DocumentPreview from './components/DocumentPreview'
import PageNumberSettingsComponent from './components/PageNumberSettings'
import SaveLoadButtons from './components/SaveLoadButtons'
import BundleTypeSelector from './components/BundleTypeSelector'
import PricingDisplay from './components/PricingDisplay'
import { saveBundle, loadBundle, deserializeSections } from './utils/saveLoad'
import './App.css'

function App() {
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

  const handleAddDocuments = (newDocs: Document[]) => {
    // Add to the first section
    setSections(prev => {
      const updated = [...prev]
      updated[0] = {
        ...updated[0],
        documents: [...updated[0].documents, ...newDocs],
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

  const handleSave = async () => {
    await saveBundle(metadata, sections, pageNumberSettings)
  }

  const handleLoad = async (file: File) => {
    const savedBundle = await loadBundle(file)
    setMetadata(savedBundle.metadata)
    setSections(deserializeSections(savedBundle.sections))
    setPageNumberSettings(savedBundle.pageNumberSettings)
  }

  const handleBundleTypeChange = (bundleType: BundleType) => {
    setMetadata(prev => ({ ...prev, bundleType }))
  }

  const totalDocs = sections.reduce((sum, section) => sum + section.documents.length, 0)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Court Bundle Builder</h1>
        <p>Create professional court bundles with sections, dividers, and automatic indexing</p>
      </header>

      <main className="app-main">
        <section className="section">
          <PricingDisplay />
        </section>

        <section className="section">
          <div className="section-header-with-actions">
            <h2>Bundle Information</h2>
            <SaveLoadButtons onSave={handleSave} onLoad={handleLoad} />
          </div>
          <MetadataForm metadata={metadata} onChange={setMetadata} />
          <BundleTypeSelector
            selectedType={metadata.bundleType}
            onTypeChange={handleBundleTypeChange}
          />
        </section>

        <section className="section">
          <h2>Page Number Settings</h2>
          <PageNumberSettingsComponent
            settings={pageNumberSettings}
            onChange={setPageNumberSettings}
          />
        </section>

        <section className="section">
          <h2>Sections</h2>
          <SectionManager
            sections={sections}
            onAddSection={handleAddSection}
            onRemoveSection={handleRemoveSection}
            onRenameSection={handleRenameSection}
            onToggleDivider={handleToggleDivider}
            onUpdatePagination={handleUpdatePagination}
          />
        </section>

        <section className="section">
          <h2>Documents</h2>
          <DocumentUploader onDocumentsAdded={handleAddDocuments} />
          <SectionDocumentList
            sections={sections}
            onRemoveDocument={handleRemoveDocument}
            onReorderDocument={handleReorderDocument}
            onMoveToSection={handleMoveToSection}
            onPreview={setPreviewDoc}
            onUpdateDocumentDate={handleUpdateDocumentDate}
          />
        </section>

        {totalDocs > 0 && (
          <section className="section">
            <h2>Generate Bundle</h2>
            <BundleGenerator
              metadata={metadata}
              sections={sections}
              pageNumberSettings={pageNumberSettings}
            />
          </section>
        )}
      </main>

      <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  )
}

export default App
