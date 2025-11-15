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

  let indexPageCount = 1
  let yPosition = height - 80

  // Title
  page.drawText('COURT BUNDLE INDEX', {
    x: 50,
    y: yPosition,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0),
  })

  yPosition -= 40

  // Case information
  const caseInfo = [
    `Case: ${metadata.caseName}`,
    `Case Number: ${metadata.caseNumber}`,
    metadata.court ? `Court: ${metadata.court}` : null,
    `Date: ${new Date(metadata.date).toLocaleDateString()}`,
  ].filter(Boolean)

  for (const info of caseInfo) {
    page.drawText(info!, {
      x: 50,
      y: yPosition,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    yPosition -= 20
  }

  yPosition -= 30

  // Table header (no background - professional black text only)
  page.drawText('Document', {
    x: 60,
    y: yPosition + 5,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  })

  page.drawText('Page(s)', {
    x: width - 120,
    y: yPosition + 5,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  })

  yPosition -= 30

  // Table entries
  for (const entry of indexEntries) {
    if (yPosition < 80) {
      // Add new page if running out of space
      page = pdfDoc.addPage([595, 842])
      indexPageCount++
      yPosition = page.getSize().height - 80
    }

    const entryFont = fontBold // All entries use bold font for professional appearance
    const entrySize = entry.isSection ? 11 : 10
    const xOffset = entry.indent ? 80 : 60

    // Calculate page range and date widths first
    let pageRange = ''
    let pageRangeWidth = 0
    if (entry.startPage) {
      pageRange = entry.startPage === entry.endPage
        ? entry.startPage
        : `${entry.startPage}-${entry.endPage}`
      pageRangeWidth = entryFont.widthOfTextAtSize(pageRange, entrySize)
    }

    const dateText = entry.documentDate || ''
    const dateWidth = dateText ? entryFont.widthOfTextAtSize(dateText, entrySize) : 0

    // Calculate available width for title
    const pageNumberX = width - 100 // Fixed position for page numbers
    const spacing = 15 // Space between elements
    const dateX = pageNumberX - pageRangeWidth - spacing - dateWidth
    const maxTitleWidth = dateText ? dateX - xOffset - spacing : pageNumberX - xOffset - pageRangeWidth - spacing

    let displayTitle = entry.title
    const titleWidth = entryFont.widthOfTextAtSize(displayTitle, entrySize)

    if (titleWidth > maxTitleWidth) {
      while (entryFont.widthOfTextAtSize(displayTitle + '...', entrySize) > maxTitleWidth && displayTitle.length > 0) {
        displayTitle = displayTitle.slice(0, -1)
      }
      displayTitle += '...'
    }

    const textHeight = entrySize

    // Draw title
    page.drawText(displayTitle, {
      x: xOffset,
      y: yPosition,
      size: entrySize,
      font: entryFont,
      color: rgb(0, 0, 0),
    })

    // Draw date if present (between title and page numbers)
    if (dateText) {
      page.drawText(dateText, {
        x: dateX,
        y: yPosition,
        size: entrySize,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
    }

    // Page range (skip for section headers without pages)
    if (entry.startPage) {
      // Right-align the page numbers
      const pageX = pageNumberX - pageRangeWidth
      page.drawText(pageRange, {
        x: pageX,
        y: yPosition,
        size: entrySize,
        font: entryFont,
        color: rgb(0, 0, 0),
      })
    }

    // Add clickable link annotation for the entire row (only if addLinks is true)
    if (addLinks) {
      const linkWidth = width - xOffset - 50
      const linkHeight = textHeight + 4

      // Create link annotation to jump to the target page
      const targetPage = pdfDoc.getPage(entry.startPageIndex)

      // Create destination array using context.obj for proper PDF structure
      const dest = pdfDoc.context.obj([targetPage.ref, 'Fit'])

      // Create link annotation
      const linkAnnotation = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [xOffset, yPosition - 2, xOffset + linkWidth, yPosition + linkHeight],
        Border: [0, 0, 0],
        Dest: dest,
      })

      const linkAnnotationRef = pdfDoc.context.register(linkAnnotation)

      const annots = page.node.get(PDFName.of('Annots'))
      if (annots instanceof PDFArray) {
        annots.push(linkAnnotationRef)
      } else {
        page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotationRef]))
      }
    }

    yPosition -= entry.isSection ? 30 : 25
  }

  // Footer
  page.drawText('Generated with Court Bundle Builder', {
    x: 50,
    y: 30,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  })

  return indexPageCount
}

