const { app, BrowserWindow, ipcMain, dialog, Menu, nativeTheme, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Determine file path when packaged into app.asar vs unpacked
function getAppPath(relativePath) {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), relativePath);
  }
  return path.join(__dirname, '..', relativePath);
}

function createWindow() {
  const preloadPath = app.isPackaged 
    ? path.join(app.getAppPath(), 'electron/preload.js')
    : path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Modern PDF Viewer',
    backgroundColor: '#fbfbfb',
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
    },
  });

  const indexPath = getAppPath('dist/index.html');

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load dist/index.html:', err);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('render-process-gone', (event, detailed) => {
    console.error('Render process gone:', detailed);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Check if app was launched by double clicking a PDF file in Windows (Open With)
function getArgvFile() {
  const args = process.argv.slice(1);
  for (const arg of args) {
    if (arg && arg.toLowerCase().endsWith('.pdf') && fs.existsSync(arg)) {
      return arg;
    }
  }
  return null;
}

// IPC: Native File Dialog to open PDF (returns fast Base64 chunk or buffer)
ipcMain.handle('dialog:openPDF', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select PDF Document',
    properties: ['openFile'],
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const fileBuffer = fs.readFileSync(filePath);
  // Transferring Base64 string is orders of magnitude faster and memory-friendly in Electron IPC than large Number arrays!
  return {
    filePath,
    fileName: path.basename(filePath),
    fileBase64: fileBuffer.toString('base64'),
    fileSize: fileBuffer.length,
  };
});

// IPC: Get file passed via CLI or "Open with"
ipcMain.handle('app:getInitialFile', async () => {
  const filePath = getArgvFile();
  if (filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return {
        filePath,
        fileName: path.basename(filePath),
        fileBase64: fileBuffer.toString('base64'),
        fileSize: fileBuffer.length,
      };
    } catch (e) {
      console.error('Failed reading initial file', e);
    }
  }
  return null;
});

// IPC: Native File Dialog to save PDF
ipcMain.handle('dialog:savePDF', async (event, { defaultName, fileBase64, fileBytes }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save PDF Document',
    defaultPath: defaultName || 'document_edited.pdf',
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
  });

  if (result.canceled || !result.filePath) {
    return false;
  }

  if (fileBase64) {
    fs.writeFileSync(result.filePath, Buffer.from(fileBase64, 'base64'));
  } else if (fileBytes) {
    fs.writeFileSync(result.filePath, Buffer.from(fileBytes));
  }
  return true;
});

// IPC: Synchronize native OS window theme (Dark/Light/System)
ipcMain.handle('theme:setThemeSource', async (event, theme) => {
  if (['light', 'dark', 'system'].includes(theme)) {
    nativeTheme.themeSource = theme;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBackgroundColor(theme === 'dark' ? '#0c0d0e' : '#fbfbfb');
    }
  }
  return true;
});

app.whenReady().then(async () => {
  if (session && session.defaultSession) {
    try {
      await session.defaultSession.clearStorageData({
        storages: ['serviceworkers']
      });
    } catch (e) {
      // ignore
    }
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
