import * as pdfjsLib from 'pdfjs-dist'

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const THUMBNAIL_WIDTH = 120 // Width of thumbnail in pixels
const THUMBNAIL_QUALITY = 0.8 // JPEG quality (0-1)

/**
 * Generate a thumbnail image (data URL) of the first page of a PDF file
 */
export async function generatePDFThumbnail(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    // Get the first page
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1.0 })

    // Calculate scale to fit thumbnail width
    const scale = THUMBNAIL_WIDTH / viewport.width
    const scaledViewport = page.getViewport({ scale })

    // Create canvas for rendering
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not get canvas context')
    }

    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    }

    await page.render(renderContext).promise

    // Convert canvas to data URL (JPEG for smaller size)
    const dataUrl = canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY)

    // Clean up
    pdf.destroy()

    return dataUrl
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error)
    // Return a placeholder or empty string on error
    return ''
  }
}

/**
 * Generate thumbnails for multiple PDF files concurrently
 */
export async function generatePDFThumbnails(files: File[]): Promise<string[]> {
  try {
    const thumbnailPromises = files.map(file => generatePDFThumbnail(file))
    return await Promise.all(thumbnailPromises)
  } catch (error) {
    console.error('Error generating PDF thumbnails:', error)
    return files.map(() => '')
  }
}
