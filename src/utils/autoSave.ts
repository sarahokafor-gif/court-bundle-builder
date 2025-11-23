import { Section, BundleMetadata, PageNumberSettings, BatesNumberSettings, SerializedSection } from '../types'
import { serializeSections, base64ToFile, inferDatePrecision } from './saveLoad'

const AUTO_SAVE_KEY = 'court-bundle-autosave'
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export interface AutoSaveData {
  metadata: BundleMetadata
  sections: SerializedSection[] // Changed from Section[] to SerializedSection[]
  pageNumberSettings: PageNumberSettings
  batesNumberSettings: BatesNumberSettings
  timestamp: number
  version: string
}

/**
 * Save current state to localStorage as auto-save
 * Now properly serializes PDF files to base64
 */
export async function autoSaveToLocalStorage(
  metadata: BundleMetadata,
  sections: Section[],
  pageNumberSettings: PageNumberSettings,
  batesNumberSettings: BatesNumberSettings
): Promise<void> {
  try {
    // Serialize sections (convert Files to base64)
    const serializedSections = await serializeSections(sections)

    const autoSaveData: AutoSaveData = {
      metadata,
      sections: serializedSections,
      pageNumberSettings,
      batesNumberSettings,
      timestamp: Date.now(),
      version: '2.0', // Updated version to indicate new serialization format
    }

    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveData))
    console.log('Auto-saved at', new Date().toLocaleTimeString())
  } catch (error) {
    console.error('Failed to auto-save:', error)
  }
}

/**
 * Retrieve auto-save data from localStorage WITHOUT deserializing (faster check)
 */
export function getAutoSaveData(): AutoSaveData | null {
  try {
    const data = localStorage.getItem(AUTO_SAVE_KEY)
    if (!data) return null

    const parsed = JSON.parse(data) as AutoSaveData

    // Check version compatibility - clear old versions
    if (!parsed.version || parsed.version !== '2.0') {
      console.warn('Incompatible auto-save version found. Clearing old auto-save data.')
      clearAutoSave()
      return null
    }

    // Validate the data has required fields
    if (!parsed.metadata || !parsed.sections || !parsed.timestamp) {
      console.warn('Invalid auto-save data structure. Clearing.')
      clearAutoSave()
      return null
    }

    return parsed
  } catch (error) {
    console.error('Failed to retrieve auto-save:', error)
    return null
  }
}

/**
 * Restore auto-save data progressively to prevent memory crashes
 */
export async function restoreAutoSaveProgressively(
  onProgress: (current: number, total: number, message: string) => void
): Promise<(AutoSaveData & { deserializedSections: Section[] }) | null> {
  try {
    const parsed = getAutoSaveData()
    if (!parsed) return null

    onProgress(0, 100, 'Reading auto-save data...')

    // Count total documents
    const totalDocs = parsed.sections.reduce((sum, section) => sum + section.documents.length, 0)

    if (totalDocs === 0) {
      return {
        ...parsed,
        deserializedSections: parsed.sections.map(section => ({
          ...section,
          documents: []
        }))
      }
    }

    onProgress(5, 100, `Restoring ${totalDocs} documents...`)

    // Use the same progressive deserialization as loadBundleProgressively
    // This code is duplicated to avoid circular dependencies
    const deserializedSections: Section[] = []
    let processedDocs = 0

    for (const serializedSection of parsed.sections) {
      const deserializedDocs: any[] = []

      for (const serializedDoc of serializedSection.documents) {
        try {
          // Restore files from base64
          let precision = serializedDoc.datePrecision
          if (!precision && serializedDoc.documentDate) {
            precision = inferDatePrecision(serializedDoc.documentDate)
          } else if (!precision) {
            precision = 'none'
          }

          const restoredFile = base64ToFile(serializedDoc.fileData, serializedDoc.name)

          let restoredModifiedFile: File | undefined = undefined
          if (serializedDoc.modifiedFileData) {
            restoredModifiedFile = base64ToFile(serializedDoc.modifiedFileData, serializedDoc.name)
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

          if (processedDocs % 5 === 0) {
            onProgress(progressPercent, 100, `Restoring... (${processedDocs}/${totalDocs} documents)`)
          } else {
            onProgress(progressPercent, 100, `Restoring document ${processedDocs}/${totalDocs}`)
          }

          // Yield to browser
          const delay = processedDocs % 5 === 0 ? 200 : 50
          await new Promise(resolve => setTimeout(resolve, delay))

        } catch (error) {
          console.error(`Failed to restore document "${serializedDoc.name}":`, error)
          throw new Error(`Failed to restore document "${serializedDoc.name}"`)
        }
      }

      deserializedSections.push({
        id: serializedSection.id,
        name: serializedSection.name,
        documents: deserializedDocs,
        addDivider: serializedSection.addDivider,
        order: serializedSection.order,
        pagePrefix: serializedSection.pagePrefix,
        startPage: serializedSection.startPage,
      })
    }

    onProgress(100, 100, 'Restoration complete!')

    // Backward compatibility: Add default values for new fields if they don't exist
    const metadata = parsed.metadata

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

    // Return both serialized and deserialized data
    return {
      ...parsed,
      deserializedSections,
    }
  } catch (error) {
    console.error('Failed to retrieve auto-save:', error)
    return null
  }
}

/**
 * Check if auto-save data exists and is not empty
 */
export function hasAutoSave(): boolean {
  const data = getAutoSaveData()
  if (!data) return false

  // Check if there's meaningful data (at least some metadata or documents)
  const hasMetadata = !!(data.metadata.bundleTitle || data.metadata.caseName || data.metadata.caseNumber || data.metadata.court)
  const hasDocuments = data.sections.some(section => section.documents.length > 0)

  return hasMetadata || hasDocuments
}

/**
 * Clear auto-save data from localStorage
 */
export function clearAutoSave(): void {
  try {
    localStorage.removeItem(AUTO_SAVE_KEY)
    console.log('Auto-save cleared')
  } catch (error) {
    console.error('Failed to clear auto-save:', error)
  }
}

/**
 * Format timestamp for display
 */
export function formatAutoSaveTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()

  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleString()
}

export { AUTO_SAVE_INTERVAL }
