export interface Document {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  order: number;
  documentDate?: string; // Optional date in DD-MM-YYYY format
  customTitle?: string; // Optional custom title for display in index
  selectedPages?: number[]; // Array of selected page indices (0-based). If undefined, all pages are selected
  modifiedFile?: File; // Modified/redacted version of the file (if edited)
  thumbnail?: string; // Data URL of first page thumbnail for preview
  needsReupload?: boolean; // True if document was loaded from save file and needs PDF re-upload
  originalFileName?: string; // Original filename for matching during re-upload
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

export type BundleType = 'family' | 'civil' | 'employment' | 'inquest' | 'tribunal' | 'court-of-protection' | 'general';

export type PartyDesignation =
  | 'Claimant' | 'First Claimant' | 'Second Claimant' | 'Third Claimant'
  | 'Defendant' | 'First Defendant' | 'Second Defendant' | 'Third Defendant'
  | 'Applicant' | 'First Applicant' | 'Second Applicant'
  | 'Respondent' | 'First Respondent' | 'Second Respondent' | 'Third Respondent'
  | 'Appellant' | 'First Appellant' | 'Second Appellant'
  | 'Interested Party' | 'Intervener';

export interface Party {
  name: string;
  designation: PartyDesignation | string; // Allow custom designations too
  litigationFriend?: string; // e.g., "by his litigation friend, JANE DOE"
}

export interface BundleMetadata {
  caseName: string; // Used as matter description for non-party cases
  caseNumber: string;
  court: string;
  date: string;
  bundleType?: BundleType;
  // Party information for court header
  isAdversarial?: boolean; // true = "-v-", false = "-and-"
  applicants?: Party[]; // Claimants, Applicants, Appellants
  respondents?: Party[]; // Defendants, Respondents
}

export interface Bundle {
  metadata: BundleMetadata;
  sections: Section[];
  pageNumberSettings: PageNumberSettings;
}

export interface SavedBundle {
  metadata: BundleMetadata;
  sections: SerializedSection[];
  pageNumberSettings: PageNumberSettings;
  savedAt: string;
  version?: string; // '2.0' = metadata only (no embedded PDFs), '1.x' or undefined = embedded PDFs
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
  fileData: string; // Empty string in v2.0+ (PDFs not embedded), base64 in v1.x
  fileName?: string; // Original filename for re-upload matching (v2.0+)
  documentDate?: string; // Optional date in DD-MM-YYYY format
  customTitle?: string; // Optional custom title for display in index
}
