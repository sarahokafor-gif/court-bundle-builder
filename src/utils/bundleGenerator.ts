import { PDFDocument, rgb, StandardFonts, PDFName, PDFArray, PDFString, degrees } from 'pdf-lib'
import { Section, BundleMetadata, PageNumberSettings } from '../types'
import { loadPdfFromFile } from './pdfUtils'

interface IndexEntry {
  title: string
  startPage: string // Now uses section-based page numbers like "A001", "B015"
  endPage: string
  startPageIndex: number // Actual 0-based page index in PDF for creating links
  isSection?: boolean
  indent?: boolean
  documentDate?: string // Optional date in DD-MM-YYYY format
}

/**
 * Format page number with 3-digit zero padding for alignment
 * Example: formatPageNumber("A", 5) returns "A005"
 */
function formatPageNumber(prefix: string, pageNum: number): string {
  return `${prefix}${pageNum.toString().padStart(3, '0')}`
}

/**
 * Generates a table of contents page for the bundle
 * Returns the number of index pages created
 */
async function generateIndexPage(
  pdfDoc: PDFDocument,
  metadata: BundleMetadata,
  indexEntries: IndexEntry[],
  addLinks: boolean = true
): Promise<number> {
  let page = pdfDoc.addPage([595, 842]) // A4 size
  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  let indexPageCount = 1
  let yPosition = height - 60

  // Helper function to center text
  const centerText = (text: string, y: number, size: number, textFont: any) => {
    const textWidth = textFont.widthOfTextAtSize(text, size)
    const x = (width - textWidth) / 2
    page.drawText(text, {
      x,
      y,
      size,
      font: textFont,
      color: rgb(0, 0, 0),
    })
  }

  // 1. COURT HEADER - Centered, Bold, 12pt
  const courtHeader = `IN THE ${(metadata.court || 'FAMILY').toUpperCase()} COURT`
  centerText(courtHeader, yPosition, 12, fontBold)
  yPosition -= 30

  // 2. CASE NUMBER - Centered, 11pt
  const caseNumberText = `Case No: ${metadata.caseNumber || '[CASE NUMBER]'}`
  centerText(caseNumberText, yPosition, 11, font)
  yPosition -= 30

  // 3. "BETWEEN:" - Centered, Bold, 11pt
  centerText('BETWEEN:', yPosition, 11, fontBold)
  yPosition -= 25

  // 4-6. PARTIES - Dynamic rendering based on parties array
  // Group parties by role for display
  const getRoleLabel = (role: string, customRole: string | undefined, count: number): string => {
    if (role === 'other' && customRole) {
      return count > 1 ? `${customRole}s` : customRole
    }
    const labels: Record<string, string> = {
      'applicant': count > 1 ? 'Applicants' : 'Applicant',
      'respondent': count > 1 ? 'Respondents' : 'Respondent',
      'claimant': count > 1 ? 'Claimants' : 'Claimant',
      'defendant': count > 1 ? 'Defendants' : 'Defendant',
      'appellant': count > 1 ? 'Appellants' : 'Appellant',
      'interested-person': count > 1 ? 'Interested Persons' : 'Interested Person',
    }
    return labels[role] || role
  }

  // Group parties by role
  const partiesByRole = new Map<string, Array<{ name: string; customRole?: string }>>()

  if (metadata.parties && metadata.parties.length > 0) {
    metadata.parties.forEach(party => {
      const key = party.role === 'other' ? `other-${party.customRole}` : party.role
      if (!partiesByRole.has(key)) {
        partiesByRole.set(key, [])
      }
      partiesByRole.get(key)!.push({ name: party.name, customRole: party.customRole })
    })
  } else {
    // Backward compatibility: use old fields if parties array is empty
    if (metadata.applicantName) {
      partiesByRole.set('applicant', [{ name: metadata.applicantName }])
    }
    if (metadata.respondentName) {
      partiesByRole.set('respondent', [{ name: metadata.respondentName }])
    }
    // If still no parties, show placeholder
    if (partiesByRole.size === 0) {
      partiesByRole.set('applicant', [{ name: '[APPLICANT NAME]' }])
      partiesByRole.set('respondent', [{ name: '[RESPONDENT NAME]' }])
    }
  }

  // Render each role group
  const roleGroups = Array.from(partiesByRole.entries())
  roleGroups.forEach(([roleKey, parties], groupIndex) => {
    const role = roleKey.startsWith('other-') ? 'other' : roleKey
    const customRole = roleKey.startsWith('other-') ? roleKey.substring(6) : undefined
    const roleLabel = getRoleLabel(role, customRole, parties.length)

    // Render each party name
    parties.forEach((party, partyIndex) => {
      const partyName = party.name || '[PARTY NAME]'
      page.drawText(partyName, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      })

      // Only show role label on the last name of this group (aligned right)
      if (partyIndex === parties.length - 1) {
        const labelWidth = fontItalic.widthOfTextAtSize(roleLabel, 10)
        page.drawText(roleLabel, {
          x: width - labelWidth - 50,
          y: yPosition,
          size: 10,
          font: fontItalic,
          color: rgb(0, 0, 0),
        })
      }

      yPosition -= 20
    })

    // Add "-and-" between role groups (but not after the last group)
    if (groupIndex < roleGroups.length - 1) {
      yPosition += 5 // Adjust spacing
      centerText('-and-', yPosition, 11, font)
      yPosition -= 25
    }
  })

  yPosition -= 15 // Extra space after parties section

  // 7. PRACTICE DIRECTION COMPLIANCE - Centered, Bold, 12pt
  const pdText = metadata.bundleType
    ? `PRACTICE DIRECTION ${metadata.bundleType.toUpperCase().replace(/-/g, ' ')} COMPLIANT BUNDLE INDEX`
    : 'PRACTICE DIRECTION COMPLIANT BUNDLE INDEX'
  centerText(pdText, yPosition, 12, fontBold)
  yPosition -= 30

  // 8. BUNDLE TITLE - Centered, 11pt
  const bundleTitle = metadata.bundleTitle || metadata.caseName || '[Bundle Title]'
  centerText(bundleTitle, yPosition, 11, font)
  yPosition -= 30

  // 9. PREPARED BY - Left aligned, Bold, 10pt
  const preparedByText = `Prepared by: ${metadata.preparerName || '[Preparer Name]'} (${metadata.preparerRole || '[Role]'})`
  page.drawText(preparedByText, {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  yPosition -= 20

  // 10. DATE - Left aligned, Bold, 10pt
  const formattedDate = new Date(metadata.date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  const dateText = `Date: ${formattedDate}`
  page.drawText(dateText, {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  yPosition -= 35

  // 11. TABLE HEADER - Bold, with borders
  page.drawText('Document', {
    x: 65,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  page.drawText('Page No.', {
    x: width - 100,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  })

  // Draw table header border
  page.drawLine({
    start: { x: 50, y: yPosition - 5 },
    end: { x: width - 50, y: yPosition - 5 },
    thickness: 1,
    color: rgb(0, 0, 0),
  })

  yPosition -= 20

  // Track current section for numbering
  let currentSection = ''
  let documentCounter = 0
  let lastWasSection = false

  // Table entries
  for (const entry of indexEntries) {
    if (yPosition < 150) {
      // Add new page if running out of space (reserve space for footer)
      page = pdfDoc.addPage([595, 842])
      indexPageCount++
      yPosition = page.getSize().height - 80

      // Redraw table header on new page
      page.drawText('Document', {
        x: 65,
        y: yPosition,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
      page.drawText('Page No.', {
        x: width - 100,
        y: yPosition,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
      page.drawLine({
        start: { x: 50, y: yPosition - 5 },
        end: { x: width - 50, y: yPosition - 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      })
      yPosition -= 20
      lastWasSection = false
    }

    if (entry.isSection) {
      // SECTION HEADER - Bold, Uppercase, 11pt
      if (!lastWasSection) {
        yPosition -= 10 // Extra space before section
      }

      // Truncate section title if too long to prevent overlap
      let sectionText = entry.title.toUpperCase()
      const maxSectionWidth = width - 100 // Leave margin on right
      const sectionTextWidth = fontBold.widthOfTextAtSize(sectionText, 11)

      if (sectionTextWidth > maxSectionWidth) {
        while (fontBold.widthOfTextAtSize(sectionText + '...', 11) > maxSectionWidth && sectionText.length > 0) {
          sectionText = sectionText.slice(0, -1)
        }
        sectionText = sectionText.trim() + '...'
      }

      page.drawText(sectionText, {
        x: 50,
        y: yPosition,
        size: 11,
        font: fontBold,
        color: rgb(0, 0, 0),
      })

      currentSection = entry.title.split(':')[0].trim() // Extract section letter (e.g., "SECTION A")
      documentCounter = 0
      yPosition -= 25
      lastWasSection = true
    } else {
      // DOCUMENT ENTRY with numbering (e.g., A1, A2, B1, B2)
      documentCounter++
      const sectionLetter = currentSection.replace('SECTION ', '').trim() || 'A'
      const docNumber = `${sectionLetter}${documentCounter}.`

      // Calculate page range
      let pageRange = '[  ]'
      if (entry.startPage) {
        pageRange = entry.startPage === entry.endPage
          ? `[${entry.startPage}]`
          : `[${entry.startPage}-${entry.endPage}]`
      }

      // Build document description with date if present
      let docDescription = entry.title
      if (entry.documentDate) {
        docDescription = `${entry.title} (${entry.documentDate})`
      }

      // Calculate available width for description
      const maxTitleWidth = width - 220
      let displayTitle = docDescription
      const titleWidth = font.widthOfTextAtSize(displayTitle, 10)

      if (titleWidth > maxTitleWidth) {
        while (font.widthOfTextAtSize(displayTitle + '...', 10) > maxTitleWidth && displayTitle.length > 0) {
          displayTitle = displayTitle.slice(0, -1)
        }
        displayTitle += '...'
      }

      // Draw document number and description
      page.drawText(docNumber, {
        x: 60,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })

      page.drawText(displayTitle, {
        x: 85,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })

      // Draw page number (right-aligned)
      const pageRangeWidth = font.widthOfTextAtSize(pageRange, 10)
      page.drawText(pageRange, {
        x: width - 50 - pageRangeWidth,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      })

      // Add clickable link annotation for the entire row (only if addLinks is true)
      if (addLinks && entry.startPageIndex >= 0) {
        const linkWidth = width - 110
        const linkHeight = 14

        // Create link annotation to jump to the target page
        const targetPage = pdfDoc.getPage(entry.startPageIndex)

        // Create destination array - XYZ with null params goes to top of page
        const dest = pdfDoc.context.obj([
          targetPage.ref,
          PDFName.of('XYZ'),
          null,
          null,
          null
        ])

        // Create link annotation
        const linkAnnotation = pdfDoc.context.obj({
          Type: PDFName.of('Annot'),
          Subtype: PDFName.of('Link'),
          Rect: [60, yPosition - 2, 60 + linkWidth, yPosition + linkHeight],
          Border: [0, 0, 0],
          Dest: dest,
          H: PDFName.of('I'), // Highlighting mode
        })

        const linkAnnotationRef = pdfDoc.context.register(linkAnnotation)

        const annots = page.node.get(PDFName.of('Annots'))
        if (annots instanceof PDFArray) {
          annots.push(linkAnnotationRef)
        } else {
          page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotationRef]))
        }
      }

      yPosition -= 20
      lastWasSection = false
    }
  }

  // Footer section at the bottom of the last page
  yPosition = 120 // Fixed position for footer notes

  page.drawText('NOTES:', {
    x: 50,
    y: yPosition,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  yPosition -= 15

  const notes = [
    `1. This bundle index complies with Practice Direction ${metadata.bundleType || '[XX]'}.`,
    '2. Page numbers will be completed once the bundle is fully assembled.',
    '3. All documents are in chronological order within each section.',
  ]

  for (const note of notes) {
    page.drawText(note, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    })
    yPosition -= 14
  }

  yPosition -= 10

  page.drawText(`Prepared by: ${metadata.preparerName || '[Preparer Name]'} (${metadata.preparerRole || '[Role]'})`, {
    x: 50,
    y: yPosition,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  })
  yPosition -= 14

  page.drawText(`Date: ${formattedDate}`, {
    x: 50,
    y: yPosition,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  })

  return indexPageCount
}

/**
 * Adds clickable links to existing index pages after all pages have been added to PDF
 */
async function addLinksToIndex(
  pdfDoc: PDFDocument,
  metadata: BundleMetadata,
  indexEntries: IndexEntry[],
  indexPageCount: number
): Promise<void> {
  // Calculate the starting Y position to match the NEW professional format in generateIndexPage
  // This must match EXACTLY the spacing in generateIndexPage
  const pageHeight = 842 // A4 height
  let yPosition = pageHeight - 60 // Initial position (matches generateIndexPage)

  // 1. Court Header - 12pt, centered
  yPosition -= 30

  // 2. Case Number - 11pt, centered
  yPosition -= 30

  // 3. "BETWEEN:" - 11pt, centered, bold
  yPosition -= 25

  // 4-6. PARTIES - Dynamic spacing based on actual parties
  // Count total party lines and role groups
  const partiesByRole = new Map<string, number>()

  if (metadata.parties && metadata.parties.length > 0) {
    metadata.parties.forEach(party => {
      const key = party.role === 'other' ? `other-${party.customRole}` : party.role
      partiesByRole.set(key, (partiesByRole.get(key) || 0) + 1)
    })
  } else {
    // Backward compatibility
    if (metadata.applicantName) partiesByRole.set('applicant', 1)
    if (metadata.respondentName) partiesByRole.set('respondent', 1)
    if (partiesByRole.size === 0) {
      partiesByRole.set('applicant', 1)
      partiesByRole.set('respondent', 1)
    }
  }

  // Calculate spacing for party section
  const roleGroupCount = partiesByRole.size
  let totalPartyLines = 0

  partiesByRole.forEach((count) => {
    totalPartyLines += count // Each party takes one line (20px)
  })

  // Each party line is 20px
  yPosition -= totalPartyLines * 20

  // Add "-and-" spacing between role groups (25px per separator)
  // Number of separators = roleGroupCount - 1
  if (roleGroupCount > 1) {
    yPosition -= (roleGroupCount - 1) * 25
    yPosition += 5 * (roleGroupCount - 1) // Adjust spacing (same as generateIndexPage line 147)
  }

  // Extra space after parties section
  yPosition -= 15

  // 7. Practice Direction - 12pt, centered, bold
  yPosition -= 30

  // 8. Bundle Title - 11pt, centered
  yPosition -= 30

  // 9. Prepared By - 10pt, left aligned, bold
  yPosition -= 20

  // 10. Date - 10pt, left aligned, bold
  yPosition -= 35

  // 11. Table header and border
  yPosition -= 20

  // Now yPosition is at the first entry position
  const yStart = yPosition
  const lineHeight = 20 // Document entry spacing
  const sectionLineHeight = 25 // Section header spacing (+ 10px extra space before)

  let currentIndexPage = 0
  yPosition = yStart
  let lastWasSection = false
  let documentCounter = 0

  for (const entry of indexEntries) {
    // Check if we need a new page
    if (yPosition < 150) {
      currentIndexPage++
      yPosition = pageHeight - 80
      lastWasSection = false
      // Note: Table header is redrawn on new pages in generateIndexPage, so account for it
      yPosition -= 20
    }

    if (currentIndexPage >= indexPageCount) break

    const page = pdfDoc.getPage(currentIndexPage)
    const { width } = page.getSize()

    if (entry.isSection) {
      // Section header - add extra space before if not first or after another section
      if (!lastWasSection) {
        yPosition -= 10
      }
      yPosition -= sectionLineHeight
      lastWasSection = true
      documentCounter = 0
    } else {
      // Document entry
      documentCounter++

      // Only add links for document entries (not section headers)
      if (entry.startPageIndex >= 0 && entry.startPageIndex < pdfDoc.getPageCount()) {
        const linkWidth = width - 110
        const linkHeight = 14

        // Get the target page
        const targetPage = pdfDoc.getPage(entry.startPageIndex)

        // Debug logging
        console.log(`Creating link: "${entry.title}" -> page index ${entry.startPageIndex}, total pages: ${pdfDoc.getPageCount()}, yPos: ${yPosition}`)

        // Create link annotation
        try {
          // Create destination array (direct array, not wrapped in obj)
          const dest = pdfDoc.context.obj([
            targetPage.ref,
            PDFName.of('XYZ'),
            null,
            null,
            null
          ])

          // Create a link annotation
          const linkAnnotDict = pdfDoc.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Link'),
            Rect: [60, yPosition - 2, 60 + linkWidth, yPosition + linkHeight],
            Border: [0, 0, 0],
            Dest: dest,
            H: PDFName.of('I'), // Highlighting mode: Invert
          })

          const linkAnnotRef = pdfDoc.context.register(linkAnnotDict)

          // Get or create Annots array on the page
          const annots = page.node.get(PDFName.of('Annots'))
          if (annots instanceof PDFArray) {
            annots.push(linkAnnotRef)
          } else {
            page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotRef]))
          }

          console.log(`✓ Link created for "${entry.title}"`)
        } catch (err) {
          console.error(`Failed to create link for "${entry.title}":`, err)
        }
      }

      yPosition -= lineHeight
      lastWasSection = false
    }
  }
}

/**
 * Creates a simple divider page for a section
 */
async function createDividerPage(
  pdfDoc: PDFDocument,
  sectionName: string
): Promise<void> {
  const page = pdfDoc.addPage([595, 842]) // A4 size
  const { height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Section name at the top in size 16
  page.drawText(sectionName, {
    x: 50,
    y: height - 50,
    size: 16,
    font: font,
    color: rgb(0, 0, 0),
  })
}

/**
 * Adds section-based page numbers to all pages in the document
 */
async function addPageNumbers(
  pdfDoc: PDFDocument,
  pageNumbers: string[],
  settings: PageNumberSettings
): Promise<void> {
  const font = settings.bold
    ? await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    : await pdfDoc.embedFont(StandardFonts.Helvetica)
  const pages = pdfDoc.getPages()

  for (let i = 0; i < pages.length; i++) {
    if (i >= pageNumbers.length) continue // Skip if no page number assigned

    const page = pages[i]
    const { width, height } = page.getSize()
    const pageNumber = pageNumbers[i]

    if (!pageNumber) continue // Skip pages without numbers (like index)

    // Calculate position based on settings
    let x: number, y: number
    const textWidth = font.widthOfTextAtSize(pageNumber, settings.fontSize)

    switch (settings.position) {
      case 'bottom-center':
        x = (width - textWidth) / 2
        y = 20
        break
      case 'bottom-right':
        x = width - textWidth - 50
        y = 20
        break
      case 'bottom-left':
        x = 50
        y = 20
        break
      case 'top-center':
        x = (width - textWidth) / 2
        y = height - 30
        break
      case 'top-right':
        x = width - textWidth - 50
        y = height - 30
        break
      case 'top-left':
        x = 50
        y = height - 30
        break
      default:
        x = (width - textWidth) / 2
        y = 20
    }

    page.drawText(pageNumber, {
      x,
      y,
      size: settings.fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    })
  }
}

/**
 * Adds PDF bookmarks/outlines for sidebar navigation
 */
function addBookmarks(
  pdfDoc: PDFDocument,
  indexEntries: IndexEntry[]
): void {
  const context = pdfDoc.context

  // Create outline items array
  const outlineItems: any[] = []
  let prevItemRef: any = null

  // Create outline item for each entry (skip section headers for now, or include them)
  indexEntries.forEach((entry, index) => {
    const targetPage = pdfDoc.getPage(entry.startPageIndex)

    // Create destination array
    const dest = context.obj([targetPage.ref, 'Fit'])

    // Create outline item
    const outlineItem = context.obj({
      Title: PDFString.of(entry.title),
      Parent: null as any, // Will be set later
      Dest: dest,
      ...(prevItemRef && { Prev: prevItemRef }),
    })

    const outlineItemRef = context.register(outlineItem)
    outlineItems.push({ ref: outlineItemRef, dict: outlineItem })

    // Set Next on previous item
    if (prevItemRef) {
      const prevDict = outlineItems[index - 1].dict
      prevDict.set(PDFName.of('Next'), outlineItemRef)
    }

    prevItemRef = outlineItemRef
  })

  if (outlineItems.length === 0) return

  // Create outlines dictionary
  const outlinesDict = context.obj({
    Type: 'Outlines',
    First: outlineItems[0].ref,
    Last: outlineItems[outlineItems.length - 1].ref,
    Count: outlineItems.length,
  })

  const outlinesDictRef = context.register(outlinesDict)

  // Set parent on all outline items
  outlineItems.forEach(item => {
    item.dict.set(PDFName.of('Parent'), outlinesDictRef)
  })

  // Add outlines to catalog
  const catalog = pdfDoc.catalog
  catalog.set(PDFName.of('Outlines'), outlinesDictRef)
}

/**
 * Adds watermark to all pages of a PDF
 */
async function addWatermark(pdfDoc: PDFDocument): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDoc.getPages()

  for (const page of pages) {
    const { width, height } = page.getSize()

    // Calculate diagonal text position (center of page)
    const text = 'PREVIEW - NOT FOR OFFICIAL USE'
    const textSize = 48
    const textWidth = font.widthOfTextAtSize(text, textSize)

    // Calculate center position
    const centerX = width / 2
    const centerY = height / 2

    // Draw watermark with rotation (45 degrees)
    page.drawText(text, {
      x: centerX - textWidth / 2,
      y: centerY,
      size: textSize,
      font: font,
      color: rgb(0.9, 0.1, 0.1),
      opacity: 0.3,
      rotate: degrees(45)
    })
  }
}

/**
 * Generates a watermarked preview of the bundle
 */
export async function generateBundlePreview(
  metadata: BundleMetadata,
  sections: Section[],
  pageNumberSettings: PageNumberSettings
): Promise<string> {
  // Generate the bundle same as normal but return blob URL instead of downloading
  try {
    // PHASE 1: Build a temporary PDF with just documents to calculate index entries
    const tempPdf = await PDFDocument.create()
    const indexEntries: IndexEntry[] = []
    const documentPageNumbers: string[] = []
    let currentPageIndex = 0

    // Collect document pages and build index entries
    for (const section of sections) {
      if (section.documents.length === 0) continue

      let sectionPageNum = section.startPage
      let dividerPageNumber = ''
      let dividerPageIndex = -1

      // Track divider page
      if (section.addDivider) {
        await createDividerPage(tempPdf, section.name)
        dividerPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum)
        documentPageNumbers.push(dividerPageNumber)
        dividerPageIndex = currentPageIndex
        currentPageIndex++
        sectionPageNum++
      }

      // Add section header to index
      indexEntries.push({
        title: section.name.toUpperCase(),
        startPage: section.addDivider ? dividerPageNumber : '',
        endPage: section.addDivider ? dividerPageNumber : '',
        startPageIndex: dividerPageIndex >= 0 ? dividerPageIndex : 0,
        isSection: true,
      })

      // Load documents
      for (const doc of section.documents) {
        // CRITICAL: Use modifiedFile if it exists (contains edits like eraser/redaction/page deletion)
        // Only use selectedPages if there's no modifiedFile (backwards compatibility)
        const fileToUse = doc.modifiedFile || doc.file
        const pdfDoc = await loadPdfFromFile(fileToUse)

        // If using modifiedFile, it already has the right pages - use all of them
        // If using original file, respect selectedPages filtering
        const pageIndices = doc.modifiedFile
          ? pdfDoc.getPageIndices() // Use all pages from modified file
          : (doc.selectedPages !== undefined && doc.selectedPages.length > 0
              ? doc.selectedPages
              : pdfDoc.getPageIndices())

        const copiedPages = await tempPdf.copyPages(pdfDoc, pageIndices)

        const docStartPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum)
        const docStartPageIndex = currentPageIndex

        copiedPages.forEach((page) => {
          tempPdf.addPage(page)
          documentPageNumbers.push(formatPageNumber(section.pagePrefix, sectionPageNum))
          sectionPageNum++
          currentPageIndex++
        })

        const docEndPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum - 1)

        indexEntries.push({
          title: doc.customTitle || doc.name.replace('.pdf', ''),
          startPage: docStartPageNumber,
          endPage: docEndPageNumber,
          startPageIndex: docStartPageIndex,
          indent: true,
          documentDate: doc.documentDate,
        })
      }
    }

    // PHASE 2: Count how many index pages we'll need
    const indexCountPdf = await PDFDocument.create()
    const indexPageCount = await generateIndexPage(indexCountPdf, metadata, indexEntries, false)

    // PHASE 3: Adjust all page indices to account for index pages at the front
    indexEntries.forEach(entry => {
      entry.startPageIndex += indexPageCount
    })

    // PHASE 4: Build the final PDF with index first, then documents
    const finalPdf = await PDFDocument.create()

    // Generate index pages (links disabled to avoid page access errors)
    await generateIndexPage(finalPdf, metadata, indexEntries, false)

    // Copy all document pages from temp PDF
    const documentPages = await finalPdf.copyPages(tempPdf, tempPdf.getPageIndices())
    documentPages.forEach(page => finalPdf.addPage(page))

    // Now that all pages exist, add clickable links to the index
    await addLinksToIndex(finalPdf, metadata, indexEntries, indexPageCount)

    // Build complete page numbers array
    const allPageNumbers: string[] = []
    for (let i = 0; i < indexPageCount; i++) {
      allPageNumbers.push('') // Empty for index pages
    }
    allPageNumbers.push(...documentPageNumbers)

    // Add page numbers to all pages (except index)
    await addPageNumbers(finalPdf, allPageNumbers, pageNumberSettings)

    // Add watermark to every page
    await addWatermark(finalPdf)

    // Add bookmarks/outlines for sidebar navigation
    const allBookmarks: IndexEntry[] = [
      {
        title: 'INDEX',
        startPage: '',
        endPage: '',
        startPageIndex: 0,
        isSection: true,
      },
      ...indexEntries,
    ]
    addBookmarks(finalPdf, allBookmarks)

    // Save PDF and return blob URL
    const pdfBytes = await finalPdf.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    return url
  } catch (error) {
    console.error('Error generating preview:', error)
    throw error
  }
}

/**
 * Generates index only as a standalone PDF for review/circulation
 */
export async function generateIndexOnly(
  metadata: BundleMetadata,
  sections: Section[]
): Promise<void> {
  try {
    // Build index entries without actually processing the documents
    const indexEntries: IndexEntry[] = []
    let currentPageIndex = 0

    for (const section of sections) {
      if (section.documents.length === 0) continue

      let sectionPageNum = section.startPage
      let dividerPageIndex = -1

      // Account for divider page
      if (section.addDivider) {
        const dividerPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum)
        dividerPageIndex = currentPageIndex
        currentPageIndex++
        sectionPageNum++

        // Add section header with divider page
        indexEntries.push({
          title: section.name.toUpperCase(),
          startPage: dividerPageNumber,
          endPage: dividerPageNumber,
          startPageIndex: dividerPageIndex,
          isSection: true,
        })
      } else {
        // Add section header without page reference
        indexEntries.push({
          title: section.name.toUpperCase(),
          startPage: '',
          endPage: '',
          startPageIndex: currentPageIndex,
          isSection: true,
        })
      }

      // Add document entries
      for (const doc of section.documents) {
        const docStartPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum)
        const docStartPageIndex = currentPageIndex

        // Calculate the actual number of pages
        // If modifiedFile exists, doc.pageCount is already updated to match it
        // Otherwise, use selectedPages count or total page count
        const actualPageCount = doc.modifiedFile
          ? doc.pageCount // ModifiedFile page count (already updated when file was modified)
          : (doc.selectedPages !== undefined && doc.selectedPages.length > 0
              ? doc.selectedPages.length
              : doc.pageCount)

        // Calculate end page based on actual page count
        sectionPageNum += actualPageCount
        currentPageIndex += actualPageCount

        const docEndPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum - 1)

        indexEntries.push({
          title: doc.customTitle || doc.name.replace('.pdf', ''),
          startPage: docStartPageNumber,
          endPage: docEndPageNumber,
          startPageIndex: docStartPageIndex,
          indent: true,
          documentDate: doc.documentDate,
        })
      }
    }

    // Create PDF with just the index (no links since target pages don't exist)
    const indexPdf = await PDFDocument.create()
    await generateIndexPage(indexPdf, metadata, indexEntries, false)

    // Add watermark/notice to each page
    const font = await indexPdf.embedFont(StandardFonts.HelveticaBold)
    const pages = indexPdf.getPages()
    pages.forEach(page => {
      const { height } = page.getSize()
      page.drawText('DRAFT INDEX FOR REVIEW - NOT FINAL BUNDLE', {
        x: 50,
        y: height - 20,
        size: 10,
        font: font,
        color: rgb(0.7, 0, 0),
      })
    })

    // Save and download
    const pdfBytes = await indexPdf.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${metadata.caseNumber || 'bundle'}_${(metadata.bundleTitle || metadata.caseName || 'bundle').replace(/\s+/g, '_')}_INDEX_DRAFT.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating index:', error)
    throw error
  }
}

