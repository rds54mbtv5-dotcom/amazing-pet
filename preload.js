const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('petDesktop', {
  startDrag: () => ipcRenderer.send('pet:drag-start'),
  moveDrag: () => ipcRenderer.send('pet:drag-move'),
  endDrag: () => ipcRenderer.send('pet:drag-end'),
  openMenu: () => ipcRenderer.send('pet:menu')
});
