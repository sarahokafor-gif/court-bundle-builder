import { Section, BundleMetadata, PageNumberSettings, SavedBundle, SerializedSection, SerializedDocument } from '../types'

/**
 * Converts a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Converts base64 string back to File
 */
function base64ToFile(base64: string, fileName: string): File {
  console.log(`[base64ToFile] Starting conversion for "${fileName}", base64 length: ${base64.length}`)

  const byteCharacters = atob(base64)
  console.log(`[base64ToFile] Decoded to ${byteCharacters.length} bytes`)

  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'application/pdf' })
  const file = new File([blob], fileName, { type: 'application/pdf' })

  console.log(`[base64ToFile] Created File: name="${file.name}", size=${file.size} bytes, type="${file.type}"`)

  // Verify first bytes match PDF header
  const firstBytes = byteCharacters.substring(0, 10)
  console.log(`[base64ToFile] First 10 bytes: "${firstBytes}"`)

  return file
}

/**
 * Serializes sections with embedded PDF files
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
        fileName: doc.file.name,
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
 * Creates an empty placeholder PDF file for documents that need re-upload
 */
function createPlaceholderFile(fileName: string): File {
  // Create a minimal valid PDF (empty page) as placeholder
  const emptyPdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, // %PDF-1.4\n
    0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // binary comment
    0x31, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, // 1 0 obj
    0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, // <</Type/Catalog/Pages 2 0 R>>
    0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // endobj
    0x32, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, // 2 0 obj
    0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x50, 0x61, 0x67, 0x65, 0x73, 0x2F, 0x4B, 0x69, 0x64, 0x73, 0x5B, 0x5D, 0x2F, 0x43, 0x6F, 0x75, 0x6E, 0x74, 0x20, 0x30, 0x3E, 0x3E, 0x0A, // <</Type/Pages/Kids[]/Count 0>>
    0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, // endobj
    0x78, 0x72, 0x65, 0x66, 0x0A, // xref
    0x30, 0x20, 0x33, 0x0A, // 0 3
    0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x20, 0x0A, // 0000000000 65535 f
    0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x35, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x20, 0x0A, // 0000000015 00000 n
    0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x36, 0x36, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x20, 0x0A, // 0000000066 00000 n
    0x74, 0x72, 0x61, 0x69, 0x6C, 0x65, 0x72, 0x0A, // trailer
    0x3C, 0x3C, 0x2F, 0x53, 0x69, 0x7A, 0x65, 0x20, 0x33, 0x2F, 0x52, 0x6F, 0x6F, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, // <</Size 3/Root 1 0 R>>
    0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0A, // startxref
    0x31, 0x32, 0x33, 0x0A, // 123
    0x25, 0x25, 0x45, 0x4F, 0x46 // %%EOF
  ])
  const blob = new Blob([emptyPdfBytes], { type: 'application/pdf' })
  return new File([blob], fileName, { type: 'application/pdf' })
}

/**
 * Validates if base64 data represents a valid PDF (basic check)
 */
function isValidPdfBase64(base64: string): boolean {
  if (!base64 || base64.length < 100) return false // Too small to be a real PDF

  try {
    // Decode first few bytes and check for PDF header
    const firstBytes = atob(base64.substring(0, 20))
    return firstBytes.startsWith('%PDF')
  } catch {
    return false
  }
}

/**
 * Deserializes sections with embedded PDF files
 * Handles both v1.0 (with embedded PDFs) and v2.0 (metadata only) formats
 */
export function deserializeSections(serializedSections: SerializedSection[]): Section[] {
  return serializedSections.map((section) => ({
    id: section.id,
    name: section.name,
    documents: section.documents.map((doc) => {
      // Check if PDF data is embedded (v1.0) and valid, or missing (v2.0)
      const hasValidEmbeddedPdf = doc.fileData && doc.fileData.length > 0 && isValidPdfBase64(doc.fileData)
      const fileName = doc.fileName || doc.name

      console.log(`[deserialize] Document "${doc.name}": fileData length=${doc.fileData?.length || 0}, valid=${hasValidEmbeddedPdf}`)

      return {
        id: doc.id,
        file: hasValidEmbeddedPdf
          ? base64ToFile(doc.fileData, fileName)
          : createPlaceholderFile(fileName),
        name: doc.name,
        pageCount: doc.pageCount,
        order: doc.order,
        documentDate: doc.documentDate,
        customTitle: doc.customTitle,
        needsReupload: !hasValidEmbeddedPdf, // Flag documents that need PDF re-upload
        originalFileName: fileName, // Store original filename for matching during re-upload
      }
    }),
    addDivider: section.addDivider,
    order: section.order,
    pagePrefix: section.pagePrefix,
    startPage: section.startPage,
  }))
}

/**
 * Saves bundle to a JSON file for download (with embedded PDFs)
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
    version: '1.0', // Embeds PDFs in save file
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

/**
 * Sorts documents within a section by date
 * Order: Undated first, then oldest to newest
 */
export function sortDocumentsByDate(documents: Section['documents']): Section['documents'] {
  return [...documents].sort((a, b) => {
    // If neither has a date, maintain original order
    if (!a.documentDate && !b.documentDate) return 0

    // Undated documents come first
    if (!a.documentDate) return -1
    if (!b.documentDate) return 1

    // Parse dates in DD-MM-YYYY format
    const parseDate = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    const dateA = parseDate(a.documentDate)
    const dateB = parseDate(b.documentDate)

    // Sort oldest first (ascending order)
    return dateA.getTime() - dateB.getTime()
  })
}
