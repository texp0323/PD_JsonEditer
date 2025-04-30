const { contextBridge, ipcRenderer } = require('electron');

// Electron API를 웹 페이지에 노출시키기
contextBridge.exposeInMainWorld('electronAPI', {
    // 파일 저장 API
    saveFile: async (args) => {
        return await ipcRenderer.invoke('save-file', args);
    },
    
    // 파일 불러오기 다이얼로그 API
    showOpenDialog: async () => {
        return await ipcRenderer.invoke('show-open-dialog');
    },
    
    // 특정 경로의 파일 읽기 API (자동 로드에 필요)
    readFile: async (args) => {
        return await ipcRenderer.invoke('read-file', args);
    }
});

// Electron 환경임을 알리는 플래그 설정
contextBridge.exposeInMainWorld('isElectron', true);