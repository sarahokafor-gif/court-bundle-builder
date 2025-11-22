import { Section, BundleMetadata, PageNumberSettings, BatesNumberSettings } from '../types'

const AUTO_SAVE_KEY = 'court-bundle-autosave'
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export interface AutoSaveData {
  metadata: BundleMetadata
  sections: Section[]
  pageNumberSettings: PageNumberSettings
  batesNumberSettings: BatesNumberSettings
  timestamp: number
  version: string
}

/**
 * Save current state to localStorage as auto-save
 */
export function autoSaveToLocalStorage(
  metadata: BundleMetadata,
  sections: Section[],
  pageNumberSettings: PageNumberSettings,
  batesNumberSettings: BatesNumberSettings
): void {
  try {
    const autoSaveData: AutoSaveData = {
      metadata,
      sections,
      pageNumberSettings,
      batesNumberSettings,
      timestamp: Date.now(),
      version: '1.0',
    }

    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveData))
    console.log('Auto-saved at', new Date().toLocaleTimeString())
  } catch (error) {
    console.error('Failed to auto-save:', error)
  }
}

/**
 * Retrieve auto-save data from localStorage
 */
export function getAutoSaveData(): AutoSaveData | null {
  try {
    const data = localStorage.getItem(AUTO_SAVE_KEY)
    if (!data) return null

    const parsed = JSON.parse(data) as AutoSaveData

    // Validate the data has required fields
    if (!parsed.metadata || !parsed.sections || !parsed.timestamp) {
      return null
    }

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

    return parsed
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
