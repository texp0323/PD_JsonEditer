// 파일 저장 (Electron 환경)
export const saveFile = async (filePath, content) => {
    try {
        // Electron 환경에서 electronAPI 사용
        if (window.electronAPI) {
            const result = await window.electronAPI.saveFile({
                filePath,
                content: JSON.stringify(content, null, 2)
            });

            if (result.success) {
                alert(`File saved successfully: ${filePath}`);
                return { success: true };
            } else {
                alert(`File save failed: ${result.error}`);
                return { success: false, error: result.error };
            }
        } else {
            // 웹 환경에서는 다운로드로 처리
            downloadFile(JSON.stringify(content, null, 2), filePath.split('/').pop());
            return { success: true };
        }
    } catch (error) {
        alert(`File save error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// 텍스트 파일 저장 (C# 클래스 등)
export const saveTextFile = async (filePath, content) => {
    try {
        if (window.electronAPI) {
            const result = await window.electronAPI.saveFile({
                filePath,
                content: content
            });

            if (result.success) {
                alert(`File saved successfully: ${filePath}`);
                return { success: true };
            } else {
                alert(`File save failed: ${result.error}`);
                return { success: false, error: result.error };
            }
        } else {
            // 웹 환경에서는 다운로드로 처리
            downloadFile(content, filePath.split('/').pop());
            return { success: true };
        }
    } catch (error) {
        alert(`File save error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// 웹 환경에서 파일 다운로드
export const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// 파일 다이얼로그로 파일 불러오기 (Electron 환경)
export const loadFileDialog = async (callback) => {
    try {
        if (window.electronAPI) {
            const result = await window.electronAPI.showOpenDialog();

            if (result.success && !result.canceled) {
                const data = JSON.parse(result.content);
                callback(data);
                return result.filePath;
            }
        }
    } catch (error) {
        alert(`File load error: ${error.message}`);
    }
    return null;
};

// 웹 환경에서 파일 불러오기
export const loadFileWeb = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            callback(data);
        } catch (error) {
            alert('File parse error: ' + error.message);
        }
    };
    reader.readAsText(file);
};