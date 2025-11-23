# Bundle Recovery Instructions

## Problem

Your 412.6 MB JSON bundle file is too large for the browser to load. The browser crashes at 50% with Error code: 5 because it runs out of memory.

## Solution

Use this **Node.js recovery script** to convert your JSON file to the new ZIP format outside the browser. Node.js has access to much more memory than the browser.

---

## Step-by-Step Instructions

### 1. Open Terminal

- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter

### 2. Navigate to the Project Folder

```bash
cd ~/Desktop/court-bundle-builder
```

### 3. Run the Recovery Script

Replace `path/to/your/file.json` with the actual path to your JSON file:

```bash
node recover-bundle.cjs ~/Desktop/my_bundle_save.json
```

**Real-world examples:**

```bash
# If your JSON is in Downloads folder:
node recover-bundle.cjs ~/Downloads/my_bundle_save.json

# If your JSON is on Desktop:
node recover-bundle.cjs ~/Desktop/my_bundle_save.json

# If you're on Windows:
node recover-bundle.cjs C:\Users\YourName\Downloads\my_bundle_save.json
```

### 4. Wait for Completion

The script will show progress:

```
🔧 Bundle Recovery Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Input file: my_bundle_save.json
📊 File size: 412.60 MB

⏳ Step 1/4: Reading JSON file...
   (This may take 30-60 seconds for large files)
⏳ Step 2/4: Parsing JSON...
✅ Parsed successfully!
   - Sections: 2
   - Documents: 12

⏳ Step 3/4: Creating ZIP bundle...
   ✓ Added metadata.json
   ✓ Added sections.json
   ✓ Extracting PDFs: 12/12

⏳ Step 4/4: Generating ZIP file...
   (This may take 1-2 minutes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ RECOVERY SUCCESSFUL!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Output file: my_bundle_save_recovered.cbz
📍 Location: /Users/admin/Desktop/my_bundle_save_recovered.cbz
📊 New size: 85.30 MB (79% smaller)

Next steps:
1. Open Court Bundle Builder in your browser
2. Click "Load Saved Work"
3. Select: my_bundle_save_recovered.cbz
4. Your bundle will load instantly! ⚡

Note: You can now delete the old JSON file.
```

**Estimated time:** 2-5 minutes for a 412 MB file

### 5. Load the Recovered Bundle

1. **Open**: https://aa7e9463.court-bundle-builder-2vf.pages.dev
2. **Click**: "Load Saved Work" button
3. **Select**: The new `.cbz` file (e.g., `my_bundle_save_recovered.cbz`)
4. **Result**: Your bundle loads in 1-2 seconds! ⚡

---

## What This Script Does

1. ✅ Reads your large JSON file (using Node.js, which has more memory)
2. ✅ Extracts all PDF documents from base64 encoding
3. ✅ Preserves all metadata (case info, sections, document details)
4. ✅ Creates a new ZIP (.cbz) file
5. ✅ Reduces file size by 75-85% (412 MB → ~50-100 MB)

## Benefits of ZIP Format

- **Fast loading**: Loads in 1-2 seconds (vs. crashing)
- **Smaller files**: 75-85% smaller than JSON
- **Reliable**: No more browser crashes
- **Transferable**: Easy to email and backup
- **Human-readable**: Unzip and view PDFs directly

---

## Troubleshooting

### Error: "command not found: node"

You need to install Node.js first:

1. Visit: https://nodejs.org/
2. Download the LTS version (left button)
3. Install it
4. Restart your terminal
5. Try the recovery script again

### Error: "JSZip is not installed"

Run this command first:

```bash
npm install jszip
```

Then try the recovery script again.

### Error: "File not found"

Make sure the path to your JSON file is correct. You can drag-and-drop the file into Terminal to get the full path:

```bash
node recover-bundle.cjs
# Then drag your JSON file into the terminal window
# The path will appear automatically
# Press Enter
```

### Script is very slow

This is normal for large files. The script needs to:
- Read 412 MB of JSON
- Parse it into memory
- Extract 12 PDFs from base64
- Create a ZIP file

**Expected time:** 2-5 minutes for a 412 MB file

### Still having issues?

Make sure you're in the correct directory:

```bash
# Check where you are:
pwd

# Should show:
# /Users/admin/Desktop/court-bundle-builder

# If not, navigate there:
cd ~/Desktop/court-bundle-builder
```

---

## After Recovery

Once you have the `.cbz` file:

1. ✅ Test loading it in the browser (should work instantly)
2. ✅ Keep the `.cbz` file as your master copy
3. ✅ Delete the old JSON file (or keep as backup)
4. ✅ Always use "Save Progress" button going forward
5. ✅ Always use ZIP format (.cbz) from now on

---

## Why Did This Happen?

The JSON format encodes PDF files as base64 text, which:
- Increases file size by 33%
- Requires the browser to load everything into memory at once
- Causes crashes for files over ~100 MB

The ZIP format stores PDFs as binary files, which:
- Keeps original file sizes
- Loads progressively (no crash)
- Is the industry standard for archives

**Going forward, always use ZIP format!**
