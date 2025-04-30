import React, { useState, useEffect } from 'react';
import UnitList from './UnitList';
import UnitDetail from './UnitDetail';
import TemplateEditor from './TemplateEditor';
import Settings from './Settings';
import TabNavigation from '../common/TabNavigation';
import { saveFile, saveTextFile, loadFileDialog, loadFileWeb } from '../../utils/fileUtils';
import { createUnitFromTemplate, applyTemplateToUnits, getNextUnitId } from '../../models/unitModel';
import { generateCSharpClass, formatClassName } from '../../utils/CSharpCodeGenerator';
import initialTemplate from '../../models/initialTemplate';
import { saveSettingsToLocalStorage, loadSettingsFromLocalStorage } from '../../utils/localStorageUtils';
import { validateAndRepairUnits, validateUnitAgainstTemplate } from '../../utils/templateValidationUtils';

const UnitEditor = () => {
    const [template, setTemplate] = useState(initialTemplate);
    const [units, setUnits] = useState([]);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [nextUnitId, setNextUnitId] = useState(1);
    const [activeTab, setActiveTab] = useState('unit'); // 'unit', 'template', 'settings'
    const [settings, setSettings] = useState({
        templatePath: './assets/data/template.json',
        unitDataPath: './assets/data/unitData.json',
        csharpClassPath: './Assets/Scripts/GameData/',
        csharpClassName: 'UnitData',
        csharpNamespace: 'GameData'
        // 자동 옵션 제거: 항상 활성화됨
    });
    
    // 검증 관련 상태 추가
    const [validationState, setValidationState] = useState({
        isValidating: false,
        hasMismatch: false,
        validationSummary: '',
        errorDetails: [],
        invalidUnitIds: []
    });
    
    // 초기화 함수 - 컴포넌트 마운트 시 실행
    useEffect(() => {
        initializeEditor();
    }, []);
    
    // 설정이 변경될 때마다 localStorage에 저장
    useEffect(() => {
        saveSettingsToLocalStorage(settings);
    }, [settings]);
    
    // 템플릿이나 유닛이 변경될 때마다 검증 수행
    useEffect(() => {
        if (units.length > 0 && template.fields) {
            validateUnitsAgainstTemplate();
        }
    }, [template, units]);
    
    // UnitEditor 초기화 함수
    const initializeEditor = async () => {
        // localStorage에서 설정 불러오기
        const savedSettings = loadSettingsFromLocalStorage();
        
        if (savedSettings) {
            // 저장된 설정이 있으면 적용
            setSettings(savedSettings);
            
            // 항상 자동 로드 실행
            await loadTemplateAndUnitData(savedSettings);
        }
    };
    
    // 유닛 데이터를 템플릿과 비교하여 검증
    const validateUnitsAgainstTemplate = () => {
        setValidationState(prev => ({ ...prev, isValidating: true }));
        
        // 검증 실행
        const validationResult = validateAndRepairUnits(units, template);
        
        // 불일치가 있는 경우
        if (validationResult.invalid.length > 0) {
            // 불일치 유닛 ID 목록 추출
            const invalidUnitIds = validationResult.invalid.map(item => item.unit.id);
            
            setValidationState({
                isValidating: false,
                hasMismatch: true,
                validationSummary: validationResult.validationSummary,
                errorDetails: validationResult.errorDetails,
                invalidUnitIds
            });
            
            // 항상 자동 수정 실행
            setUnits(validationResult.repaired);
            console.log("유닛 데이터가 템플릿과 일치하지 않아 자동으로 수정되었습니다.");
        } else {
            // 모든 유닛이 일치하는 경우
            setValidationState({
                isValidating: false,
                hasMismatch: false,
                validationSummary: validationResult.validationSummary,
                errorDetails: [],
                invalidUnitIds: []
            });
        }
    };
    
    // 선택된 유닛의 검증 상태 확인
    const getSelectedUnitValidationStatus = () => {
        const unit = getSelectedUnit();
        if (!unit) return null;
        
        return {
            isInvalid: validationState.invalidUnitIds.includes(unit.id),
            errors: validationState.errorDetails.filter(error => error.includes(unit.id))
        };
    };
    
    // 유닛 데이터 수동 복구
    const repairAllUnits = () => {
        if (units.length === 0 || !template.fields) return;
        
        const validationResult = validateAndRepairUnits(units, template);
        setUnits(validationResult.repaired);
        
        // 검증 상태 업데이트
        setValidationState(prev => ({
            ...prev,
            hasMismatch: false,
            validationSummary: '모든 유닛이 템플릿에 맞게 수정되었습니다.',
            errorDetails: [],
            invalidUnitIds: []
        }));
    };
    
    // 템플릿과 유닛 데이터 로드 함수
    const loadTemplateAndUnitData = async (currentSettings) => {
        try {
            let templateLoaded = false;
            
            // Electron 환경일 경우
            if (window.electronAPI) {
                // 템플릿 로드
                if (currentSettings.templatePath) {
                    templateLoaded = await loadTemplateFromPath(currentSettings.templatePath);
                }
                
                // 유닛 데이터 로드
                if (currentSettings.unitDataPath) {
                    await loadUnitDataFromPath(currentSettings.unitDataPath);
                }
            } else {
                // 웹 환경에서는 로컬 스토리지에 저장된 데이터가 있는지 확인
                const storedTemplate = localStorage.getItem('unitEditor_template');
                const storedUnitData = localStorage.getItem('unitEditor_unitData');
                
                if (storedTemplate) {
                    try {
                        const templateData = JSON.parse(storedTemplate);
                        setTemplate(templateData);
                        templateLoaded = true;
                    } catch (error) {
                        console.error('템플릿 데이터 파싱 오류:', error);
                    }
                }
                
                if (storedUnitData) {
                    try {
                        const unitData = JSON.parse(storedUnitData);
                        if (unitData && unitData.units) {
                            setUnits(unitData.units);
                            if (unitData.units.length > 0) {
                                setSelectedUnitId(unitData.units[0].id);
                                setNextUnitId(getNextUnitId(unitData.units));
                            }
                        }
                    } catch (error) {
                        console.error('유닛 데이터 파싱 오류:', error);
                    }
                }
            }
            
            // 로드 후 검증 실행 (템플릿이 로드된 경우에만)
            if (templateLoaded) {
                setTimeout(() => validateUnitsAgainstTemplate(), 500);
            }
        } catch (error) {
            console.error('데이터 로드 중 오류 발생:', error);
        }
    };
    
    // Electron 환경에서 경로로부터 템플릿 파일 로드
    const loadTemplateFromPath = async (path) => {
        try {
            const result = await window.electronAPI.readFile({ filePath: path });
            if (result.success) {
                const data = JSON.parse(result.content);
                if (data && data.fields) {
                    setTemplate(data);
                    return true;
                } else {
                    console.error('유효하지 않은 템플릿 형식');
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error('템플릿 파일 로드 오류:', error);
            return false;
        }
    };
    
    // Electron 환경에서 경로로부터 유닛 데이터 파일 로드
    const loadUnitDataFromPath = async (path) => {
        try {
            const result = await window.electronAPI.readFile({ filePath: path });
            if (result.success) {
                const data = JSON.parse(result.content);
                if (data && data.units) {
                    setUnits(data.units);
                    if (data.units.length > 0) {
                        setSelectedUnitId(data.units[0].id);
                        setNextUnitId(getNextUnitId(data.units));
                    }
                    return true;
                } else {
                    console.error('유효하지 않은 유닛 데이터 형식');
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error('유닛 데이터 파일 로드 오류:', error);
            return false;
        }
    };

    // 탭 설정
    const tabs = [
        { id: 'unit', label: '유닛 상세정보' },
        { id: 'template', label: '템플릿 편집기' },
        { id: 'settings', label: '설정' }
    ];

    // 유닛 추가
    const addUnit = () => {
        const id = `unit_${nextUnitId || 1}`;
        const newUnit = createUnitFromTemplate(template, id);
        newUnit.name = `Unit ${nextUnitId || 1}`;
        setUnits([...units, newUnit]);
        setNextUnitId((nextUnitId || 1) + 1);
        setSelectedUnitId(id);
    };

    // 유닛 삭제
    const deleteUnit = (id) => {
        const filteredUnits = units.filter(unit => unit.id !== id);
        setUnits(filteredUnits);
        if (selectedUnitId === id) {
            setSelectedUnitId(filteredUnits.length > 0 ? filteredUnits[0].id : null);
        }
    };

    // 선택된 유닛 가져오기
    const getSelectedUnit = () => {
        if (selectedUnitId === null) return null;
        return units.find(unit => unit.id === selectedUnitId) || null;
    };

    // 유닛 필드 업데이트
    const updateUnitField = (propertyName, value) => {
        let newSelectedId = selectedUnitId;
        
        const updatedUnits = units.map(unit => {
            if (unit.id === selectedUnitId) {
                if (propertyName === 'id') {
                    newSelectedId = value;
                }
                return { ...unit, [propertyName]: value };
            }
            return unit;
        });
        
        setUnits(updatedUnits);
        
        if (propertyName === 'id' && newSelectedId !== selectedUnitId) {
            setSelectedUnitId(newSelectedId);
        }
    };

    // 배열 아이템 추가
    const addArrayItem = (propertyName) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedArray = [...selectedUnit[propertyName], ""];
        updateUnitField(propertyName, updatedArray);
    };

    // 배열 아이템 제거
    const removeArrayItem = (propertyName, index) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedArray = [...selectedUnit[propertyName]];
        updatedArray.splice(index, 1);
        updateUnitField(propertyName, updatedArray);
    };

    // 배열 아이템 업데이트
    const updateArrayItem = (propertyName, index, value) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedArray = [...selectedUnit[propertyName]];
        updatedArray[index] = value;
        updateUnitField(propertyName, updatedArray);
    };

    // 딕셔너리 아이템 추가
    const addDictItem = (propertyName) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const newItem = { key: "", value: 0 };
        const updatedDictItems = [...selectedUnit[propertyName], newItem];
        updateUnitField(propertyName, updatedDictItems);
    };

    // 딕셔너리 아이템 제거
    const removeDictItem = (propertyName, index) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedDictItems = [...selectedUnit[propertyName]];
        updatedDictItems.splice(index, 1);
        updateUnitField(propertyName, updatedDictItems);
    };

    // 딕셔너리 아이템 업데이트
    const updateDictItem = (propertyName, index, field, value) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedDictItems = [...selectedUnit[propertyName]];
        updatedDictItems[index] = { ...updatedDictItems[index], [field]: value };
        updateUnitField(propertyName, updatedDictItems);
    };

    // 템플릿 필드 추가
    const addTemplateField = () => {
        const newField = {
            PropertyName: getUniquePropertyName("newProperty"),
            DataType: "string"
        };
        setTemplate({
            ...template,
            fields: [...template.fields, newField]
        });
    };

    // 템플릿 필드 제거
    const removeTemplateField = (index) => {
        const updatedFields = [...template.fields];
        updatedFields.splice(index, 1);
        setTemplate({
            ...template,
            fields: updatedFields
        });
    };

    // 템플릿 필드 업데이트
    const updateTemplateField = (index, field, value) => {
        const updatedFields = [...template.fields];
        
        // 속성 이름이 변경될 경우 중복 체크
        if (field === 'PropertyName') {
            // 중복된 속성 이름이 있는지 확인
            const isDuplicate = updatedFields.some((f, i) => 
                i !== index && f.PropertyName.toLowerCase() === value.toLowerCase()
            );
            
            if (isDuplicate) {
                alert(`속성 이름 "${value}"은(는) 이미 사용 중입니다. 다른 이름을 사용해 주세요.`);
                return; // 중복된 이름이면 업데이트 중단
            }
        }
        
        updatedFields[index] = {
            ...updatedFields[index],
            [field]: value
        };
        
        setTemplate({
            ...template,
            fields: updatedFields
        });
    };

    // 필드 위로 이동
    const moveFieldUp = (index) => {
        if (index <= 0) return; // 이미 맨 위의 필드라면 아무것도 하지 않음
        
        const updatedFields = [...template.fields];
        const temp = updatedFields[index];
        updatedFields[index] = updatedFields[index - 1];
        updatedFields[index - 1] = temp;
        
        setTemplate({
            ...template,
            fields: updatedFields
        });
    };

    // 필드 아래로 이동
    const moveFieldDown = (index) => {
        if (index >= template.fields.length - 1) return; // 이미 맨 아래 필드라면 아무것도 하지 않음
        
        const updatedFields = [...template.fields];
        const temp = updatedFields[index];
        updatedFields[index] = updatedFields[index + 1];
        updatedFields[index + 1] = temp;
        
        setTemplate({
            ...template,
            fields: updatedFields
        });
    };

    // 고유한 속성 이름 생성
    const getUniquePropertyName = (baseName) => {
        let name = baseName;
        let counter = 1;
        
        // 중복 이름이 있는지 확인하고 없을 때까지 숫자를 증가시킴
        while (template.fields.some(field => field.PropertyName.toLowerCase() === name.toLowerCase())) {
            name = `${baseName}${counter}`;
            counter++;
        }
        
        return name;
    };

    // 템플릿 변경사항 적용
    const applyTemplateChanges = () => {
        const updatedUnits = applyTemplateToUnits(units, template);
        setUnits(updatedUnits);
        // 템플릿 변경 후 검증 상태 초기화
        setValidationState({
            isValidating: false,
            hasMismatch: false,
            validationSummary: '템플릿이 모든 유닛에 적용되었습니다.',
            errorDetails: [],
            invalidUnitIds: []
        });
        setActiveTab('unit');
    };

    // 설정 업데이트
    const updateSettings = (field, value) => {
        const updatedSettings = {
            ...settings,
            [field]: value
        };
        setSettings(updatedSettings);
    };

    // 템플릿 저장
    const saveTemplate = async () => {
        if (window.electronAPI) {
            const result = await saveFile(settings.templatePath, template);
            if (result.success) {
                // 웹 환경에서도 사용할 수 있도록 localStorage에도 저장
                localStorage.setItem('unitEditor_template', JSON.stringify(template));
            }
            return result;
        } else {
            // 웹 환경에서는 localStorage에 저장 후 다운로드
            localStorage.setItem('unitEditor_template', JSON.stringify(template));
            const filename = settings.templatePath.split('/').pop();
            downloadFile(JSON.stringify(template, null, 2), filename);
            return { success: true };
        }
    };

    // 유닛 데이터 저장
    const saveUnitData = async () => {
        if (window.electronAPI) {
            const result = await saveFile(settings.unitDataPath, { units });
            if (result.success) {
                // 웹 환경에서도 사용할 수 있도록 localStorage에도 저장
                localStorage.setItem('unitEditor_unitData', JSON.stringify({ units }));
            }
            return result;
        } else {
            // 웹 환경에서는 localStorage에 저장 후 다운로드
            localStorage.setItem('unitEditor_unitData', JSON.stringify({ units }));
            const filename = settings.unitDataPath.split('/').pop();
            downloadFile(JSON.stringify({ units }, null, 2), filename);
            return { success: true };
        }
    };

    // 모든 데이터 저장
    const saveAllData = async () => {
        const templateResult = await saveTemplate();
        const unitDataResult = await saveUnitData();
        
        if (templateResult.success && unitDataResult.success) {
            alert('모든 데이터가 성공적으로 저장되었습니다.');
        } else {
            alert('일부 데이터 저장에 실패했습니다.');
        }
    };

    // 템플릿 파일 불러오기
    const loadTemplateFile = async (e) => {
        if (window.electronAPI) {
            const result = await loadFileDialog((data) => {
                if (data && data.fields) {
                    setTemplate(data);
                    // localStorage에도 저장
                    localStorage.setItem('unitEditor_template', JSON.stringify(data));
                    return true;
                } else {
                    alert('유효하지 않은 템플릿 형식입니다.');
                    return false;
                }
            });
            
            if (result && result.filePath) {
                updateSettings('templatePath', result.filePath);
            }
            
            // 템플릿을 불러온 후 자동으로 유닛 데이터 검증 실행
            setTimeout(() => validateUnitsAgainstTemplate(), 500);
        } else {
            const file = e.target.files[0];
            if (!file) return;

            loadFileWeb(file, (data) => {
                if (data && data.fields) {
                    setTemplate(data);
                    // localStorage에도 저장
                    localStorage.setItem('unitEditor_template', JSON.stringify(data));
                    
                    // 템플릿을 불러온 후 자동으로 유닛 데이터 검증 실행
                    setTimeout(() => validateUnitsAgainstTemplate(), 500);
                } else {
                    alert('유효하지 않은 템플릿 형식입니다.');
                }
            });
        }
    };

    // 유닛 데이터 파일 불러오기
    const loadUnitDataFile = async (e) => {
        if (window.electronAPI) {
            const result = await loadFileDialog((data) => {
                if (data && data.units) {
                    setUnits(data.units);
                    if (data.units.length > 0) {
                        setSelectedUnitId(data.units[0].id);
                        setNextUnitId(getNextUnitId(data.units));
                    }
                    // localStorage에도 저장
                    localStorage.setItem('unitEditor_unitData', JSON.stringify(data));
                    
                    // 검증 실행
                    setTimeout(() => validateUnitsAgainstTemplate(), 500);
                    
                    return true;
                } else {
                    alert('유효하지 않은 유닛 데이터 형식입니다.');
                    return false;
                }
            });
            
            if (result && result.filePath) {
                updateSettings('unitDataPath', result.filePath);
            }
        } else {
            const file = e.target.files[0];
            if (!file) return;

            loadFileWeb(file, (data) => {
                if (data && data.units) {
                    setUnits(data.units);
                    if (data.units.length > 0) {
                        setSelectedUnitId(data.units[0].id);
                        setNextUnitId(getNextUnitId(data.units));
                    }
                    // localStorage에도 저장
                    localStorage.setItem('unitEditor_unitData', JSON.stringify(data));
                    
                    // 검증 실행
                    setTimeout(() => validateUnitsAgainstTemplate(), 500);
                } else {
                    alert('유효하지 않은 유닛 데이터 형식입니다.');
                }
            });
        }
    };

    // C# 클래스 생성 및 저장
    const generateAndSaveCSharpClass = () => {
        try {
            const formattedClassName = formatClassName(settings.csharpClassName);
            const code = generateCSharpClass(
                template, 
                formattedClassName, 
                settings.csharpNamespace
            );
            
            // 파일 저장 경로 설정
            const filePath = `${settings.csharpClassPath}${formattedClassName}.cs`;
            
            // 파일 저장
            saveTextFile(filePath, code);
        } catch (error) {
            alert(`C# 클래스 생성 오류: ${error.message}`);
        }
    };

    // 웹 환경에서 파일 다운로드 (유틸 함수에서 가져오지만 여기에도 필요)
    const downloadFile = (content, filename) => {
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

    return (
        <div className="flex h-screen bg-gray-50">
            {/* 왼쪽 패널: 유닛 목록 */}
            <UnitList 
                units={units} 
                selectedUnitId={selectedUnitId} 
                onSelectUnit={setSelectedUnitId} 
                onAddUnit={addUnit} 
                onDeleteUnit={deleteUnit} 
                invalidUnitIds={validationState.invalidUnitIds} // 유효하지 않은 유닛 ID 전달
            />

            {/* 오른쪽 패널: 탭 컨텐츠 */}
            <div className="w-2-3 overflow-hidden flex flex-col" style={{ width: '66.667%', flexShrink: 0 }}>
                {/* 탭 메뉴 - 고정 위치 */}
                <div className="sticky top-0 z-10 bg-gray-50 border-b shadow-sm">
                    <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
                </div>

                {/* 탭 컨텐츠 컨테이너 - 스크롤 가능 */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        {/* 유닛 상세 정보 탭 */}
                        {activeTab === 'unit' && (
                            <UnitDetail 
                                unit={getSelectedUnit()} 
                                template={template}
                                onUpdateField={updateUnitField}
                                onAddArrayItem={addArrayItem}
                                onRemoveArrayItem={removeArrayItem}
                                onUpdateArrayItem={updateArrayItem}
                                onAddDictItem={addDictItem}
                                onRemoveDictItem={removeDictItem}
                                onUpdateDictItem={updateDictItem}
                                validationStatus={getSelectedUnitValidationStatus()} // 검증 상태 전달
                            />
                        )}

                        {/* 템플릿 편집기 탭 */}
                        {activeTab === 'template' && (
                            <TemplateEditor 
                                template={template}
                                onAddField={addTemplateField}
                                onRemoveField={removeTemplateField}
                                onUpdateField={updateTemplateField}
                                onMoveFieldUp={moveFieldUp}
                                onMoveFieldDown={moveFieldDown}
                                onApplyChanges={applyTemplateChanges}
                                onGenerateCSharpClass={generateAndSaveCSharpClass}
                                validationState={validationState} // 검증 상태 전달
                            />
                        )}

                        {/* 설정 탭 */}
                        {activeTab === 'settings' && (
                            <Settings 
                                settings={settings}
                                onUpdateSettings={updateSettings}
                                onSaveTemplate={saveTemplate}
                                onLoadTemplate={loadTemplateFile}
                                onSaveUnitData={saveUnitData}
                                onLoadUnitData={loadUnitDataFile}
                                onSaveAllData={saveAllData}
                                onGenerateCSharpClass={generateAndSaveCSharpClass}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitEditor;