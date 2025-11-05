import { PDFDocument, rgb, StandardFonts, PDFName, PDFArray, PDFString } from 'pdf-lib'
import { Section, BundleMetadata, PageNumberSettings } from '../types'
import { loadPdfFromFile } from './pdfUtils'

interface IndexEntry {
  title: string
  startPage: string // Now uses section-based page numbers like "A1", "B5"
  endPage: string
  startPageIndex: number // Actual 0-based page index in PDF for creating links
  isSection?: boolean
  indent?: boolean
}

/**
 * Generates a table of contents page for the bundle
 * Returns the number of index pages created
 */
async function generateIndexPage(
  pdfDoc: PDFDocument,
  metadata: BundleMetadata,
  indexEntries: IndexEntry[]
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
    color: rgb(0.12, 0.24, 0.45),
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
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    })
    yPosition -= 20
  }

  yPosition -= 30

  // Table header
  page.drawRectangle({
    x: 50,
    y: yPosition - 5,
    width: width - 100,
    height: 25,
    color: rgb(0.9, 0.93, 0.96),
  })

  page.drawText('Document', {
    x: 60,
    y: yPosition + 5,
    size: 11,
    font: fontBold,
    color: rgb(0.12, 0.24, 0.45),
  })

  page.drawText('Page(s)', {
    x: width - 120,
    y: yPosition + 5,
    size: 11,
    font: fontBold,
    color: rgb(0.12, 0.24, 0.45),
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

    const entryFont = entry.isSection ? fontBold : font
    const entrySize = entry.isSection ? 11 : 10
    const xOffset = entry.indent ? 80 : 60

    // Calculate page range first to determine available width for title
    let pageRange = ''
    let pageRangeWidth = 0
    if (entry.startPage) {
      pageRange = entry.startPage === entry.endPage
        ? entry.startPage
        : `${entry.startPage}-${entry.endPage}`
      pageRangeWidth = entryFont.widthOfTextAtSize(pageRange, entrySize)
    }

    // Document name (truncate if too long)
    const pageNumberX = width - 100 // Fixed position for page numbers
    const dotSpacing = 20 // Space for dots between title and page number
    const maxWidth = pageNumberX - xOffset - dotSpacing
    let displayTitle = entry.title
    const titleWidth = entryFont.widthOfTextAtSize(displayTitle, entrySize)

    if (titleWidth > maxWidth) {
      while (entryFont.widthOfTextAtSize(displayTitle + '...', entrySize) > maxWidth && displayTitle.length > 0) {
        displayTitle = displayTitle.slice(0, -1)
      }
      displayTitle += '...'
    }

    const textHeight = entrySize

    page.drawText(displayTitle, {
      x: xOffset,
      y: yPosition,
      size: entrySize,
      font: entryFont,
      color: entry.isSection ? rgb(0.12, 0.24, 0.45) : rgb(0.2, 0.2, 0.2),
    })

    // Page range (skip for section headers without pages)
    if (entry.startPage) {
      // Right-align the page numbers
      const pageX = pageNumberX - pageRangeWidth
      page.drawText(pageRange, {
        x: pageX,
        y: yPosition,
        size: entrySize,
        font: entryFont,
        color: rgb(0.2, 0.2, 0.2),
      })
    }

    // Add clickable link annotation for the entire row
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
 * Generates the complete court bundle PDF
 */
export async function generateBundle(
  metadata: BundleMetadata,
  sections: Section[],
  pageNumberSettings: PageNumberSettings
): Promise<void> {
  try {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create()

    // Track index entries and page numbers
    const indexEntries: IndexEntry[] = []
    const pageNumbers: string[] = [] // Array of page numbers for each page

    // Track the current page index in the PDF (before index insertion)
    let currentPageIndex = 0

    // Process each section
    for (const section of sections) {
      // Skip empty sections
      if (section.documents.length === 0) continue

      let sectionPageNum = section.startPage
      let dividerPageNumber = ''
      let dividerPageIndex = -1

      // Add divider page if requested
      if (section.addDivider) {
        await createDividerPage(mergedPdf, section.name)
        dividerPageNumber = `${section.pagePrefix}${sectionPageNum}`
        pageNumbers.push(dividerPageNumber)
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

      // Load and merge all documents in this section
      for (const doc of section.documents) {
        const pdfDoc = await loadPdfFromFile(doc.file)
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())

        const docStartPageNumber = `${section.pagePrefix}${sectionPageNum}`
        const docStartPageIndex = currentPageIndex

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page)
          pageNumbers.push(`${section.pagePrefix}${sectionPageNum}`)
          sectionPageNum++
          currentPageIndex++
        })

        const docEndPageNumber = `${section.pagePrefix}${sectionPageNum - 1}`

        // Add to index
        indexEntries.push({
          title: doc.name.replace('.pdf', ''),
          startPage: docStartPageNumber,
          endPage: docEndPageNumber,
          startPageIndex: docStartPageIndex,
          indent: true,
        })
      }
    }

    // First pass: generate index to count how many pages it will take
    let indexPageCount = await generateIndexPage(mergedPdf, metadata, indexEntries)

    // Remove the temporary index pages
    for (let i = 0; i < indexPageCount; i++) {
      mergedPdf.removePage(mergedPdf.getPageCount() - 1)
    }

    // Now adjust all the page indices in indexEntries to account for index pages
    indexEntries.forEach(entry => {
      entry.startPageIndex += indexPageCount
    })

    // Second pass: generate the index again with correct page indices for links
    indexPageCount = await generateIndexPage(mergedPdf, metadata, indexEntries)

    // Get the indices of the index pages (they're at the end right now)
    const totalPages = mergedPdf.getPageCount()
    const indexPageIndices = []
    for (let i = 0; i < indexPageCount; i++) {
      indexPageIndices.push(totalPages - indexPageCount + i)
    }

    // Copy the index pages
    const indexPages = await mergedPdf.copyPages(mergedPdf, indexPageIndices)

    // Remove the index pages from the end (in reverse order to maintain indices)
    for (let i = indexPageCount - 1; i >= 0; i--) {
      mergedPdf.removePage(totalPages - indexPageCount + i)
    }

    // Insert index pages at the beginning
    for (let i = 0; i < indexPages.length; i++) {
      mergedPdf.insertPage(i, indexPages[i])
    }

    // Add empty page numbers for index pages
    for (let i = 0; i < indexPageCount; i++) {
      pageNumbers.unshift('') // Add empty strings at the beginning for index pages
    }

    // Add page numbers to all pages (except index)
    await addPageNumbers(mergedPdf, pageNumbers, pageNumberSettings)

    // Add bookmarks/outlines for sidebar navigation
    addBookmarks(mergedPdf, indexEntries)

    // Save and download
    const pdfBytes = await mergedPdf.save()
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
