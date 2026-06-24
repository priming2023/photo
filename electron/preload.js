const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printReceipt: (imageDataUrl) => ipcRenderer.invoke('print-receipt', imageDataUrl),
  listPrinters: () => ipcRenderer.invoke('list-printers'),
});