/**
 * Generates index preview as a blob URL for display
 */
export async function generateIndexPreview(
  metadata: BundleMetadata,
  sections: Section[]
): Promise<string> {
  try {
    // Build index entries without actually processing the documents
    const indexEntries: IndexEntry[] = []
    let currentPageIndex = 0

    for (const section of sections) {
      if (section.documents.length === 0) continue

      let sectionPageNum = section.startPage
      let dividerPageIndex = -1

      // Account for divider page
      if (section.addDivider) {
        const dividerPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum)
        dividerPageIndex = currentPageIndex
        currentPageIndex++
        sectionPageNum++

        // Add section header with divider page
        indexEntries.push({
          title: section.name.toUpperCase(),
          startPage: dividerPageNumber,
          endPage: dividerPageNumber,
          startPageIndex: dividerPageIndex,
          isSection: true,
        })
      } else {
        // Add section header without page reference
        indexEntries.push({
          title: section.name.toUpperCase(),
          startPage: '',
          endPage: '',
          startPageIndex: currentPageIndex,
          isSection: true,
        })
      }

      // Add document entries
      for (const doc of section.documents) {
        const docStartPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum)
        const docStartPageIndex = currentPageIndex

        // Calculate the actual number of pages
        // If modifiedFile exists, doc.pageCount is already updated to match it
        // Otherwise, use selectedPages count or total page count
        const actualPageCount = doc.modifiedFile
          ? doc.pageCount // ModifiedFile page count (already updated when file was modified)
          : (doc.selectedPages !== undefined && doc.selectedPages.length > 0
              ? doc.selectedPages.length
              : doc.pageCount)

        // Calculate end page based on actual page count
        sectionPageNum += actualPageCount
        currentPageIndex += actualPageCount

        const docEndPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum - 1)

        indexEntries.push({
          title: doc.customTitle || doc.name.replace('.pdf', ''),
          startPage: docStartPageNumber,
          endPage: docEndPageNumber,
          startPageIndex: docStartPageIndex,
          indent: true,
          documentDate: doc.documentDate,
        })
      }
    }

    // Create PDF with just the index (no links since target pages don't exist)
    const indexPdf = await PDFDocument.create()
    await generateIndexPage(indexPdf, metadata, indexEntries, false)

    // Add watermark/notice to each page
    const font = await indexPdf.embedFont(StandardFonts.HelveticaBold)
    const pages = indexPdf.getPages()
    pages.forEach(page => {
      const { height } = page.getSize()
      page.drawText('DRAFT INDEX FOR REVIEW - NOT FINAL BUNDLE', {
        x: 50,
        y: height - 20,
        size: 10,
        font: font,
        color: rgb(0.7, 0, 0),
      })
    })

    // Save PDF and return blob URL (instead of downloading)
    const pdfBytes = await indexPdf.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    return url
  } catch (error) {
    console.error('Error generating index preview:', error)
    throw error
  }
}