/**
 * Adds clickable links to existing index pages after all pages have been added to PDF
 */
async function addLinksToIndex(
  pdfDoc: PDFDocument,
  indexEntries: IndexEntry[],
  indexPageCount: number,
  metadata: BundleMetadata
): Promise<void> {
  // Calculate the starting Y position to match where entries actually appear
  // This must match the exact logic in generateIndexPage
  const pageHeight = 842 // A4 height
  let yPosition = pageHeight - 80 // Initial position

  // Account for title
  yPosition -= 40

  // Calculate actual case info lines (matching generateIndexPage logic)
  const caseInfo = [
    `Case: ${metadata.caseName}`,
    `Case Number: ${metadata.caseNumber}`,
    metadata.court ? `Court: ${metadata.court}` : null,
    `Date: ${new Date(metadata.date).toLocaleDateString()}`,
  ].filter(Boolean)

  // Account for case info lines
  yPosition -= caseInfo.length * 20

  // Account for spacing before table header
  yPosition -= 30

  // Account for table header
  yPosition -= 30

  // Now yPosition is at the first entry position
  const yStart = yPosition
  const lineHeight = 25
  const sectionLineHeight = 30

  let currentIndexPage = 0
  yPosition = yStart

  for (const entry of indexEntries) {
    // Check if we need a new page
    if (yPosition < 80) {
      currentIndexPage++
      yPosition = pageHeight - 80
    }

    if (currentIndexPage >= indexPageCount) break

    const page = pdfDoc.getPage(currentIndexPage)
    const { width } = page.getSize()
    const entrySize = entry.isSection ? 11 : 10
    const xOffset = entry.indent ? 80 : 60
    const textHeight = entrySize

    // Only add links for entries that have pages (not section headers without documents)
    if (entry.startPage && entry.startPageIndex < pdfDoc.getPageCount()) {
      const linkWidth = width - xOffset - 50
      const linkHeight = textHeight + 4

      // Get the target page
      const targetPage = pdfDoc.getPage(entry.startPageIndex)

      // Debug logging
      console.log(`Creating link: "${entry.title}" -> page index ${entry.startPageIndex}, total pages: ${pdfDoc.getPageCount()}, yPos: ${yPosition}`)

      // Try simpler approach - use pdf-lib's link annotation method
      try {
        // Create destination array (matching bookmarks exactly)
        const dest = pdfDoc.context.obj([targetPage.ref, PDFName.of('Fit')])

        // Create a link annotation using pdf-lib's annotation API
        const linkAnnotDict = pdfDoc.context.obj({
          Type: PDFName.of('Annot'),
          Subtype: PDFName.of('Link'),
          Rect: [xOffset, yPosition - 2, xOffset + linkWidth, yPosition + linkHeight],
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

    yPosition -= entry.isSection ? sectionLineHeight : lineHeight
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
        const pdfDoc = await loadPdfFromFile(doc.file)

        // Determine which pages to include (use selectedPages if defined, otherwise all pages)
        const pageIndices = doc.selectedPages !== undefined && doc.selectedPages.length > 0
          ? doc.selectedPages
          : pdfDoc.getPageIndices()

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
    await addLinksToIndex(finalPdf, indexEntries, indexPageCount, metadata)

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

        // Calculate the actual number of pages (selected pages or all pages)
        const actualPageCount = doc.selectedPages !== undefined && doc.selectedPages.length > 0
          ? doc.selectedPages.length
          : doc.pageCount

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
    link.download = `${metadata.caseNumber || 'bundle'}_${metadata.caseName.replace(/\s+/g, '_')}_INDEX_DRAFT.pdf`
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
        const pdfDoc = await loadPdfFromFile(doc.file)

        // Determine which pages to include (use selectedPages if defined, otherwise all pages)
        const pageIndices = doc.selectedPages !== undefined && doc.selectedPages.length > 0
          ? doc.selectedPages
          : pdfDoc.getPageIndices()

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
    await addLinksToIndex(finalPdf, indexEntries, indexPageCount, metadata)

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
    link.download = `${metadata.caseNumber || 'bundle'}_${metadata.caseName.replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating bundle:', error)
    throw error
  }
}
