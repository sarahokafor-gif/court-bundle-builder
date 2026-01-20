# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Court Bundle Builder - A React + TypeScript + Vite application for creating and managing court bundles (legal document collections). Users can organize documents into sections, preview and edit PDFs, add case metadata, and generate a single merged PDF with a hierarchical index, clickable bookmarks, and page numbering.

**Live Site:** https://courtbundlebuilder.co.uk (deployed via Cloudflare Pages)

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 5173)
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
npm run lint         # Lint TypeScript/TSX files
npm run type-check   # Run TypeScript compiler without emitting files
```

## Deployment

```bash
npm run build
npx wrangler pages deploy dist --project-name court-bundle-builder
```

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **PDF Processing**:
  - `pdf-lib` - Merging PDFs, creating index/divider pages, adding page numbers, burning redactions
  - `pdfjs-dist` - PDF rendering for preview and editing canvas
- **Authentication**: Firebase Authentication (email/password)
- **Drag & Drop**: @dnd-kit/core and @dnd-kit/sortable
- **Icons**: lucide-react
- **Styling**: Plain CSS with component-specific stylesheets

## Architecture

### Application Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── AuthModal.tsx         # Login/Register modal
│   │   └── UserMenu.tsx          # User dropdown menu
│   ├── AutoSaveRecovery.tsx      # Auto-save recovery prompt
│   ├── BundleGenerator.tsx       # Generate and download bundle
│   ├── BundleRequirementsInfo.tsx # Court bundle requirements guide
│   ├── BundleTypeSelector.tsx    # Select bundle type (CoP, Family, etc.)
│   ├── DocumentPreview.tsx       # PDF preview modal (iframe-based)
│   ├── DocumentUploader.tsx      # File upload interface
│   ├── HelpFAQ.tsx               # Help/FAQ accordion component
│   ├── MetadataForm.tsx          # Case information form
│   ├── PageManager.tsx           # Select/remove specific pages
│   ├── PageNumberSettings.tsx    # Configure page number position/style
│   ├── PDFEditor.tsx             # Redact/erase tool with canvas
│   ├── SaveLoadButtons.tsx       # Save/load bundle JSON files
│   ├── SectionDocumentList.tsx   # Document list with drag-drop
│   ├── SectionManager.tsx        # Create/rename/delete sections
│   └── TemplateSelector.tsx      # Pre-built section templates
├── contexts/
│   └── AuthContext.tsx           # Firebase auth context provider
├── data/
│   └── bundleRequirements.json   # Court bundle requirements data
├── utils/
│   ├── bundleGenerator.ts        # Core bundle generation logic
│   ├── pdfEditing.ts             # Burn redactions into PDF
│   ├── pdfThumbnail.ts           # Generate PDF thumbnails
│   ├── pdfUtils.ts               # PDF utilities (page count, loading)
│   ├── pricing.ts                # Pricing logic (if applicable)
│   └── saveLoad.ts               # Save/load bundle to JSON with base64 PDFs
├── types.ts                      # TypeScript type definitions
├── firebase.ts                   # Firebase configuration
├── App.tsx                       # Main application component
├── App.css                       # Main application styles
└── main.tsx                      # Application entry point
```

### Key Components

**App.tsx**: Main container managing state for metadata, sections, documents, and modals. Coordinates all child components.

**SectionDocumentList.tsx**: Displays documents in a single-row layout with:
- Drag handle (GripVertical icon) for reordering via @dnd-kit
- Checkbox for batch selection
- Editable document title
- Date picker for document dates
- Section dropdown for moving between sections
- Action buttons: View, Delete, Pages, Redact

**PDFEditor.tsx**: Full-screen modal for PDF redaction/erasing:
- Canvas-based rendering using pdfjs-dist
- Two tools: Redact (black box) and Erase (white box)
- Draw rectangles to mark areas
- Click existing rectangles to delete them
- Hover highlighting shows deletable areas
- Zoom in/out, rotate, fit-to-width, fit-to-page
- Mouse wheel scrolling for page navigation
- Saves edits by burning rectangles into PDF

**PageManager.tsx**: Modal for selecting/removing specific pages:
- Thumbnail grid of all pages
- Click to toggle page selection
- Only selected pages included in final bundle

**SaveLoadButtons.tsx**: Save and load bundle state:
- Save: Exports JSON file with base64-encoded PDFs embedded
- Load: Imports JSON and reconstructs File objects from base64

**DocumentPreview.tsx**: Full-screen PDF preview using iframe with blob URL.

### PDF Processing Flow

1. **Upload**: User uploads PDFs → `getPdfPageCount()` extracts page count → `generatePDFThumbnail()` creates preview → Document objects created

2. **Organize**:
   - Drag documents by grip handle to reorder
   - Use section dropdown to move between sections
   - Set document dates for chronological sorting
   - Click "Sort by Date" to auto-arrange

3. **Edit**:
   - **View**: Preview document in full-screen modal
   - **Pages**: Select which pages to include
   - **Redact**: Draw black/white boxes on PDF pages

4. **Generate**:
   - `bundleGenerator.generateBundle()` creates merged PDF
   - Processes sections in order with optional divider pages
   - Generates clickable index with bookmarks
   - Adds page numbers (configurable position/style)
   - Downloads final PDF

