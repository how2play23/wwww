const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('arenaApp', {
  getArenaUrl: () => ipcRenderer.invoke('app:getArenaUrl'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
});
