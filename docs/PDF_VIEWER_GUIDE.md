# PDF Viewer - User Guide

## Overview
The PDF Viewer is a simple app that displays all PDF files from the `PDFs` folder in an organized grid layout with search functionality.

## Features

### 📋 File Grid View
- Displays all PDF files in a responsive grid layout
- Shows file names with PDF icons
- Hover effects for better user experience
- 24 files per page with pagination

### 🔍 Search Functionality
- Real-time search as you type
- Searches through PDF filenames
- Case-insensitive search
- Automatically resets to first page when searching

### 👁️ PDF Preview
- Click any PDF to open it in a full-screen dialog
- PDF renders in an embedded viewer
- Native browser PDF controls (zoom, page navigation, print, download)
- Close button to return to grid view

### 💾 Download Option
- Download button in the preview dialog
- Downloads PDF directly to your computer

### 📄 File Information
- Total document count displayed in header
- Filtered count updates with search

## Technical Details

### Components
- **PDFViewer.tsx** - Main React component
- **Material-UI** - UI framework for consistent design
- **iframe** - Native PDF rendering (no external libraries needed)

### API Endpoints
- `GET /api/pdf-files` - Returns list of all PDF files
- `GET /PDFs/{filename}` - Serves individual PDF files

### File Structure
```
SecretApp/
├── PDFs/                    # PDF files directory
│   ├── EFTA00000001.pdf
│   ├── EFTA00000002.pdf
│   └── ...
├── src/
│   └── PDFViewer.tsx       # PDF viewer component
└── server.js               # Backend with PDF endpoints
```

## Usage

1. Navigate to "PDF Document Viewer" from the sidebar under "Workshop & Projects"
2. Browse the grid of PDF files
3. Use the search bar to filter files by name
4. Click any PDF to view it
5. Use browser PDF controls to zoom, navigate pages
6. Click download icon to save PDF
7. Close dialog to return to grid

## Browser Compatibility
- Chrome/Edge: Full support with native PDF viewer
- Firefox: Full support with native PDF viewer
- Safari: Full support with native PDF viewer

## Adding New PDFs
Simply add PDF files to the `PDFs` folder and they will automatically appear in the viewer (refresh page if needed).

## Limitations
- Only displays PDF files (filters by .pdf extension)
- Requires PDFs to be in the `PDFs` folder
- No inline editing capabilities
- No PDF merging/splitting features

## Future Enhancements (Potential)
- PDF thumbnail generation
- Multi-file download
- Folder organization
- PDF annotations
- File upload functionality
- File metadata display (size, date, pages)
