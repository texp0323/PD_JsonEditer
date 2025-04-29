const { contextBridge, ipcRenderer } = require('electron');

// 안전한 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
    saveFile: (data) => ipcRenderer.invoke('save-file', data),
    readFile: (data) => ipcRenderer.invoke('read-file', data),
    showOpenDialog: () => ipcRenderer.invoke('show-open-dialog')
});