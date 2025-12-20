# PDF to Image Converter

## Overview
This script converts all PDF files in the `PDFs` folder to JPG images and saves them to a new `PDF_Images` folder.

## Features
- 📄 Converts all pages of each PDF to separate JPG images
- 🖼️ High quality output (150 DPI)
- 📊 Progress tracking with real-time updates
- 📝 Generates detailed summary report
- ⚡ Processes PDFs sequentially for stability
- 💾 Saves conversion summary as JSON

## Requirements
- Node.js (already installed)
- npm packages: `canvas`, `pdf-lib`, `pdfjs-dist` (already installed)

## Usage

### Run the converter:
```bash
npm run convert-pdfs
```

Or directly:
```bash
node convert-pdfs-to-images.js
```

## Output

### File Naming
Each PDF page is saved as: `{original-name}_page_{page-number}.jpg`

**Example:**
- Input: `EFTA00000001.pdf` (5 pages)
- Output:
  - `EFTA00000001_page_1.jpg`
  - `EFTA00000001_page_2.jpg`
  - `EFTA00000001_page_3.jpg`
  - `EFTA00000001_page_4.jpg`
  - `EFTA00000001_page_5.jpg`

### Output Directory
All images are saved to: `PDF_Images/`

### Summary Report
A JSON summary file is created: `PDF_Images/conversion_summary.json`

Contains:
- Timestamp
- Total PDFs processed
- Success/failure counts
- Total pages converted
- Duration
- Detailed results per PDF

## Console Output Example
```
🚀 PDF to Image Converter Starting...

✅ Created output directory: C:\Source\Repo\SecretApp\PDF_Images

📚 Found 1287 PDF files

[1/1287]
📄 Processing: EFTA00000001.pdf
   📑 Pages: 3
   ⏳ Converting page 3/3...
   ✅ Converted 3 page(s)

[2/1287]
📄 Processing: EFTA00000002.pdf
   📑 Pages: 5
   ⏳ Converting page 5/5...
   ✅ Converted 5 page(s)

...

============================================================
📊 CONVERSION SUMMARY
============================================================
✅ Successfully converted: 1287 PDFs
❌ Failed: 0 PDFs
📑 Total pages converted: 3842
⏱️  Time taken: 1247.35 seconds
📁 Output directory: C:\Source\Repo\SecretApp\PDF_Images
============================================================

💾 Summary saved to: conversion_summary.json

✨ Conversion complete!
```

## Configuration

You can modify these settings in the script:

```javascript
const DPI = 150;  // Image resolution (72-300)
```

### DPI Guidelines:
- **72 DPI** - Low quality, fast (for thumbnails)
- **150 DPI** - Good quality, balanced (default)
- **300 DPI** - High quality, slow (for printing)

## Performance

### Estimated Time:
- ~1 second per page on average hardware
- For 1287 PDFs with ~3 pages each: ~20-40 minutes
- Time varies based on:
  - PDF complexity
  - Page count
  - System resources
  - DPI setting

### Disk Space:
- Each page: ~50-200 KB (depending on content)
- For ~3842 pages: ~200-800 MB total

## Troubleshooting

### Error: "Out of Memory"
- Process PDFs in batches
- Reduce DPI setting
- Close other applications

### Error: "Cannot find module"
Run:
```bash
npm install
```

### Slow Performance
- Reduce DPI to 72 or 100
- Check system resources
- Close other applications

## Notes

- Original PDF files are NOT modified
- Images are JPEG format (90% quality)
- One image per PDF page
- Multi-page PDFs create multiple images
- Progress is shown in real-time
- Safe to interrupt (Ctrl+C) - partial results are saved

## Example Summary JSON

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "totalPdfs": 1287,
  "successCount": 1287,
  "failCount": 0,
  "totalPages": 3842,
  "durationSeconds": 1247.35,
  "results": [
    {
      "success": true,
      "pdfName": "EFTA00000001.pdf",
      "pages": 3,
      "files": [
        "EFTA00000001_page_1.jpg",
        "EFTA00000001_page_2.jpg",
        "EFTA00000001_page_3.jpg"
      ]
    }
  ]
}
```
