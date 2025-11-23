import { Section, Document, BundleMetadata, PageNumberSettings, BatesNumberSettings, SavedBundle, SerializedSection, SerializedDocument } from '../types'
import JSZip from 'jszip'

/**
 * Converts a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate that we have a proper File object
    if (!file || !(file instanceof File)) {
      reject(new Error(`Invalid file object: ${file}`))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (!result) {
        reject(new Error('FileReader returned empty result'))
        return
      }
      resolve(result.split(',')[1]) // Remove data:application/pdf;base64, prefix
    }
    reader.onerror = (error) => {
      console.error('FileReader error:', error)
      reject(new Error(`Failed to read file: ${file.name}`))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Converts base64 string back to File
 * Creates a proper File object that works with URL.createObjectURL
 */
function base64ToFile(base64: string, filename: string): File {
  try {
    if (!base64) {
      throw new Error('Empty base64 data')
    }

    // Decode base64 to binary
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)

    // Create File directly from Uint8Array (more reliable than Blob wrapper)
    const file = new File([byteArray], filename, {
      type: 'application/pdf',
      lastModified: Date.now()
    })

    // Validate the file was created properly
    if (!file || file.size === 0) {
      throw new Error('Created file is empty or invalid')
    }

    // Ensure it's a proper Blob (File extends Blob)
    if (!(file instanceof Blob)) {
      throw new Error('Created object is not a valid Blob/File')
    }

    return file
  } catch (error) {
    console.error(`Failed to create File from base64 for "${filename}":`, error)
    throw new Error(`Failed to restore file "${filename}": ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Serializes sections with documents (converts Files to base64)
 */
export async function serializeSections(sections: Section[]): Promise<SerializedSection[]> {
  const serialized: SerializedSection[] = []

  for (const section of sections) {
    const serializedDocs: SerializedDocument[] = []

    for (const doc of section.documents) {
      try {
        const fileData = await fileToBase64(doc.file)

        // Also save modifiedFile if it exists (edited/redacted version)
        let modifiedFileData: string | undefined = undefined
        if (doc.modifiedFile) {
          try {
            modifiedFileData = await fileToBase64(doc.modifiedFile)
          } catch (error) {
            console.error(`Failed to serialize modifiedFile for document "${doc.name}":`, error)
            // Continue without modifiedFile if it fails
          }
        }

        serializedDocs.push({
          id: doc.id,
          name: doc.name,
          pageCount: doc.pageCount,
          order: doc.order,
          fileData,
          documentDate: doc.documentDate,
          datePrecision: doc.datePrecision,
          customTitle: doc.customTitle,
          selectedPages: doc.selectedPages, // Save selected pages
          modifiedFileData, // Save edited/redacted version
        })
      } catch (error) {
        console.error(`Failed to serialize document "${doc.name}" in section "${section.name}":`, error)
        throw new Error(`Failed to save document "${doc.name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
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
 * Infers date precision from date format for backward compatibility
 */
function inferDatePrecision(dateStr: string): 'day' | 'month' | 'year' | 'none' {
  if (!dateStr) return 'none'

  const parts = dateStr.split('-')

  // Check format based on number of parts and their values
  if (parts.length === 3) {
    // Could be DD-MM-YYYY or YYYY-MM-DD
    const firstPart = parseInt(parts[0])
    if (firstPart > 31) {
      // Likely YYYY-MM-DD format
      return 'day'
    } else {
      // Likely DD-MM-YYYY format
      return 'day'
    }
  } else if (parts.length === 2) {
    // MM-YYYY or YYYY-MM format
    return 'month'
  } else if (parts.length === 1 && /^\d{4}$/.test(dateStr)) {
    // Just a year: YYYY
    return 'year'
  }

  return 'none'
}

/**
 * Deserializes sections (converts base64 back to Files)
 */
export function deserializeSections(serializedSections: SerializedSection[]): Section[] {
  return serializedSections.map((section) => ({
    id: section.id,
    name: section.name,
    documents: section.documents.map((doc) => {
      // Backward compatibility: infer precision if not present
      let precision = doc.datePrecision
      if (!precision && doc.documentDate) {
        precision = inferDatePrecision(doc.documentDate)
      } else if (!precision) {
        precision = 'none'
      }

      // Restore main file from base64
      const file = base64ToFile(doc.fileData, doc.name)

      // Validate the file was created properly (File extends Blob)
      const isValidFile = file && file instanceof Blob
      if (!isValidFile) {
        console.error(`Invalid File object created for "${doc.name}"`, {
          file,
          hasFile: !!file,
          type: typeof file,
        })
        throw new Error(`Failed to create valid File object for "${doc.name}"`)
      }

      // Restore modifiedFile if it was saved
      let modifiedFile: File | undefined = undefined
      if (doc.modifiedFileData) {
        modifiedFile = base64ToFile(doc.modifiedFileData, doc.name)

        // Validate modifiedFile (File extends Blob)
        if (modifiedFile && !(modifiedFile instanceof Blob)) {
          console.error(`Invalid modifiedFile object created for "${doc.name}"`)
          modifiedFile = undefined // Fall back to not having modifiedFile
        }
      }

      return {
        id: doc.id,
        file,
        name: doc.name,
        pageCount: doc.pageCount,
        order: doc.order,
        documentDate: doc.documentDate,
        datePrecision: precision,
        customTitle: doc.customTitle,
        selectedPages: doc.selectedPages, // Restore selected pages
        modifiedFile, // Restore edited/redacted version
      }
    }),
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
  batesNumberSettings: BatesNumberSettings,
  customFilename?: string
): Promise<void> {
  const serializedSections = await serializeSections(sections)

  const savedBundle: SavedBundle = {
    metadata,
    sections: serializedSections,
    pageNumberSettings,
    batesNumberSettings,
    savedAt: new Date().toISOString(),
  }

  const json = JSON.stringify(savedBundle, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Use custom filename if provided, otherwise auto-generate
  let filename = customFilename || `${metadata.caseNumber || 'bundle'}_${(metadata.bundleTitle || metadata.caseName || 'bundle').replace(/\s+/g, '_')}_save`

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

        // Backward compatibility: Add default values for new fields if they don't exist
        const metadata = savedBundle.metadata

        // If bundleTitle doesn't exist but caseName does, use caseName as bundleTitle
        if (!metadata.bundleTitle && metadata.caseName) {
          metadata.bundleTitle = metadata.caseName
        } else if (!metadata.bundleTitle) {
          metadata.bundleTitle = ''
        }

        // Migrate old party fields to new parties array
        if (!metadata.parties || metadata.parties.length === 0) {
          metadata.parties = []

          // Convert applicantName to party if it exists
          if (metadata.applicantName) {
            metadata.parties.push({
              id: `party-${Date.now()}-applicant`,
              name: metadata.applicantName,
              role: 'applicant',
              order: 0,
            })
          }

          // Convert respondentName to party if it exists
          if (metadata.respondentName) {
            metadata.parties.push({
              id: `party-${Date.now()}-respondent`,
              name: metadata.respondentName,
              role: 'respondent',
              order: 1,
            })
          }
        }

        // Add defaults for other new fields if they don't exist
        if (metadata.applicantName === undefined) {
          metadata.applicantName = ''
        }
        if (metadata.respondentName === undefined) {
          metadata.respondentName = ''
        }
        if (metadata.preparerName === undefined) {
          metadata.preparerName = ''
        }
        if (metadata.preparerRole === undefined) {
          metadata.preparerRole = ''
        }

        // Ensure caseNumber, court, and date have defaults
        if (!metadata.caseNumber) {
          metadata.caseNumber = ''
        }
        if (!metadata.court) {
          metadata.court = ''
        }
        if (!metadata.date) {
          metadata.date = new Date().toISOString().split('T')[0]
        }

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
 * Progressive loading for large bundles - loads documents in batches to prevent memory exhaustion
 * Reports progress via callback function
 */
export async function loadBundleProgressively(
  file: File,
  onProgress: (current: number, total: number, message: string) => void
): Promise<SavedBundle & { deserializedSections: Section[] }> {
  // First, load and parse the JSON (metadata + serialized sections)
  onProgress(0, 100, 'Reading file...')
  const savedBundle = await loadBundle(file)

  // Count total documents
  const totalDocs = savedBundle.sections.reduce((sum, section) => sum + section.documents.length, 0)

  if (totalDocs === 0) {
    return {
      ...savedBundle,
      deserializedSections: savedBundle.sections.map(section => ({
        ...section,
        documents: []
      }))
    }
  }

  onProgress(5, 100, `Preparing to load ${totalDocs} documents...`)

  // Deserialize sections progressively
  const deserializedSections: Section[] = []
  let processedDocs = 0

  // Process each section
  for (let sectionIndex = 0; sectionIndex < savedBundle.sections.length; sectionIndex++) {
    const serializedSection = savedBundle.sections[sectionIndex]
    const deserializedDocs: Document[] = []

    // Process documents in this section one at a time
    for (let docIndex = 0; docIndex < serializedSection.documents.length; docIndex++) {
      const serializedDoc = serializedSection.documents[docIndex]

      try {
        // Infer date precision for backward compatibility
        let precision = serializedDoc.datePrecision
        if (!precision && serializedDoc.documentDate) {
          precision = inferDatePrecision(serializedDoc.documentDate)
        } else if (!precision) {
          precision = 'none'
        }

        // Restore main file from base64
        const restoredFile = base64ToFile(serializedDoc.fileData, serializedDoc.name)

        // Validate the file
        const isValidFile = restoredFile && restoredFile instanceof Blob
        if (!isValidFile) {
          throw new Error(`Failed to create valid File object for "${serializedDoc.name}"`)
        }

        // Restore modifiedFile if it was saved
        let restoredModifiedFile: File | undefined = undefined
        if (serializedDoc.modifiedFileData) {
          restoredModifiedFile = base64ToFile(serializedDoc.modifiedFileData, serializedDoc.name)
          if (restoredModifiedFile && !(restoredModifiedFile instanceof Blob)) {
            console.error(`Invalid modifiedFile object created for "${serializedDoc.name}"`)
            restoredModifiedFile = undefined
          }
        }

        deserializedDocs.push({
          id: serializedDoc.id,
          file: restoredFile,
          name: serializedDoc.name,
          pageCount: serializedDoc.pageCount,
          order: serializedDoc.order,
          documentDate: serializedDoc.documentDate,
          datePrecision: precision,
          customTitle: serializedDoc.customTitle,
          selectedPages: serializedDoc.selectedPages,
          modifiedFile: restoredModifiedFile,
        })

        processedDocs++
        const progressPercent = Math.floor((processedDocs / totalDocs) * 90) + 5 // 5-95%

        // Show message about taking a break for memory optimization
        if (processedDocs % 10 === 0) {
          onProgress(progressPercent, 100, `Processing... (${processedDocs}/${totalDocs} loaded, optimizing memory...)`)
        } else {
          onProgress(progressPercent, 100, `Loading document ${processedDocs}/${totalDocs}: ${serializedDoc.name}`)
        }

        // Yield to browser with longer delay to allow garbage collection
        // Every 10 documents, take a longer break to let memory stabilize
        const delay = processedDocs % 10 === 0 ? 500 : 100
        await new Promise(resolve => setTimeout(resolve, delay))

      } catch (error) {
        console.error(`Failed to deserialize document "${serializedDoc.name}":`, error)
        throw new Error(`Failed to restore document "${serializedDoc.name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Add completed section
    deserializedSections.push({
      id: serializedSection.id,
      name: serializedSection.name,
      documents: deserializedDocs,
      addDivider: serializedSection.addDivider,
      order: serializedSection.order,
      pagePrefix: serializedSection.pagePrefix,
      startPage: serializedSection.startPage,
    })

    onProgress(Math.floor((processedDocs / totalDocs) * 90) + 5, 100, `Completed section: ${serializedSection.name}`)

    // Longer pause between sections to allow garbage collection
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  onProgress(100, 100, 'Loading complete!')

  return {
    ...savedBundle,
    deserializedSections,
  }
}

/**
 * Saves bundle as a ZIP file (new format - much more efficient)
 * Structure:
 *   metadata.json - case info and structure
 *   documents/doc_1_original.pdf
 *   documents/doc_1_modified.pdf (if exists)
 *   documents/doc_2_original.pdf
 *   etc.
 */
export async function saveBundleAsZip(
  metadata: BundleMetadata,
  sections: Section[],
  pageNumberSettings: PageNumberSettings,
  batesNumberSettings: BatesNumberSettings,
  customFilename?: string
): Promise<void> {
  const zip = new JSZip()

  // Create metadata object (without File objects - just IDs and references)
  const metadataObj = {
    metadata,
    sections: sections.map(section => ({
      id: section.id,
      name: section.name,
      addDivider: section.addDivider,
      order: section.order,
      pagePrefix: section.pagePrefix,
      startPage: section.startPage,
      documents: section.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        pageCount: doc.pageCount,
        order: doc.order,
        documentDate: doc.documentDate,
        datePrecision: doc.datePrecision,
        customTitle: doc.customTitle,
        selectedPages: doc.selectedPages,
        hasModifiedFile: !!doc.modifiedFile,
      })),
    })),
    pageNumberSettings,
    batesNumberSettings,
    savedAt: new Date().toISOString(),
    version: '3.0', // ZIP format version
  }

  // Add metadata.json
  zip.file('metadata.json', JSON.stringify(metadataObj, null, 2))

  // Add all document files
  const documentsFolder = zip.folder('documents')
  if (!documentsFolder) {
    throw new Error('Failed to create documents folder in ZIP')
  }

  for (const section of sections) {
    for (const doc of section.documents) {
      // Add original file
      const originalFileName = `${doc.id}_original.pdf`
      documentsFolder.file(originalFileName, doc.file)

      // Add modified file if it exists
      if (doc.modifiedFile) {
        const modifiedFileName = `${doc.id}_modified.pdf`
        documentsFolder.file(modifiedFileName, doc.modifiedFile)
      }
    }
  }

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }, // Good balance between size and speed
  })

  // Download the ZIP file
  const url = URL.createObjectURL(zipBlob)
  let filename = customFilename || `${metadata.caseNumber || 'bundle'}_${(metadata.bundleTitle || metadata.caseName || 'bundle').replace(/\s+/g, '_')}_save`

  // Remove .zip or .cbz extension if user added it
  filename = filename.replace(/\.(zip|cbz)$/i, '')

  // Add .cbz extension (Court Bundle Zip)
  filename = `${filename}.cbz`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Loads bundle from a ZIP file (new format)
 * Progressive extraction to prevent memory issues
 */
export async function loadBundleFromZip(
  file: File,
  onProgress: (current: number, total: number, message: string) => void
): Promise<SavedBundle & { deserializedSections: Section[] }> {
  onProgress(0, 100, 'Reading ZIP file...')

  // Load the ZIP
  const zip = await JSZip.loadAsync(file)

  // Extract metadata first
  onProgress(5, 100, 'Reading bundle information...')
  const metadataFile = zip.file('metadata.json')
  if (!metadataFile) {
    throw new Error('Invalid bundle file: missing metadata.json')
  }

  const metadataText = await metadataFile.async('text')
  const bundleData = JSON.parse(metadataText)

  // Validate version
  if (!bundleData.version || bundleData.version !== '3.0') {
    throw new Error('Invalid or unsupported ZIP bundle format')
  }

  // Count total documents
  const totalDocs = bundleData.sections.reduce((sum: number, section: any) => sum + section.documents.length, 0)

  if (totalDocs === 0) {
    return {
      ...bundleData,
      deserializedSections: bundleData.sections.map((section: any) => ({
        ...section,
        documents: []
      }))
    }
  }

  onProgress(10, 100, `Preparing to load ${totalDocs} documents...`)

  // Extract documents progressively
  const deserializedSections: Section[] = []
  let processedDocs = 0

  for (const sectionData of bundleData.sections) {
    const deserializedDocs: Document[] = []

    for (const docData of sectionData.documents) {
      try {
        // Extract original file
        const originalFileName = `documents/${docData.id}_original.pdf`
        const originalZipFile = zip.file(originalFileName)
        if (!originalZipFile) {
          throw new Error(`Missing original file: ${originalFileName}`)
        }

        const originalBlob = await originalZipFile.async('blob')
        const originalFile = new File([originalBlob], docData.name, { type: 'application/pdf' })

        // Extract modified file if it exists
        let modifiedFile: File | undefined = undefined
        if (docData.hasModifiedFile) {
          const modifiedFileName = `documents/${docData.id}_modified.pdf`
          const modifiedZipFile = zip.file(modifiedFileName)
          if (modifiedZipFile) {
            const modifiedBlob = await modifiedZipFile.async('blob')
            modifiedFile = new File([modifiedBlob], docData.name, { type: 'application/pdf' })
          }
        }

        deserializedDocs.push({
          id: docData.id,
          file: originalFile,
          name: docData.name,
          pageCount: docData.pageCount,
          order: docData.order,
          documentDate: docData.documentDate,
          datePrecision: docData.datePrecision || 'none',
          customTitle: docData.customTitle,
          selectedPages: docData.selectedPages,
          modifiedFile,
        })

        processedDocs++
        const progressPercent = Math.floor((processedDocs / totalDocs) * 80) + 10 // 10-90%

        if (processedDocs % 10 === 0) {
          onProgress(progressPercent, 100, `Processing... (${processedDocs}/${totalDocs} loaded)`)
        } else {
          onProgress(progressPercent, 100, `Loading document ${processedDocs}/${totalDocs}: ${docData.name}`)
        }

        // Yield to browser (shorter delays needed for ZIP since files are already compressed)
        const delay = processedDocs % 10 === 0 ? 100 : 10
        await new Promise(resolve => setTimeout(resolve, delay))

      } catch (error) {
        console.error(`Failed to extract document "${docData.name}":`, error)
        throw new Error(`Failed to load document "${docData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    deserializedSections.push({
      id: sectionData.id,
      name: sectionData.name,
      documents: deserializedDocs,
      addDivider: sectionData.addDivider,
      order: sectionData.order,
      pagePrefix: sectionData.pagePrefix,
      startPage: sectionData.startPage,
    })

    onProgress(Math.floor((processedDocs / totalDocs) * 80) + 10, 100, `Completed section: ${sectionData.name}`)
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  onProgress(100, 100, 'Loading complete!')

  return {
    metadata: bundleData.metadata,
    sections: bundleData.sections,
    pageNumberSettings: bundleData.pageNumberSettings,
    batesNumberSettings: bundleData.batesNumberSettings,
    savedAt: bundleData.savedAt,
    deserializedSections,
  }
}

/**
 * Detects if a file is ZIP or JSON format
 */
export async function detectFileFormat(file: File): Promise<'zip' | 'json'> {
  // Check file extension first
  const filename = file.name.toLowerCase()
  if (filename.endsWith('.cbz') || filename.endsWith('.zip')) {
    return 'zip'
  }
  if (filename.endsWith('.json')) {
    return 'json'
  }

  // Check file signature (magic bytes) by reading first few bytes
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const bytes = new Uint8Array(arrayBuffer)

        // ZIP files start with 'PK' (0x50 0x4B)
        if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4B) {
          resolve('zip')
        } else {
          // Assume JSON (starts with '{' or '[')
          resolve('json')
        }
      } catch (error) {
        reject(new Error('Failed to detect file format'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    // Read first 4 bytes to check signature
    reader.readAsArrayBuffer(file.slice(0, 4))
  })
}
