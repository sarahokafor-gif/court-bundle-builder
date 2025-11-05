# Court Bundle Builder

A web application for creating professional court bundles from multiple PDF documents with sections, dividers, and previews.

## Features

- **Organize with Sections**: Create custom sections (e.g., Pleadings, Evidence, Correspondence)
- **Visual Dividers**: Add optional divider pages before each section
- **Upload PDFs**: Upload multiple PDF documents at once
- **Preview Documents**: View any document in full-screen before generating bundle
- **Flexible Organization**: Move documents between sections, reorder within sections
- **Case Metadata**: Add case name, number, court, and date
- **Hierarchical Index**: Automatic table of contents showing sections and documents
- **Page Numbering**: Sequential numbering across all pages including dividers
- **One-Click Export**: Download as a single merged PDF

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Usage

1. **Enter Case Information**: Fill in the case name, case number, court, and date
2. **Create Sections**: Add sections like "Pleadings", "Evidence", "Correspondence"
   - Toggle "Divider page" checkbox to add visual separator pages
   - Rename or delete sections as needed (can't delete sections with documents)
3. **Upload Documents**: Click "Upload PDF Documents" and select one or more PDF files
   - Documents are initially added to "Main Documents" section
4. **Organize Documents**:
   - Preview any document by clicking the eye icon
   - Move documents between sections using the dropdown
   - Reorder within a section using up/down arrows
   - Remove documents with the trash icon
5. **Generate Bundle**: Click "Generate & Download Bundle" to create your court bundle

The generated bundle will include:
- An index page with hierarchical table of contents:
  - Section headers (bold) with divider page numbers
  - Document entries (indented) with page ranges
- Divider pages for sections where enabled (blue background with section name)
- All documents merged in section order
- Sequential page numbers on every page

## Technology

- React 18 with TypeScript
- Vite for fast development and building
- pdf-lib for PDF manipulation (merging, divider creation, page numbering)
- lucide-react for icons
- Fully client-side (no backend required, all processing in browser)

## License

MIT
