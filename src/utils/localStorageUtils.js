// localStorage 관련 유틸리티 함수
export const saveSettingsToLocalStorage = (settings) => {
  try {
    localStorage.setItem('unitEditor_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('설정 저장 중 오류 발생:', error);
  }
};

export const loadSettingsFromLocalStorage = () => {
  try {
    const storedSettings = localStorage.getItem('unitEditor_settings');
    return storedSettings ? JSON.parse(storedSettings) : null;
  } catch (error) {
    console.error('설정 불러오기 중 오류 발생:', error);
    return null;
  }
};

export const getLastSavedPath = (key) => {
  try {
    const settings = loadSettingsFromLocalStorage();
    if (settings) {
      return settings[key] || '';
    }
    return '';
  } catch (error) {
    console.error(`마지막 저장 경로(${key}) 불러오기 중 오류 발생:`, error);
    return '';
  }
};