### Types (src/types.ts)

```typescript
interface Document {
  id: string
  file: File
  name: string
  pageCount: number
  order: number
  thumbnail?: string
  documentDate?: string        // DD-MM-YYYY format
  customTitle?: string
  selectedPages?: number[]     // Pages to include (1-indexed)
  needsReupload?: boolean      // For loaded bundles missing PDF data
  originalFileName?: string
}

interface Section {
  id: string
  name: string
  documents: Document[]
  addDivider: boolean
  order: number
  pagePrefix?: string          // e.g., "A", "B" for section-based numbering
  startPage?: number
}

interface BundleMetadata {
  caseName: string
  caseNumber: string
  court: string
  date: string
  bundleType?: string
  isAdversarial?: boolean
  applicants?: Party[]
  respondents?: Party[]
}

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
  page: number
  type: 'redact' | 'erase'
}

interface SavedBundle {
  metadata: BundleMetadata
  sections: SerializedSection[]
  pageNumberSettings: PageNumberSettings
  savedAt: string
  version: string              // "1.0" = PDFs embedded, "2.0" = metadata only
}
```

### State Management

State is managed in App.tsx using React hooks:
- `metadata` (BundleMetadata): Case information
- `sections` (Section[]): Array of sections with documents
- `previewDoc` (Document | null): Currently previewed document
- `pageNumberSettings` (PageNumberSettings): Page number configuration

### Key Implementation Details

**Drag and Drop**: Uses @dnd-kit with dedicated drag handle. The `{...listeners}` are attached only to the drag handle element, not the entire row, so button clicks work properly.

**PDF Editing**:
- PDFEditor renders pages on HTML canvas using pdfjs-dist
- Rectangles are drawn as overlays during editing
- On save, `burnRectanglesIntoPDF()` uses pdf-lib to permanently draw rectangles onto the PDF

**Save/Load**:
- `saveLoad.ts` serializes sections with PDFs as base64 strings
- `fileToBase64()` converts File to base64
- `base64ToFile()` reconstructs File from base64
- `isValidPdfBase64()` validates PDF data before reconstruction

**Index Generation**: Creates hierarchical table of contents with:
- Section headers (bold, uppercase)
- Document entries with page ranges
- Clickable internal links (PDF bookmarks)

**Page Numbering**: Configurable via PageNumberSettings:
- Position: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
- Font size and bold option
- Optional section prefixes (A001, B001, etc.)

## Firebase Configuration

Project: `court-bundle-builder`
- Authentication: Email/password
- Cloud Functions: User registration notifications
- Console: https://console.firebase.google.com (select court-bundle-builder project)

View registered users: Authentication → Users

### Cloud Functions

Located in `/functions` directory. Two functions are deployed:

1. **onUserCreated**: Triggered when a new user registers. Sends an email notification with user details.
2. **weeklyUserSummary**: Scheduled function (Mondays 9am London time). Sends summary of total users and new registrations.

#### Setup Email Notifications

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Configure email credentials (use Gmail App Password, not regular password)
firebase functions:config:set gmail.email="your-email@gmail.com"
firebase functions:config:set gmail.password="your-app-password"

# Optionally set different notification recipient
firebase functions:config:set notification.email="notifications@yourdomain.com"

# Deploy functions
cd functions && npm run deploy
```

#### Creating a Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-Step Verification if needed
3. Create App Password for "Mail" → "Other (Court Bundle Builder)"
4. Use the 16-character password generated

#### View Function Logs

```bash
firebase functions:log
```

Or in Firebase Console: Functions → Logs

## Common Development Tasks

### Adding a new document action button

1. Add button in `SectionDocumentList.tsx` within the `.document-actions` div
2. Use `onClick={(e) => { e.stopPropagation(); /* handler */ }}` pattern
3. Add corresponding CSS in `SectionDocumentList.css`

### Modifying PDF generation

Edit `src/utils/bundleGenerator.ts`:
- `generateBundle()` - Main entry point
- Index page creation uses pdf-lib drawing functions
- Divider pages use `createDividerPage()`

### Updating save/load format

Edit `src/utils/saveLoad.ts`:
- `serializeSections()` - Convert to JSON-safe format
- `deserializeSections()` - Reconstruct from JSON
- Update `SavedBundle` interface version if format changes

## Troubleshooting

**Buttons not responding to clicks**: Check if drag listeners are attached to entire container instead of drag handle only.

**PDF preview not working**: Verify File object is valid, check browser console for blob URL errors.

**Bundle generation fails**: Check console for pdf-lib errors, ensure all documents have valid File objects.

**Save file too large**: PDFs are base64-encoded (33% larger). Consider version 2.0 format (metadata only, re-upload PDFs on load).

## Recent Changes (January 2026)

- Fixed click handlers blocked by @dnd-kit drag listeners - moved listeners to dedicated drag handle
- Added GripVertical icon as visual drag indicator
- Enhanced save/load with PDF validation and detailed logging
- Added extensive console logging for debugging PDF operations
- Added HelpFAQ component with 15 FAQ items explaining all app features
- Added Firebase Cloud Functions for user registration email notifications
- Added weekly user summary scheduled function (Mondays 9am)
