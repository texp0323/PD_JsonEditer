// src/utils/fileUtils.js - readFile 함수 추가

// 파일 저장 (Electron 환경)
export const saveFile = async (filePath, content) => {
    try {
        // Electron 환경에서 electronAPI 사용
        if (window.electronAPI) {
            // 객체를 JSON 문자열로 변환 (pretty-print)
            const jsonContent = JSON.stringify(content, null, 2);
            
            const result = await window.electronAPI.saveFile({
                filePath,
                content: jsonContent
            });

            if (result.success) {
                console.log(`File saved successfully: ${filePath}`);
                // 웹 환경에서도 사용할 수 있도록 localStorage에도 저장
                if (filePath.includes('template')) {
                    localStorage.setItem('unitEditor_template', jsonContent);
                } else if (filePath.includes('unitData')) {
                    localStorage.setItem('unitEditor_unitData', jsonContent);
                }
                return { success: true };
            } else {
                console.error(`File save failed: ${result.error}`);
                return { success: false, error: result.error };
            }
        } else {
            // 웹 환경에서는 다운로드로 처리
            const jsonContent = JSON.stringify(content, null, 2);
            
            // localStorage에 저장
            if (filePath.includes('template')) {
                localStorage.setItem('unitEditor_template', jsonContent);
            } else if (filePath.includes('unitData')) {
                localStorage.setItem('unitEditor_unitData', jsonContent);
            }
            
            const filename = filePath.split('/').pop();
            downloadFile(jsonContent, filename);
            return { success: true };
        }
    } catch (error) {
        console.error(`File save error: ${error.message}`);
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
                console.log(`File saved successfully: ${filePath}`);
                return { success: true };
            } else {
                console.error(`File save failed: ${result.error}`);
                return { success: false, error: result.error };
            }
        } else {
            // 웹 환경에서는 다운로드로 처리
            downloadFile(content, filePath.split('/').pop());
            return { success: true };
        }
    } catch (error) {
        console.error(`File save error: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// 파일 읽기 함수 (이전 구현에서 빠진 부분)
export const readFile = async (filePath) => {
    try {
        if (window.electronAPI) {
            console.log(`Reading file: ${filePath}`);
            const result = await window.electronAPI.readFile({ filePath });
            return result;
        } else {
            // 웹 환경에서는 localStorage에서 시도
            if (filePath.includes('template')) {
                const content = localStorage.getItem('unitEditor_template');
                return content 
                    ? { success: true, content } 
                    : { success: false, error: 'File not found in localStorage' };
            } else if (filePath.includes('unitData')) {
                const content = localStorage.getItem('unitEditor_unitData');
                return content 
                    ? { success: true, content } 
                    : { success: false, error: 'File not found in localStorage' };
            }
            
            return { success: false, error: 'File not found and not in localStorage' };
        }
    } catch (error) {
        console.error(`Error reading file: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// 웹 환경에서 파일 다운로드
export const downloadFile = (content, filename) => {
    const blob = new Blob([content], { 
        type: filename.endsWith('.json') ? 'application/json' : 'text/plain' 
    });
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
                try {
                    const data = JSON.parse(result.content);
                    const isValid = callback(data);
                    
                    if (isValid) {
                        // 성공적으로 불러온 경우 localStorage에도 저장
                        if (result.filePath.includes('template')) {
                            localStorage.setItem('unitEditor_template', result.content);
                        } else if (result.filePath.includes('unitData')) {
                            localStorage.setItem('unitEditor_unitData', result.content);
                        }
                    }
                    
                    return isValid ? { success: true, filePath: result.filePath } : { success: false };
                } catch (parseError) {
                    console.error('JSON 파싱 오류:', parseError);
                    alert(`파일 형식 오류: ${parseError.message}`);
                    return { success: false, error: parseError.message };
                }
            }
            return { success: false, canceled: true };
        }
    } catch (error) {
        console.error(`파일 불러오기 오류: ${error.message}`);
        alert(`파일 불러오기 오류: ${error.message}`);
        return { success: false, error: error.message };
    }
    return null;
};

// 웹 환경에서 파일 불러오기
export const loadFileWeb = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            const data = JSON.parse(content);
            const isValid = callback(data);
            
            if (isValid) {
                // 성공적으로 불러온 경우 localStorage에도 저장
                if (file.name.includes('template')) {
                    localStorage.setItem('unitEditor_template', content);
                } else if (file.name.includes('unitData')) {
                    localStorage.setItem('unitEditor_unitData', content);
                }
            }
        } catch (error) {
            console.error('파일 파싱 오류:', error);
            alert(`파일 형식 오류: ${error.message}`);
        }
    };
    reader.readAsText(file);
};

// 파일 존재 여부 확인 (Electron 환경)
export const fileExists = async (filePath) => {
    if (window.electronAPI) {
        try {
            const result = await window.electronAPI.fileExists(filePath);
            return result.exists;
        } catch (error) {
            console.error(`파일 존재 확인 오류: ${error.message}`);
            return false;
        }
    }
    return false;
};