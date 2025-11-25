import { PDFDocument, rgb } from 'pdf-lib'

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
  page: number
  type: 'redact' | 'erase'
}

/**
 * Burn rectangles (redactions/erasures) into a PDF file
 * Returns a new File with the rectangles drawn on it
 */
export async function burnRectanglesIntoPDF(
  originalFile: File,
  rectangles: Rectangle[]
): Promise<File> {
  try {
    // Load the PDF
    const arrayBuffer = await originalFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)

    // Group rectangles by page for efficiency
    const rectsByPage = new Map<number, Rectangle[]>()
    rectangles.forEach(rect => {
      const pageRects = rectsByPage.get(rect.page) || []
      pageRects.push(rect)
      rectsByPage.set(rect.page, pageRects)
    })

    // Process each page that has rectangles
    for (const [pageNum, pageRects] of rectsByPage.entries()) {
      const page = pdfDoc.getPage(pageNum - 1) // Convert 1-based to 0-based
      const { height: pageHeight } = page.getSize()

      // Draw each rectangle on this page
      for (const rect of pageRects) {
        // PDF coordinates are from bottom-left, but our rectangles are from top-left
        // So we need to flip the Y coordinate
        const pdfY = pageHeight - rect.y - rect.height

        if (rect.type === 'redact') {
          // Black rectangle for redaction
          page.drawRectangle({
            x: rect.x,
            y: pdfY,
            width: rect.width,
            height: rect.height,
            color: rgb(0, 0, 0),
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          })
        } else {
          // White rectangle for erasing - no border for seamless blending
          page.drawRectangle({
            x: rect.x,
            y: pdfY,
            width: rect.width,
            height: rect.height,
            color: rgb(1, 1, 1),
            borderWidth: 0, // No border - blends perfectly with white page
          })
        }
      }
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save()

    // Create a new File object
    const modifiedFile = new File(
      [pdfBytes as BlobPart],
      originalFile.name.replace('.pdf', '_edited.pdf'),
      { type: 'application/pdf' }
    )

    return modifiedFile
  } catch (error) {
    console.error('Error burning rectangles into PDF:', error)
    throw new Error('Failed to apply edits to PDF')
  }
}
