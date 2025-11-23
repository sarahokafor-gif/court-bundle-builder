#!/usr/bin/env node

/**
 * Bundle Recovery Script
 *
 * This script recovers a large JSON bundle file that crashes the browser.
 * It extracts all PDFs and metadata, then creates a new ZIP (.cbz) file.
 *
 * Usage:
 *   node recover-bundle.js <path-to-json-file>
 *
 * Example:
 *   node recover-bundle.js ~/Downloads/my_bundle_save.json
 */

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

// Check for JSZip - we'll need to install it
let JSZip
try {
  JSZip = require('jszip')
} catch (e) {
  console.error('\n❌ ERROR: JSZip is not installed.')
  console.error('\nPlease run: npm install jszip')
  console.error('Then try again.\n')
  process.exit(1)
}

async function recoverBundle(jsonFilePath) {
  console.log('🔧 Bundle Recovery Tool')
  console.log('━'.repeat(60))

  // Check if file exists
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`\n❌ ERROR: File not found: ${jsonFilePath}\n`)
    process.exit(1)
  }

  const stats = fs.statSync(jsonFilePath)
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  console.log(`📁 Input file: ${path.basename(jsonFilePath)}`)
  console.log(`📊 File size: ${fileSizeMB} MB`)
  console.log()

  try {
    // Step 1: Read and parse JSON file
    console.log('⏳ Step 1/4: Reading JSON file...')
    console.log('   (This may take 30-60 seconds for large files)')

    const jsonContent = await readFile(jsonFilePath, 'utf8')

    console.log('⏳ Step 2/4: Parsing JSON...')
    const bundleData = JSON.parse(jsonContent)

    // Validate structure
    if (!bundleData.metadata || !bundleData.sections) {
      throw new Error('Invalid bundle format: missing metadata or sections')
    }

    // Count documents
    const totalDocs = bundleData.sections.reduce((sum, section) =>
      sum + section.documents.length, 0
    )

    console.log(`✅ Parsed successfully!`)
    console.log(`   - Sections: ${bundleData.sections.length}`)
    console.log(`   - Documents: ${totalDocs}`)
    console.log()

    // Step 3: Create ZIP bundle
    console.log('⏳ Step 3/4: Creating ZIP bundle...')

    const zip = new JSZip()

    // Prepare metadata object
    const metadataObj = {
      version: '2.0',
      format: 'zip',
      ...bundleData.metadata,
      pageNumberSettings: bundleData.pageNumberSettings || {
        enabled: true,
        position: 'bottom-center',
        fontSize: 10,
        startNumber: 1
      },
      batesNumberSettings: bundleData.batesNumberSettings || {
        enabled: false,
        prefix: '',
        startNumber: 1,
        position: 'top-right',
        fontSize: 8
      }
    }

    // Add metadata
    zip.file('metadata.json', JSON.stringify(metadataObj, null, 2))
    console.log('   ✓ Added metadata.json')

    // Add sections metadata
    const sectionsMetadata = bundleData.sections.map(section => ({
      id: section.id,
      name: section.name,
      order: section.order,
      addDivider: section.addDivider,
      pagePrefix: section.pagePrefix,
      startPage: section.startPage,
      documents: section.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        pageCount: doc.pageCount,
        order: doc.order,
        documentDate: doc.documentDate,
        datePrecision: doc.datePrecision,
        customTitle: doc.customTitle,
        selectedPages: doc.selectedPages
      }))
    }))

    zip.file('sections.json', JSON.stringify(sectionsMetadata, null, 2))
    console.log('   ✓ Added sections.json')

    // Create documents folder
    const documentsFolder = zip.folder('documents')

    // Process each section and document
    let processedDocs = 0

    for (const section of bundleData.sections) {
      for (const doc of section.documents) {
        processedDocs++

        // Convert base64 back to binary
        if (doc.fileData) {
          const base64Data = doc.fileData.split(',')[1] || doc.fileData
          const binaryData = Buffer.from(base64Data, 'base64')
          documentsFolder.file(`${doc.id}_original.pdf`, binaryData)

          process.stdout.write(`\r   ✓ Extracting PDFs: ${processedDocs}/${totalDocs}`)
        }

        // Extract modified file if it exists
        if (doc.modifiedFileData) {
          const base64Data = doc.modifiedFileData.split(',')[1] || doc.modifiedFileData
          const binaryData = Buffer.from(base64Data, 'base64')
          documentsFolder.file(`${doc.id}_modified.pdf`, binaryData)
        }
      }
    }

    console.log() // New line after progress
    console.log()

    // Step 4: Generate ZIP file
    console.log('⏳ Step 4/4: Generating ZIP file...')
    console.log('   (This may take 1-2 minutes)')

    const zipContent = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    // Determine output filename
    const inputBasename = path.basename(jsonFilePath, '.json')
    const outputDir = path.dirname(jsonFilePath)
    const outputFilename = `${inputBasename}_recovered.cbz`
    const outputPath = path.join(outputDir, outputFilename)

    // Write ZIP file
    await writeFile(outputPath, zipContent)

    const outputSizeMB = (zipContent.length / (1024 * 1024)).toFixed(2)
    const savings = ((1 - zipContent.length / stats.size) * 100).toFixed(0)

    console.log()
    console.log('━'.repeat(60))
    console.log('✅ RECOVERY SUCCESSFUL!')
    console.log('━'.repeat(60))
    console.log()
    console.log(`📦 Output file: ${outputFilename}`)
    console.log(`📍 Location: ${outputPath}`)
    console.log(`📊 New size: ${outputSizeMB} MB (${savings}% smaller)`)
    console.log()
    console.log('Next steps:')
    console.log('1. Open Court Bundle Builder in your browser')
    console.log('2. Click "Load Saved Work"')
    console.log(`3. Select: ${outputFilename}`)
    console.log('4. Your bundle will load instantly! ⚡')
    console.log()
    console.log('Note: You can now delete the old JSON file.')
    console.log()

  } catch (error) {
    console.error()
    console.error('━'.repeat(60))
    console.error('❌ RECOVERY FAILED')
    console.error('━'.repeat(60))
    console.error()
    console.error('Error:', error.message)
    console.error()

    if (error.message.includes('JSON')) {
      console.error('The file appears to be corrupted or not a valid JSON bundle.')
    } else if (error.message.includes('memory')) {
      console.error('Not enough memory. Try closing other applications and run again.')
    }

    console.error()
    process.exit(1)
  }
}

// Main execution
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log()
  console.log('🔧 Bundle Recovery Tool')
  console.log('━'.repeat(60))
  console.log()
  console.log('Usage:')
  console.log('  node recover-bundle.js <path-to-json-file>')
  console.log()
  console.log('Example:')
  console.log('  node recover-bundle.js ~/Downloads/my_bundle_save.json')
  console.log()
  console.log('This tool converts large JSON bundles to the new ZIP format.')
  console.log('It runs outside the browser, so it can handle very large files.')
  console.log()
  process.exit(0)
}

const jsonFilePath = path.resolve(args[0])
recoverBundle(jsonFilePath)
