# Modern PDF Viewer – Complete Desktop Application

A fully functional, native offline PDF viewer and editor with a minimalist, clean, and intuitive interface inspired by Apple Preview and Linear.

![Modern PDF Viewer](src/assets/hero.png)

## ✨ Key Features

### 1. High-Performance PDF Viewing & Rendering
- **Multi-View Modes**: Continuous vertical scroll, single-page view, and two-page book spread.
- **Smart Page Virtualization**: Built with `IntersectionObserver` to handle large and dense PDF documents (50 to 500+ pages) without out-of-memory or GPU freezes.
- **Granular Zoom**: Fit to Width, Fit to Page, 100% Actual Size, custom percentages (50% to 200%), and interactive `+` / `-` zoom shortcuts.
- **Full Screen & Rotation**: Presentation mode and 90° clockwise/anticlockwise page rotation.

### 2. Comprehensive Annotation & Markup
- **Toggleable Annotation Bar**: One-click **Annotate: On / Off** button in the navbar for distraction-free reading.
- **Text Markups**: Highlight, underline, and strikethrough.
- **Freehand Drawing**: Smooth Pen and Pencil tools with adjustable thickness and customizable color palette.
- **Shapes & Callouts**: Geometric shapes (Rectangle, Circle, Line, Arrow), text boxes, sticky notes, and image insertion.
- **History & Undo/Redo**: Full multi-level undo/redo stack and interactive eraser.
- **True Vector Baking**: Bake annotations directly into the PDF binary so external viewers display them permanently.

### 3. Real PDF Document Manipulation
- **Page Operations**: Rotate individual pages, duplicate pages, delete pages, add blank pages, and reorder pages.
- **Document Utilities**: Crop page margins, merge multiple PDFs, extract custom page ranges, and split all pages into a `.zip` archive.

### 4. Search, Navigation & Organization
- **Instant Search**: Full-text search with match counters, whole-word, and case-sensitive filters.
- **Document Outline & Thumbnails**: Table of contents navigation, lazy-rendered page thumbnails, and user bookmarks.
- **Personal Notes**: Persistent notes attached to each document.

### 5. 100% Offline & Local First
- Zero external network dependencies, no cloud telemetry, and no uploading private documents to external servers.
- Native Windows File Explorer open/save dialog integration.
- Fast Base64 chunk streaming between the Electron main process and renderer for handling heavy multi-megabyte PDFs.

---

## 🚀 Download & Installation

### Option 1: Standalone Windows Installer (`.exe`)
Download the single-file installer **`Modern PDF Viewer Setup 1.0.0.exe`** from the [Releases](https://github.com/00010999/pdf-Viewer/releases) section:
1. Double-click the `.exe` on any Windows PC.
2. It automatically installs the application, creates a desktop shortcut, and adds it to the Start Menu.
3. No internet connection or Node.js runtime required.

### Option 2: Run from Source

```bash
# Clone the repository
git clone https://github.com/00010999/pdf-Viewer.git
cd pdf-Viewer

# Install dependencies
npm install

# Run the desktop application
npm run app

# Build standalone distribution files
npm run dist

# Create standalone installer (.exe)
npm run package
```

---

## 🛠️ Tech Stack

- **Desktop Framework**: Electron 45
- **UI Architecture**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **PDF Rendering**: PDF.js (`pdfjs-dist`) with local offline worker & cmaps
- **PDF Manipulation**: `pdf-lib`
- **Packaging**: `electron-builder`
