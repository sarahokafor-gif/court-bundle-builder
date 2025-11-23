import { Section, BundleMetadata, PageNumberSettings, BatesNumberSettings, SavedBundle, SerializedSection, SerializedDocument } from '../types'

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
 */
function base64ToFile(base64: string, filename: string): File {
  try {
    if (!base64) {
      throw new Error('Empty base64 data')
    }

    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    const file = new File([blob], filename, { type: 'application/pdf' })

    // Validate the file was created properly
    if (!file || file.size === 0) {
      throw new Error('Created file is empty or invalid')
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

      // Restore modifiedFile if it was saved
      let modifiedFile: File | undefined = undefined
      if (doc.modifiedFileData) {
        modifiedFile = base64ToFile(doc.modifiedFileData, doc.name)
      }

      return {
        id: doc.id,
        file: base64ToFile(doc.fileData, doc.name),
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