/**
 * Generates the complete court bundle PDF
 */
export async function generateBundle(
  metadata: BundleMetadata,
  sections: Section[],
  pageNumberSettings: PageNumberSettings
): Promise<void> {
  try {
    // PHASE 1: Build a temporary PDF with just documents to calculate index entries
    const tempPdf = await PDFDocument.create()
    const indexEntries: IndexEntry[] = []
    const documentPageNumbers: string[] = []
    let currentPageIndex = 0

    // Collect document pages and build index entries
    for (const section of sections) {
      if (section.documents.length === 0) continue

      let sectionPageNum = section.startPage
      let dividerPageNumber = ''
      let dividerPageIndex = -1

      // Track divider page
      if (section.addDivider) {
        await createDividerPage(tempPdf, section.name)
        dividerPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum)
        documentPageNumbers.push(dividerPageNumber)
        dividerPageIndex = currentPageIndex
        currentPageIndex++
        sectionPageNum++
      }

      // Add section header to index
      indexEntries.push({
        title: section.name.toUpperCase(),
        startPage: section.addDivider ? dividerPageNumber : '',
        endPage: section.addDivider ? dividerPageNumber : '',
        startPageIndex: dividerPageIndex >= 0 ? dividerPageIndex : 0,
        isSection: true,
      })

      // Load documents
      for (const doc of section.documents) {
        // CRITICAL: Use modifiedFile if it exists (contains edits like eraser/redaction/page deletion)
        // Only use selectedPages if there's no modifiedFile (backwards compatibility)
        const fileToUse = doc.modifiedFile || doc.file
        const pdfDoc = await loadPdfFromFile(fileToUse)

        // If using modifiedFile, it already has the right pages - use all of them
        // If using original file, respect selectedPages filtering
        const pageIndices = doc.modifiedFile
          ? pdfDoc.getPageIndices() // Use all pages from modified file
          : (doc.selectedPages !== undefined && doc.selectedPages.length > 0
              ? doc.selectedPages
              : pdfDoc.getPageIndices())

        const copiedPages = await tempPdf.copyPages(pdfDoc, pageIndices)

        const docStartPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum)
        const docStartPageIndex = currentPageIndex

        copiedPages.forEach((page) => {
          tempPdf.addPage(page)
          documentPageNumbers.push(formatPageNumber(section.pagePrefix, sectionPageNum))
          sectionPageNum++
          currentPageIndex++
        })

        const docEndPageNumber = formatPageNumber(section.pagePrefix, sectionPageNum - 1)

        indexEntries.push({
          title: doc.customTitle || doc.name.replace('.pdf', ''),
          startPage: docStartPageNumber,
          endPage: docEndPageNumber,
          startPageIndex: docStartPageIndex,
          indent: true,
          documentDate: doc.documentDate,
        })
      }
    }

    // PHASE 2: Count how many index pages we'll need (no links needed for counting)
    const indexCountPdf = await PDFDocument.create()
    const indexPageCount = await generateIndexPage(indexCountPdf, metadata, indexEntries, false)

    // PHASE 3: Adjust all page indices to account for index pages at the front
    indexEntries.forEach(entry => {
      entry.startPageIndex += indexPageCount
    })

    // PHASE 4: Build the final PDF with index first, then documents
    const finalPdf = await PDFDocument.create()

    // Generate index pages (links disabled to avoid page access errors)
    await generateIndexPage(finalPdf, metadata, indexEntries, false)

    // Copy all document pages from temp PDF
    const documentPages = await finalPdf.copyPages(tempPdf, tempPdf.getPageIndices())
    documentPages.forEach(page => finalPdf.addPage(page))

    // Now that all pages exist, add clickable links to the index
    await addLinksToIndex(finalPdf, metadata, indexEntries, indexPageCount)

    // Build complete page numbers array (empty for index, then document page numbers)
    const allPageNumbers: string[] = []
    for (let i = 0; i < indexPageCount; i++) {
      allPageNumbers.push('') // Empty for index pages
    }
    allPageNumbers.push(...documentPageNumbers)

    // Add page numbers to all pages (except index)
    await addPageNumbers(finalPdf, allPageNumbers, pageNumberSettings)

    // Add bookmarks/outlines for sidebar navigation (including index)
    const allBookmarks: IndexEntry[] = [
      {
        title: 'INDEX',
        startPage: '',
        endPage: '',
        startPageIndex: 0,
        isSection: true,
      },
      ...indexEntries,
    ]
    addBookmarks(finalPdf, allBookmarks)

    // Always generate as single PDF (no automatic volume splitting)
    // Users can manually split if needed for court requirements
    const pdfBytes = await finalPdf.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${metadata.caseNumber || 'bundle'}_${(metadata.bundleTitle || metadata.caseName || 'bundle').replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating bundle:', error)
    throw error
  }
}
