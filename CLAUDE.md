# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Court Bundle Builder - A React + TypeScript + Vite application for creating and managing court bundles (legal document collections). Users can organize documents into sections with optional divider pages, preview documents, add case metadata, and generate a single merged PDF with a hierarchical index and page numbering.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint TypeScript/TSX files
npm run type-check   # Run TypeScript compiler without emitting files
```

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **PDF Processing**: pdf-lib for merging PDFs, creating index pages, and adding page numbers
- **Icons**: lucide-react
- **Styling**: Plain CSS with component-specific stylesheets

## Architecture

### Application Structure

```
src/
├── components/               # React components
│   ├── MetadataForm          # Form for case information (name, number, court, date)
│   ├── SectionManager        # Create, rename, delete sections; toggle dividers
│   ├── DocumentUploader      # File upload interface for PDFs
│   ├── SectionDocumentList   # Display documents organized by section
│   ├── DocumentPreview       # Modal for previewing PDFs
│   └── BundleGenerator       # Generate and download final bundle
├── utils/
│   ├── pdfUtils.ts           # PDF file utilities (page counting, loading)
│   └── bundleGenerator.ts    # Core bundle generation logic (with sections & dividers)
├── types.ts                  # TypeScript type definitions
├── App.tsx                   # Main application component
└── main.tsx                  # Application entry point
```

### Key Components

**App.tsx**: Main container that manages state for bundle metadata, sections, and documents. Coordinates data flow between child components. Handles section management, document operations (add/remove/reorder/move), and preview state.

**MetadataForm**: Collects case information (case name, case number, court, date) stored in BundleMetadata type.

**SectionManager**: UI for managing sections - create new sections, rename existing ones, delete empty sections, and toggle divider pages for each section. Shows document count per section.

**DocumentUploader**: File input for uploading PDFs. Validates file types, extracts page counts, creates Document objects, and adds them to the first section.

**SectionDocumentList**: Displays documents organized by section. Each section shows as a collapsible block with its documents. Features include: reordering within section (up/down arrows), moving documents between sections (dropdown), preview button (eye icon), and remove button.

**DocumentPreview**: Full-screen modal that displays PDF in an iframe. Shows document name, page count, and close button. Auto-manages blob URLs for PDF preview.

**BundleGenerator**: Triggers bundle generation via bundleGenerator.ts utility. Displays summary showing section count, document count, and total pages before generation.

### PDF Processing Flow

1. **Upload**: User uploads PDFs → `pdfUtils.getPdfPageCount()` extracts page count → Document objects created and added to first section
2. **Organize**: User creates sections, assigns documents to sections, enables divider pages, reorders documents within sections
3. **Preview**: Click eye icon to view any document in full-screen modal
4. **Generate**:
   - `bundleGenerator.generateBundle()` creates new PDFDocument
   - Iterates through sections in order:
     - If section has `addDivider: true`, creates a divider page with section name
     - Merges all documents in that section
   - Generates hierarchical index page:
     - Section headers (bold, uppercase) with divider page numbers
     - Document entries (indented) with page ranges
   - Inserts index as first page
   - Adds page numbers to all pages
   - Downloads merged PDF

### Types (src/types.ts)

- **Document**: Represents an uploaded PDF (id, file, name, pageCount, order)
- **Section**: Organizational unit containing documents (id, name, documents, addDivider, order)
- **BundleMetadata**: Case information (caseName, caseNumber, court, date)
- **Bundle**: Combines metadata and sections (used for type safety)

### State Management

State is managed in App.tsx using React hooks:
- `metadata` (BundleMetadata): Case information
- `sections` (Section[]): Array of sections, each containing documents
- `previewDoc` (Document | null): Currently previewed document

The app starts with one default section called "Main Documents". Documents are organized within sections. Section operations include add/remove/rename/reorder. Document operations include add/remove/reorder-within-section/move-between-sections.

## Key Implementation Details

- **Section-Based Organization**: Documents are organized into sections. Each section can optionally have a divider page that appears before its documents in the final bundle.

- **Divider Pages**: Visually distinct pages created with pdf-lib featuring centered section name in white text on blue background with decorative lines. These act as visual separators in the bundle.

- **Index Page Generation**: Creates a hierarchical table of contents showing:
  - Section headers (bold, uppercase) with page number of divider (if enabled)
  - Document entries (indented) with page ranges
  - Uses pdf-lib with automatic text truncation and pagination

- **Document Preview**: Uses iframe with blob URLs to display PDFs. URLs are automatically created when opening preview and revoked when closing.

- **Page Numbering**: Applied after merge, numbers start at 1 (index page is page 1). Divider pages and all document pages receive sequential numbers.

- **File Download**: Generated PDF is saved as `{caseNumber}_{caseName}.pdf` and auto-downloaded via blob URL.

- **Error Handling**: File validation checks for PDF type, page count extraction errors alert user. Empty sections are skipped during bundle generation.

## Development Notes

- All components have corresponding CSS files for styling
- TypeScript strict mode is enabled
- The app is fully client-side (no backend required)
- PDF processing happens entirely in the browser using pdf-lib
