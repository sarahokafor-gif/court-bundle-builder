export type DatePrecision = 'none' | 'year' | 'month' | 'day';

export interface Document {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  order: number;
  documentDate?: string; // Optional date in DD-MM-YYYY format
  datePrecision?: DatePrecision; // Precision level of the date (none, year, month, day)
  customTitle?: string; // Optional custom title for display in index
  selectedPages?: number[]; // Array of selected page indices (0-based). If undefined, all pages are selected
  modifiedFile?: File; // Modified/redacted version of the file (if edited)
  thumbnail?: string; // Data URL of first page thumbnail for preview
}

export interface Section {
  id: string;
  name: string;
  documents: Document[];
  addDivider: boolean;
  order: number;
  pagePrefix: string; // e.g., "A", "B", "1", etc.
  startPage: number; // Starting page number for this section
}

export type PageNumberPosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

export interface PageNumberSettings {
  position: PageNumberPosition;
  fontSize: number; // 8-16
  bold: boolean;
}

export interface BatesNumberSettings {
  enabled: boolean;
  prefix: string; // e.g., "CASE", "SMITH", "DOC"
  startNumber: number; // Starting number, default 1
  digits: number; // Number of digits with zero padding, e.g., 3 for "001", 4 for "0001"
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  fontSize: number; // 8-14
}

export type BundleType = 'family' | 'civil' | 'employment' | 'inquest' | 'tribunal' | 'court-of-protection' | 'general';

export type PartyRole =
  | 'applicant'
  | 'respondent'
  | 'claimant'
  | 'defendant'
  | 'appellant'
  | 'interested-person'
  | 'other';

export interface Party {
  id: string;
  name: string;
  role: PartyRole;
  customRole?: string; // Used when role is 'other'
  order: number;
}

export interface BundleMetadata {
  bundleTitle: string;
  caseNumber: string;
  court: string;
  parties: Party[]; // New: dynamic party list
  preparerName: string;
  preparerRole: string;
  date: string;
  bundleType?: BundleType;
  // Legacy fields for backward compatibility
  caseName?: string;
  applicantName?: string;
  respondentName?: string;
}

export interface Bundle {
  metadata: BundleMetadata;
  sections: Section[];
  pageNumberSettings: PageNumberSettings;
  batesNumberSettings: BatesNumberSettings;
}

export interface SavedBundle {
  metadata: BundleMetadata;
  sections: SerializedSection[];
  pageNumberSettings: PageNumberSettings;
  batesNumberSettings: BatesNumberSettings;
  savedAt: string;
}

export interface SerializedSection {
  id: string;
  name: string;
  documents: SerializedDocument[];
  addDivider: boolean;
  order: number;
  pagePrefix: string;
  startPage: number;
}

export interface SerializedDocument {
  id: string;
  name: string;
  pageCount: number;
  order: number;
  fileData: string; // base64 encoded file data
  documentDate?: string; // Optional date in DD-MM-YYYY, MM-YYYY, or YYYY format
  datePrecision?: DatePrecision; // Optional precision level (for backward compatibility)
  customTitle?: string; // Optional custom title for display in index
  selectedPages?: number[]; // Optional array of selected page indices (0-indexed)
  modifiedFileData?: string; // Optional base64 encoded modified file (edited/redacted version)
}
