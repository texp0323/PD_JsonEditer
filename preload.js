const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    loadUnits: () => ipcRenderer.invoke('load-units'),
    saveUnits: (units) => ipcRenderer.invoke('save-units', units),
    loadDefaultTemplate: () => ipcRenderer.invoke('load-default-template')
});