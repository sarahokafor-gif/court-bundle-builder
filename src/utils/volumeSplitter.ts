import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

const MAX_PAGES_PER_VOLUME = 350

interface VolumeInfo {
  volumeNumber: number
  startPage: number
  endPage: number
  pageCount: number
}

/**
 * Calculate how to split pages into volumes of max 350 pages each
 */
export function calculateVolumes(totalPages: number): VolumeInfo[] {
  if (totalPages <= MAX_PAGES_PER_VOLUME) {
    return [{
      volumeNumber: 1,
      startPage: 0,
      endPage: totalPages - 1,
      pageCount: totalPages
    }]
  }

  const volumes: VolumeInfo[] = []
  let remainingPages = totalPages
  let currentStartPage = 0
  let volumeNumber = 1

  while (remainingPages > 0) {
    const pagesInThisVolume = Math.min(MAX_PAGES_PER_VOLUME, remainingPages)

    volumes.push({
      volumeNumber,
      startPage: currentStartPage,
      endPage: currentStartPage + pagesInThisVolume - 1,
      pageCount: pagesInThisVolume
    })

    currentStartPage += pagesInThisVolume
    remainingPages -= pagesInThisVolume
    volumeNumber++
  }

  return volumes
}

/**
 * Split a PDF into multiple volumes
 */
export async function splitPdfIntoVolumes(
  sourcePdf: PDFDocument,
  volumes: VolumeInfo[]
): Promise<PDFDocument[]> {
  const volumePdfs: PDFDocument[] = []

  for (const volume of volumes) {
    const volumePdf = await PDFDocument.create()
    const pageIndices = []

    for (let i = volume.startPage; i <= volume.endPage; i++) {
      pageIndices.push(i)
    }

    const copiedPages = await volumePdf.copyPages(sourcePdf, pageIndices)
    copiedPages.forEach(page => volumePdf.addPage(page))

    volumePdfs.push(volumePdf)
  }

  return volumePdfs
}

/**
 * Create a ZIP file containing all volume PDFs
 */
export async function createVolumeZip(
  volumePdfs: PDFDocument[],
  metadata: { caseNumber: string; caseName: string }
): Promise<Blob> {
  const zip = new JSZip()

  for (let i = 0; i < volumePdfs.length; i++) {
    const volumeNumber = i + 1
    const pdfBytes = await volumePdfs[i].save()
    const filename = `${metadata.caseNumber}_${metadata.caseName.replace(/\s+/g, '_')}_Volume_${volumeNumber}_of_${volumePdfs.length}.pdf`
    zip.file(filename, pdfBytes)
  }

  // Add a README file explaining the volumes
  const readme = `Court Bundle - ${metadata.caseName} (${metadata.caseNumber})

This bundle has been split into ${volumePdfs.length} volumes in accordance with Practice Direction requirements.

Maximum 350 pages per volume.

Volume Structure:
${volumePdfs.map((_, i) => `- Volume ${i + 1} of ${volumePdfs.length}`).join('\n')}

Generated with Court Bundle Builder
https://courtbundler.com
`
  zip.file('README.txt', readme)

  return await zip.generateAsync({ type: 'blob' })
}

/**
 * Download the volumes as a ZIP file
 */
export function downloadVolumesZip(
  blob: Blob,
  metadata: { caseNumber: string; caseName: string }
): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${metadata.caseNumber || 'bundle'}_${metadata.caseName.replace(/\s+/g, '_')}_VOLUMES.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format volume information for display
 */
export function formatVolumeInfo(volumes: VolumeInfo[]): string {
  if (volumes.length === 1) {
    return `Single volume (${volumes[0].pageCount} pages)`
  }

  return `${volumes.length} volumes (${volumes.map(v => `Vol ${v.volumeNumber}: ${v.pageCount} pages`).join(', ')})`
}
