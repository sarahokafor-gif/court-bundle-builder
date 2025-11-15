import { Section, BundleMetadata, PageNumberSettings, SavedBundle, SerializedSection, SerializedDocument } from '../types'

/**
 * Converts a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // Remove data:application/pdf;base64, prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Converts base64 string back to File
 */
function base64ToFile(base64: string, filename: string): File {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'application/pdf' })
  return new File([blob], filename, { type: 'application/pdf' })
}

/**
 * Serializes sections with documents (converts Files to base64)
 */
export async function serializeSections(sections: Section[]): Promise<SerializedSection[]> {
  const serialized: SerializedSection[] = []

  for (const section of sections) {
    const serializedDocs: SerializedDocument[] = []

    for (const doc of section.documents) {
      const fileData = await fileToBase64(doc.file)
      serializedDocs.push({
        id: doc.id,
        name: doc.name,
        pageCount: doc.pageCount,
        order: doc.order,
        fileData,
        documentDate: doc.documentDate,
        customTitle: doc.customTitle,
      })
    }

    serialized.push({
      id: section.id,
      name: section.name,
      documents: serializedDocs,
      addDivider: section.addDivider,
      order: section.order,
      pagePrefix: section.pagePrefix,
      startPage: section.startPage,
    })
  }

  return serialized
}

/**
 * Deserializes sections (converts base64 back to Files)
 */
export function deserializeSections(serializedSections: SerializedSection[]): Section[] {
  return serializedSections.map((section) => ({
    id: section.id,
    name: section.name,
    documents: section.documents.map((doc) => ({
      id: doc.id,
      file: base64ToFile(doc.fileData, doc.name),
      name: doc.name,
      pageCount: doc.pageCount,
      order: doc.order,
      documentDate: doc.documentDate,
      customTitle: doc.customTitle,
    })),
    addDivider: section.addDivider,
    order: section.order,
    pagePrefix: section.pagePrefix,
    startPage: section.startPage,
  }))
}

/**
 * Saves bundle to a JSON file for download
 */
export async function saveBundle(
  metadata: BundleMetadata,
  sections: Section[],
  pageNumberSettings: PageNumberSettings,
  customFilename?: string
): Promise<void> {
  const serializedSections = await serializeSections(sections)

  const savedBundle: SavedBundle = {
    metadata,
    sections: serializedSections,
    pageNumberSettings,
    savedAt: new Date().toISOString(),
  }

  const json = JSON.stringify(savedBundle, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Use custom filename if provided, otherwise auto-generate
  let filename = customFilename || `${metadata.caseNumber || 'bundle'}_${metadata.caseName.replace(/\s+/g, '_')}_save`

  // Remove .json extension if user added it (we'll add it ourselves)
  filename = filename.replace(/\.json$/i, '')

  // Add .json extension
  filename = `${filename}.json`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Loads bundle from a JSON file
 */
export async function loadBundle(file: File): Promise<SavedBundle> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const savedBundle: SavedBundle = JSON.parse(json)
        resolve(savedBundle)
      } catch (error) {
        reject(new Error('Invalid bundle file format'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
