import { PDFDocument } from 'pdf-lib'

/**
 * Gets the number of pages in a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  return pdfDoc.getPageCount()
}

/**
 * Loads a PDF document from a File
 */
export async function loadPdfFromFile(file: File): Promise<PDFDocument> {
  const arrayBuffer = await file.arrayBuffer()
  return await PDFDocument.load(arrayBuffer)
}

/**
 * Extracts selected pages from a PDF and creates a new PDF file with only those pages
 * @param file Original PDF file
 * @param selectedPages Array of 0-indexed page numbers to include
 * @param filename Name for the new file
 * @returns New File object containing only the selected pages
 */
export async function extractSelectedPages(
  file: File,
  selectedPages: number[],
  filename: string
): Promise<File> {
  // Load the source PDF
  const sourcePdf = await loadPdfFromFile(file)

  // Create a new PDF document
  const newPdf = await PDFDocument.create()

  // Copy only the selected pages (in order)
  const sortedPages = [...selectedPages].sort((a, b) => a - b)
  const copiedPages = await newPdf.copyPages(sourcePdf, sortedPages)

  // Add copied pages to the new document
  copiedPages.forEach(page => {
    newPdf.addPage(page)
  })

  // Save the new PDF
  const pdfBytes = await newPdf.save()

  // Create a new File object (pdfBytes is a Uint8Array)
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
  return new File([blob], filename, { type: 'application/pdf' })
}
