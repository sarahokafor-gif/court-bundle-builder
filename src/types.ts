export interface Document {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  order: number;
  documentDate?: string; // Optional date in DD-MM-YYYY format
  customTitle?: string; // Optional custom title for display in index
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

export interface BundleMetadata {
  caseName: string;
  caseNumber: string;
  court: string;
  date: string;
  bundleType?: BundleType;
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
  documentDate?: string; // Optional date in DD-MM-YYYY format
  customTitle?: string; // Optional custom title for display in index
}
