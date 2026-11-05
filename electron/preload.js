const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openPDFDialog: () => ipcRenderer.invoke('dialog:openPDF'),
  savePDFDialog: (options) => ipcRenderer.invoke('dialog:savePDF', options),
  getInitialFile: () => ipcRenderer.invoke('app:getInitialFile'),
  setThemeSource: (theme) => ipcRenderer.invoke('theme:setThemeSource', theme),
  isElectron: true,
});
