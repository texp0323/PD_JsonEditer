let units = [];
let template = {};
let selectedIndex = -1;

const unitList = document.getElementById('unit-list');
const unitInfo = document.getElementById('unit-info');
const addUnitBtn = document.getElementById('add-unit');
const deleteUnitBtn = document.getElementById('delete-unit');
const syncTemplateBtn = document.getElementById('sync-template');

document.addEventListener('DOMContentLoaded', async () => {
    units = await window.api.loadUnits();
    template = await window.api.loadDefaultTemplate();
    console.log("기본 템플릿 로드됨:", template); //

    // 데이터 로드 시 문자열화된 JSON 객체/배열 파싱 시도 (더 안전하게)
    units.forEach(unit => {
        Object.keys(unit).forEach(key => {
            if (typeof unit[key] === 'string') {
                const trimmed = unit[key].trim();
                if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                    try {
                        unit[key] = JSON.parse(trimmed); // 파싱 성공 시 객체/배열로 대체
                    } catch (e) {
                        // 파싱 실패 시 원본 문자열 유지
                        console.warn(`Failed to parse JSON string for key '${key}':`, unit[key], e); //
                    }
                }
            }
        });
    }); //

    // 템플릿과 유닛 구조 동기화
    if (units.length > 0 && template.fields && template.fields.length > 0) {
        synchronizeUnitsWithTemplate(); //
    }

    renderUnitList(); //
    updateSaveButtonVisibility(); //

    // 컨텍스트 메뉴가 열려있을 때 페이지 스크롤 시 메뉴 닫기
    document.addEventListener('scroll', () => {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }
    }); //

    // ESC 키 누를 때 열려있는 컨텍스트 메뉴 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const existingMenu = document.querySelector('.context-menu');
            if (existingMenu) {
                document.body.removeChild(existingMenu);
            }
        }
    }); //
});

addUnitBtn.addEventListener('click', async () => {
    // 템플릿이 비어있지 않은지 확인
    if (!template.fields || template.fields.length === 0) {
        showNotification('템플릿을 찾을 수 없습니다. template.json 파일을 확인해주세요.', true); //
        return;
    }

    // 새 유닛 객체 생성 (id는 먼저 추가)
    const nextId = getNextUnitId(); //
    const newUnit = {
        id: nextId.toString() //
    };

    // 템플릿의 각 필드에 대해 기본값 설정
    template.fields.forEach(field => {
        const propName = field.PropertyName;
        if (propName !== 'id') {
            newUnit[propName] = getDefaultValue(field.DataType, propName); // getDefaultValue 함수 수정 반영됨
        }
    }); //

    units.push(newUnit); //
    selectUnit(units.length - 1);  // 새로 추가된 유닛 선택
    renderUnitList(); //
    showNotification('새 유닛이 추가되었습니다!'); //
}); //

deleteUnitBtn.addEventListener('click', () => {
    if (selectedIndex === -1) {
        showNotification('삭제할 유닛을 먼저 선택해주세요.', true); //
        return;
    }

    if (confirm(`정말로 "${units[selectedIndex].name || units[selectedIndex].id}" 유닛을 삭제하시겠습니까?`)) { //
        // 선택된 유닛 삭제
        const deletedName = units[selectedIndex].name || units[selectedIndex].id; //
        units.splice(selectedIndex, 1); //

        // 선택 인덱스 재설정
        if (units.length === 0) {
            selectedIndex = -1; //
            unitInfo.innerHTML = ''; //
            updateSaveButtonVisibility(); // 저장 버튼 숨김
        } else {
            // 마지막 항목이 삭제된 경우 이전 항목 선택
            if (selectedIndex >= units.length) {
                selectedIndex = units.length - 1; //
            }
            // 삭제 후 현재 인덱스가 유효하면 해당 유닛 선택, 아니면 이전 유닛 선택
            if (selectedIndex < 0 && units.length > 0) selectedIndex = 0; //

            if(selectedIndex >= 0) {
                selectUnit(selectedIndex); //
            } else {
                unitInfo.innerHTML = ''; // 목록이 비었으면 정보 패널 클리어
                updateSaveButtonVisibility(); //
            }
        }

        renderUnitList(); //
        showNotification(`"${deletedName}" 유닛이 삭제되었습니다.`); //
    }
}); //


syncTemplateBtn.addEventListener('click', () => {
    if (units.length === 0) {
        showNotification('동기화할 유닛이 없습니다.', true); //
        return;
    }

    if (!template.fields || template.fields.length === 0) {
        showNotification('템플릿을 찾을 수 없습니다. template.json 파일을 확인해주세요.', true); //
        return;
    }

    if (confirm('모든 유닛을 템플릿 구조와 동기화하시겠습니까? 템플릿에 없는 필드는 삭제되고, 템플릿에 있는 필드는 추가됩니다.')) { //
        synchronizeUnitsWithTemplate(); //

        // 현재 선택된 유닛이 있으면 정보 다시 렌더링
        if (selectedIndex !== -1 && selectedIndex < units.length) {
            renderUnitInfo(units[selectedIndex]); //
        } else if (selectedIndex >= units.length && units.length > 0) {
            // 동기화 후 선택 인덱스가 범위를 벗어났지만 유닛이 남아있는 경우
            selectedIndex = units.length - 1; //
            selectUnit(selectedIndex); //
        } else {
            // 동기화 후 유닛이 없거나 선택이 이상한 경우
            selectedIndex = -1; //
            unitInfo.innerHTML = ''; //
            updateSaveButtonVisibility(); //
        }

        renderUnitList(); //
    }
}); //

// 저장 버튼 이벤트 핸들러
document.getElementById('right-panel').addEventListener('click', (e) => {
    if (e.target && e.target.id === 'saveButton') {
        // 모든 유닛의 값이 데이터 타입에 맞는지 검증
        const validationResult = validateAllUnits(); //

        if (!validationResult.isValid) {
            const message = `다음 유닛의 필드가 올바르지 않습니다:\n${validationResult.errors.join('\n')}`; //
            if (!confirm(`${message}\n\n일부 데이터가 유효하지 않아 저장 시 유실될 수 있습니다. 그래도 저장하시겠습니까?`)) { //
                return;
            }
            // 경고 후 저장 진행 (사용자 선택)
        }

        // main.js에서 JSON.stringify를 처리하므로 원본 객체/배열 포함 데이터를 그대로 전달
        const dataToSave = units; //

        window.api.saveUnits(dataToSave) //
            .then(() => {
                showNotification('유닛이 성공적으로 저장되었습니다!'); //
            })
            .catch((error) => {
                console.error('유닛 저장 실패:', error); //
                showNotification('유닛 저장에 실패했습니다!', true); //
            });
    }
}); //


// 모든 유닛의 필드값이 템플릿의 데이터 타입 및 유효한 JSON 형식에 맞는지 검증
function validateAllUnits() {
    const errors = []; //
    let isValid = true; //

    units.forEach((unit, unitIndex) => {
        // 템플릿 기반 검증 (템플릿이 있는 경우)
        if (template.fields) {
            template.fields.forEach(field => {
                const propName = field.PropertyName; //
                const dataType = field.DataType; // 원본 데이터 타입 사용
                const value = unit[propName]; //

                if (propName in unit) { // 유닛에 해당 필드가 있을 때만 검증
                    if (!validateDataType(value, dataType)) { //
                        errors.push(`유닛 ${unit.id}(${unit.name || '이름 없음'}): '${propName}' 필드의 값이 ${dataType} 타입이 아닙니다.`); //
                        isValid = false; //
                    }
                }
            }); //
        } else { // 템플릿 없는 경우: 기본 타입 검증
            // (필요하다면 여기서도 숫자형 문자열, boolean 문자열 등을 검증할 수 있음)
        }
    }); //

    return { isValid, errors }; //
}

// 주어진 값이 지정된 데이터 타입에 맞는지 검증
function validateDataType(value, templateDataType) {
    const dataType = templateDataType.toLowerCase(); //

    if (value === null || value === undefined) {
        return true; // null 또는 undefined는 허용 (값이 없는 상태)
    }

    switch (dataType) {
        case 'string':
            return true; //
        case 'int':
        case 'integer':
            return (typeof value === 'number' && Number.isInteger(value)) ||
                (typeof value === 'string' && /^-?\d+$/.test(value)); //
        case 'float':
        case 'number':
            return typeof value === 'number' ||
                (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)); //
        case 'bool':
        case 'boolean':
            return typeof value === 'boolean' ||
                (typeof value === 'string' && (value === 'true' || value === 'false')); //
        case 'array':
            // 실제 배열인지만 확인 (textarea에서 편집 중인 문자열은 검증 어려움)
            return Array.isArray(value); //
        case 'dict_kv':
            // 특정 key-value 형태 객체 확인
            return typeof value === 'object' && value !== null && !Array.isArray(value) &&
                'key' in value && typeof value.key === 'string' &&
                'value' in value && typeof value.value === 'number' &&
                Object.keys(value).length === 2; //
        // ***** 새로운 타입 유효성 검사 추가 (선택적) *****
        case 'array_dict_kv':
            if (!Array.isArray(value)) return false;
            // 배열의 모든 요소가 dict_kv 형식인지 확인
            return value.every(item => validateDataType(item, 'dict_kv'));
        // ***** 끝 *****
        case 'object':
        case 'dict':
        case 'dictionary':
            // 실제 객체 (배열 제외) 인지만 확인
            return typeof value === 'object' && value !== null && !Array.isArray(value); //
        default:
            console.warn("Unknown data type for validation:", dataType); //
            return true; // 알 수 없는 타입은 유효하다고 가정
    }
}


// 템플릿에서 특정 속성 이름에 대한 데이터 타입 찾기
function findDataTypeForProperty(propertyName) {
    if (!template.fields) return typeof units[selectedIndex][propertyName]; //

    const field = template.fields.find(f => f.PropertyName === propertyName); //
    return field ? field.DataType : (typeof units[selectedIndex][propertyName]); //
}


function showNotification(message, isError = false) {
    const notification = document.createElement('div'); //
    notification.className = `notification ${isError ? 'error' : 'success'}`; //
    notification.textContent = message; //

    document.body.appendChild(notification); //

    // 3초 후 알림 제거
    setTimeout(() => {
        notification.classList.add('fade-out'); //
        setTimeout(() => {
            if (document.body.contains(notification)) { // 노드가 아직 존재하는지 확인 후 제거
                document.body.removeChild(notification); //
            }
        }, 500); //
    }, 3000); //
}

function updateSaveButtonVisibility() {
    const saveButtonContainer = document.getElementById('save-button-container'); //
    if (!saveButtonContainer) return;

    if (selectedIndex === -1 || selectedIndex >= units.length) { // 유효한 선택이 아닐 때
        saveButtonContainer.classList.add('hidden'); //
    } else {
        saveButtonContainer.classList.remove('hidden'); //
    }
}

function renderUnitList() {
    unitList.innerHTML = '';  // 기존 목록 초기화

    if (units.length === 0) {
        const emptyMessage = document.createElement('div'); //
        emptyMessage.className = 'empty-message'; //
        emptyMessage.textContent = '유닛이 없습니다. 추가해주세요.'; //
        unitList.appendChild(emptyMessage); //
        return;
    }

    units.forEach((unit, index) => {
        const div = document.createElement('div'); //
        div.textContent = `${unit.name || `ID: ${unit.id}`}`; // 이름 없으면 ID 표시
        div.classList.add('unit-item'); //

        // 선택된 유닛에 클래스 추가
        if (index === selectedIndex) {
            div.classList.add('selected'); //
        }

        // 유닛 선택을 위한 클릭 이벤트 추가
        div.addEventListener('click', () => {
            selectUnit(index); //
        });

        // 컨텍스트 메뉴(우클릭) 이벤트 추가
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault(); //

            // 현재 열려있는 컨텍스트 메뉴 제거
            const existingMenu = document.querySelector('.context-menu'); //
            if (existingMenu) {
                document.body.removeChild(existingMenu); //
            }

            // 선택되지 않은 유닛이면 먼저 선택
            if (index !== selectedIndex) {
                selectUnit(index); //
            }

            // 컨텍스트 메뉴 생성
            const contextMenu = document.createElement('div'); //
            contextMenu.className = 'context-menu'; //

            // 삭제 옵션 추가
            const deleteOption = document.createElement('div'); //
            deleteOption.className = 'menu-item delete-item'; // 클래스 추가
            deleteOption.textContent = '유닛 삭제'; //
            deleteOption.addEventListener('click', () => {
                if (confirm(`정말로 "${unit.name || unit.id}" 유닛을 삭제하시겠습니까?`)) { //
                    const deletedName = unit.name || unit.id; //
                    const originalIndex = index; // 삭제 전 인덱스 저장

                    units.splice(originalIndex, 1); // 저장된 인덱스로 삭제

                    // 선택 인덱스 재설정
                    if (units.length === 0) {
                        selectedIndex = -1; //
                        unitInfo.innerHTML = ''; //
                        updateSaveButtonVisibility(); //
                    } else {
                        // 삭제 후 현재 인덱스가 유효하면 해당 유닛 선택, 아니면 이전 유닛 선택
                        if (originalIndex >= units.length) { // 마지막 항목 삭제 시
                            selectedIndex = units.length - 1; //
                        } else { // 중간 항목 삭제 시, 삭제된 위치의 새 항목 선택
                            selectedIndex = originalIndex; //
                        }
                        selectUnit(selectedIndex); //
                    }
                    renderUnitList(); // 목록 다시 렌더링
                    showNotification(`"${deletedName}" 유닛이 삭제되었습니다.`); //
                }
                if(document.body.contains(contextMenu)) document.body.removeChild(contextMenu); //
            });


            contextMenu.appendChild(deleteOption); //

            // 복제 옵션 추가
            const duplicateOption = document.createElement('div'); //
            duplicateOption.className = 'menu-item'; //
            duplicateOption.textContent = '유닛 복제'; //
            duplicateOption.addEventListener('click', () => {
                // 현재 유닛 복제 (깊은 복사)
                const clonedUnit = JSON.parse(JSON.stringify(unit)); //
                clonedUnit.id = getNextUnitId().toString(); //
                if (clonedUnit.name) {
                    clonedUnit.name = `${clonedUnit.name} (복제)`; //
                } else {
                    clonedUnit.name = `복제된 유닛 (${clonedUnit.id})`; //
                }

                // 복제된 유닛을 현재 유닛 바로 다음에 추가
                units.splice(index + 1, 0, clonedUnit); //

                selectUnit(index + 1); // 새로 복제된 유닛 선택
                renderUnitList(); //
                showNotification(`"${unit.name || unit.id}"의 복제본이 생성되었습니다.`); //
                if(document.body.contains(contextMenu)) document.body.removeChild(contextMenu); //
            });

            contextMenu.appendChild(duplicateOption); //

            // 콘텍스트 메뉴에 템플릿 동기화 옵션 추가 (선택된 유닛 대상)
            const syncOption = document.createElement('div'); //
            syncOption.className = 'menu-item'; //
            syncOption.textContent = '템플릿과 동기화'; //
            syncOption.addEventListener('click', () => {
                if (selectedIndex !== -1) {
                    synchronizeUnitWithTemplate(selectedIndex, true); // 선택된 유닛 동기화
                }
                if(document.body.contains(contextMenu)) document.body.removeChild(contextMenu); //
            });

            contextMenu.appendChild(syncOption); //

            // 메뉴 위치 설정
            contextMenu.style.top = `${e.pageY}px`; //
            contextMenu.style.left = `${e.pageX}px`; //

            // 메뉴를 body에 추가
            document.body.appendChild(contextMenu); //

            // 다른 곳 클릭 시 메뉴 닫기
            document.addEventListener('click', function closeMenuOnClick(event) {
                // 컨텍스트 메뉴 자체가 아닌 다른 곳을 클릭했을 때 닫기
                if (contextMenu && !contextMenu.contains(event.target)) {
                    if (document.body.contains(contextMenu)) {
                        document.body.removeChild(contextMenu); //
                    }
                    document.removeEventListener('click', closeMenuOnClick); // 리스너 제거
                }
            }); //
        }); //

        unitList.appendChild(div); //
    }); //
}

function selectUnit(index) {
    if (index >= 0 && index < units.length) {
        selectedIndex = index; //
        renderUnitList(); // 목록에서 선택 표시 업데이트
        renderUnitInfo(units[index]); // 정보 패널 업데이트
        updateSaveButtonVisibility(); // 저장 버튼 표시
    } else {
        // 유효하지 않은 인덱스 처리 (예: 목록이 비었을 때)
        selectedIndex = -1; //
        renderUnitList(); // 선택 해제 표시
        unitInfo.innerHTML = '<div class="empty-message">유닛을 선택해주세요.</div>'; // 정보 패널 초기화
        updateSaveButtonVisibility(); // 저장 버튼 숨김
    }
}


function renderUnitInfo(unit) {
    unitInfo.innerHTML = ''; // 정보 패널 초기화

    // 템플릿 필드 순서 또는 객체 키 순서 결정
    const propertyOrder = template.fields ? template.fields.map(f => f.PropertyName) : Object.keys(unit); //
    const renderedProps = new Set(); //

    // 1. ID 필드 먼저 렌더링 (항상)
    if ('id' in unit) {
        createField('id', unit['id'], 'string'); // ID는 항상 문자열 취급
        renderedProps.add('id'); //
    }

    // 2. 템플릿 순서대로 필드 렌더링 (템플릿이 있다면)
    if (template.fields) {
        template.fields.forEach(field => {
            const propName = field.PropertyName; //
            // ID가 아니고, 유닛에 실제로 해당 속성이 있는 경우 렌더링
            if (propName !== 'id' && propName in unit) {
                createField(propName, unit[propName], field.DataType); // createField 함수 수정 반영됨
                renderedProps.add(propName); //
            }
            // 템플릿에 있지만 유닛에 없는 필드는 렌더링하지 않음 (동기화로 추가될 수는 있음)
        }); //
    }

    // 3. 템플릿에 없거나 템플릿 자체가 없는 경우, 나머지 필드들을 렌더링
    Object.keys(unit).forEach(propName => {
        if (!renderedProps.has(propName)) {
            // 템플릿 정보가 없으므로 데이터 타입을 추정하거나 기본 'string'으로 처리
            let inferredDataType = 'string'; // 기본값
            const value = unit[propName]; //
            if (Array.isArray(value)) {
                // ***** array_dict_kv 추론 로직 추가 *****
                const isArrayOfDictKV = value.length > 0 && typeof value[0] === 'object' && value[0] !== null &&
                    'key' in value[0] && typeof value[0].key === 'string' &&
                    'value' in value[0] && typeof value[0].value === 'number' &&
                    Object.keys(value[0]).length === 2;
                if (isArrayOfDictKV) {
                    inferredDataType = 'array_dict_kv'; // 추론 결과 반영
                } else {
                    inferredDataType = 'array'; //
                }
                // ***** 끝 *****
            } else if (typeof value === 'object' && value !== null) {
                // 특정 딕셔너리 형태인지 추가 확인 가능
                if ('key' in value && typeof value.key === 'string' &&
                    'value' in value && typeof value.value === 'number' &&
                    Object.keys(value).length === 2) {
                    inferredDataType = 'dict_kv'; //
                } else {
                    inferredDataType = 'object'; //
                }
            } else if (typeof value === 'boolean') {
                inferredDataType = 'boolean'; //
            } else if (typeof value === 'number') {
                inferredDataType = Number.isInteger(value) ? 'integer' : 'float'; //
            }
            // 추론된 타입으로 필드 생성 (DataType은 추론값 전달)
            createField(propName, value, inferredDataType); // createField 함수 수정 반영됨
        }
    }); //
}

// ***** createField 함수 수정 *****
function createField(key, value, declaredDataType) {
    const fieldDiv = document.createElement('div'); //
    fieldDiv.className = 'field-container'; //

    const label = document.createElement('label'); //
    label.textContent = key; //
    label.className = 'field-label'; //

    let actualDataType = declaredDataType ? declaredDataType.toLowerCase() : 'string'; // 선언된 타입 우선
    // 실제 데이터 타입 추론 (선언된 타입과 다를 수 있음, UI 결정에 사용)
    let uiDataType = actualDataType; // UI 생성에 사용할 타입 결정

    // --- 데이터 타입 추론 및 UI 타입 결정 로직 ---
    if (Array.isArray(value)) {
        // 배열의 첫번째 요소가 dict_kv 형태인지 확인하여 array_dict_kv 타입 추론 (선택적 강화)
        const isArrayOfDictKV = value.length > 0 && typeof value[0] === 'object' && value[0] !== null &&
            'key' in value[0] && typeof value[0].key === 'string' &&
            'value' in value[0] && typeof value[0].value === 'number' &&
            Object.keys(value[0]).length === 2;

        if (actualDataType === 'array_dict_kv' || (actualDataType === 'array' && isArrayOfDictKV) ) {
            uiDataType = 'array_dict_kv'; // 명시적 또는 추론에 의해 결정
        } else {
            uiDataType = 'array'; // 그 외 배열은 일반 배열로 처리
        }
    } else if (typeof value === 'object' && value !== null) {
        // 기존 dict_kv 추론 로직 유지
        if (actualDataType === 'dict_kv' || ('key' in value && typeof value.key === 'string' &&
            'value' in value && typeof value.value === 'number' &&
            Object.keys(value).length === 2)) {
            uiDataType = 'dict_kv'; //
        } else {
            uiDataType = 'object'; // 일반 객체
        }
    } else if (typeof value === 'boolean') {
        uiDataType = 'boolean'; //
    } else if (typeof value === 'number') {
        uiDataType = Number.isInteger(value) ? 'integer' : 'float'; //
    } else if (value === null || value === undefined) {
        // 값 없는 경우 uiDataType는 declaredDataType 유지
    } else if (typeof value === 'string') {
        uiDataType = 'string'; //
    }


    const typeIndicator = document.createElement('span'); //
    typeIndicator.className = 'type-indicator'; //
    // declaredDataType이 있으면 그것을, 없으면 uiDataType(추론값) 표시
    typeIndicator.textContent = ` [${declaredDataType || uiDataType}]`; //
    label.appendChild(typeIndicator); //

    fieldDiv.appendChild(label); //

    let inputElementContainer = document.createElement('div'); // 입력 요소들을 담을 컨테이너
    inputElementContainer.className = 'field-input-wrapper'; // Wrapper 클래스 추가

    // --- UI 생성 로직 분기 ---
    // ID 필드 (읽기 전용)
    if (key === 'id') {
        const input = document.createElement('input'); //
        input.value = value !== undefined && value !== null ? value : ''; //
        input.className = 'field-input read-only'; //
        input.readOnly = true; //
        inputElementContainer.appendChild(input); //
    }
    // ***** 새로운 타입 처리 추가 *****
    else if (uiDataType === 'array_dict_kv') {
        inputElementContainer = createArrayOfDictKV_UI(key, value); // 새 UI 함수 호출
    }
        // ***** 끝 *****
    // 배열 타입 처리
    else if (uiDataType === 'array') {
        // createArrayFieldUI가 div를 반환하므로 바로 할당
        inputElementContainer = createArrayFieldUI(key, value); //
    }
    // 특정 Key-Value 딕셔너리 타입 처리
    else if (uiDataType === 'dict_kv') {
        // createDictKVFieldUI가 div를 반환하므로 바로 할당
        inputElementContainer = createDictKVFieldUI(key, value); //
    }
    // 일반 객체 타입 처리 (textarea 사용)
    else if (uiDataType === 'object') {
        // createObjectTextareaUI가 div를 반환하므로 바로 할당
        inputElementContainer = createObjectTextareaUI(key, value); //
    }
    // 불리언 타입 처리 (select)
    else if (uiDataType === 'boolean') {
        const select = document.createElement('select'); //
        select.className = 'field-input'; //
        const optTrue = document.createElement('option'); //
        optTrue.value = 'true'; //
        optTrue.textContent = 'true'; //
        const optFalse = document.createElement('option'); //
        optFalse.value = 'false'; //
        optFalse.textContent = 'false'; //
        select.appendChild(optTrue); //
        select.appendChild(optFalse); //
        // 값 비교 시 문자열 변환 및 소문자 비교
        select.value = String(value).toLowerCase() === 'true' ? 'true' : 'false'; //
        select.addEventListener('change', (e) => {
            // 실제 boolean 값으로 저장하도록 변경
            units[selectedIndex][key] = (e.target.value === 'true'); //
        }); //
        inputElementContainer.appendChild(select); //
    }
    // 숫자 타입 처리 (input type=number)
    else if (uiDataType === 'integer' || uiDataType === 'float' || uiDataType === 'number') {
        const input = document.createElement('input'); //
        input.type = 'number'; //
        if (uiDataType === 'float' || uiDataType === 'number') {
            input.step = 'any'; // 실수 허용
        } else {
            input.step = '1'; // 정수만
        }
        input.value = value !== undefined && value !== null ? value : ''; //
        input.className = 'field-input'; //
        input.addEventListener('input', (e) => {
            const numValueStr = e.target.value; //
            // 입력값을 실제 숫자 타입(int 또는 float)으로 변환하여 저장 시도
            let numValue; //
            if (actualDataType === 'integer' || actualDataType === 'int') {
                numValue = parseInt(numValueStr); //
            } else { // float, number
                numValue = parseFloat(numValueStr); //
            }
            // 유효한 숫자로 변환된 경우만 저장 (NaN 방지)
            if (!isNaN(numValue)) {
                units[selectedIndex][key] = numValue; //
            } else if (numValueStr === '') { // 빈 문자열은 null 또는 0으로 처리? 여기선 빈값으로 저장안함
                // 또는 기본값 할당: units[selectedIndex][key] = 0;
            }

            // 입력값 유효성 검사 (선언된 타입 기준)
            if (numValueStr !== '' && !validateDataType(numValueStr, declaredDataType || actualDataType)) { //
                input.classList.add('invalid-input'); //
                input.title = `This field should be type: ${declaredDataType || actualDataType}`; //
            } else {
                input.classList.remove('invalid-input'); //
                input.title = ''; //
            }
        }); //
        // 초기 유효성
        if (input.value !== '' && !validateDataType(input.value, declaredDataType || actualDataType)) { //
            input.classList.add('invalid-input'); //
            input.title = `This field should be type: ${declaredDataType || actualDataType}`; //
        }
        inputElementContainer.appendChild(input); //
    }
    // 기본 문자열 타입 처리 (input type=text)
    else {
        const input = document.createElement('input'); //
        input.type = 'text'; //
        input.value = value !== undefined && value !== null ? value : ''; //
        input.className = 'field-input'; //
        input.addEventListener('input', (e) => {
            units[selectedIndex][key] = e.target.value; //
            if (key === 'name') {
                renderUnitList(); //
            }
        }); //
        inputElementContainer.appendChild(input); //
    }

    fieldDiv.appendChild(inputElementContainer); //
    unitInfo.appendChild(fieldDiv); //
}
// ***** 끝: createField 함수 수정 *****


// --- 배열 UI 생성 함수 ---
function createArrayFieldUI(fieldKey, arrayValue) {
    const container = document.createElement('div'); //
    container.className = 'array-container'; //

    const listDiv = document.createElement('div'); // 배열 항목들을 담을 div
    listDiv.className = 'array-list'; //
    container.appendChild(listDiv); //

    // 데이터가 배열이 아닐 경우 빈 배열로 초기화
    if (!Array.isArray(arrayValue)) {
        console.warn(`Expected array for key '${fieldKey}', but got ${typeof arrayValue}. Initializing as empty array.`); //
        arrayValue = []; //
        units[selectedIndex][fieldKey] = arrayValue; // 원본 데이터도 수정
    }

    const renderList = () => {
        listDiv.innerHTML = ''; // 목록 초기화
        const currentArray = units[selectedIndex][fieldKey]; // 최신 데이터 참조

        currentArray.forEach((item, index) => {
            const itemDiv = document.createElement('div'); //
            itemDiv.className = 'array-item'; //

            const indexLabel = document.createElement('span'); //
            indexLabel.className = 'array-index-label'; //
            indexLabel.textContent = `${index}:`; //

            const valueInput = document.createElement('input'); //
            // 배열 요소 타입 추론 (단순화: 여기서는 모두 text)
            valueInput.type = 'text'; //
            valueInput.className = 'array-value-input field-input'; //
            valueInput.value = item !== null && item !== undefined ? item : ''; // null/undefined 처리

            valueInput.addEventListener('input', (e) => {
                // TODO: 요소 타입에 따른 값 변환 필요 (예: 숫자 배열이면 parseFloat)
                // 현재는 문자열로 저장
                currentArray[index] = e.target.value; //
            }); //

            const removeBtn = document.createElement('button'); //
            removeBtn.textContent = '-'; //
            removeBtn.className = 'array-remove-btn'; //
            removeBtn.type = 'button'; //
            removeBtn.onclick = () => {
                currentArray.splice(index, 1); //
                renderList(); // 삭제 후 목록 다시 그림
            }; //

            itemDiv.appendChild(indexLabel); //
            itemDiv.appendChild(valueInput); //
            itemDiv.appendChild(removeBtn); //
            listDiv.appendChild(itemDiv); //
        }); //

        if (currentArray.length === 0) {
            const emptyMsg = document.createElement('span'); //
            emptyMsg.textContent = '(배열이 비어있습니다)'; //
            emptyMsg.style.color = '#999'; //
            emptyMsg.style.padding = '5px'; //
            listDiv.appendChild(emptyMsg); //
        }
    }; //

    const addBtn = document.createElement('button'); //
    addBtn.textContent = '+ 항목 추가'; //
    addBtn.className = 'array-add-btn'; //
    addBtn.type = 'button'; //
    addBtn.onclick = () => {
        const currentArray = units[selectedIndex][fieldKey]; //
        // TODO: 추가할 요소의 기본값 타입 결정 (현재는 빈 문자열)
        currentArray.push(''); //
        renderList(); // 추가 후 목록 다시 그림
    }; //

    renderList(); // 초기 목록 렌더링
    container.appendChild(addBtn); // 추가 버튼 추가

    // 생성된 컨테이너에 wrapper 클래스 추가 (createField 구조 일관성)
    container.classList.add('field-input-wrapper'); //
    return container; //
} //

// --- 특정 Key-Value 딕셔너리 UI 생성 함수 ---
function createDictKVFieldUI(fieldKey, dictValue) {
    const container = document.createElement('div'); //
    container.className = 'dict-kv-container field-input-wrapper'; // wrapper 클래스 추가

    // 데이터 보정 및 초기화
    if (typeof dictValue !== 'object' || dictValue === null || Array.isArray(dictValue)) {
        console.warn(`Expected object for key '${fieldKey}', but got ${typeof dictValue}. Initializing as {key:'', value:0}.`); //
        dictValue = { key: "", value: 0 }; //
        units[selectedIndex][fieldKey] = dictValue; // 원본 데이터 수정
    } else {
        if (!('key' in dictValue) || typeof dictValue.key !== 'string') dictValue.key = ""; //
        if (!('value' in dictValue) || typeof dictValue.value !== 'number') dictValue.value = 0; //
    }


    // Key 입력 필드
    const keyDiv = document.createElement('div'); //
    keyDiv.className = 'dict-kv-item'; //
    const keyLabel = document.createElement('label'); //
    keyLabel.textContent = 'key:'; //
    const keyInput = document.createElement('input'); //
    keyInput.type = 'text'; //
    keyInput.className = 'dict-key-input field-input'; //
    keyInput.value = dictValue.key; //
    keyInput.addEventListener('input', (e) => {
        units[selectedIndex][fieldKey].key = e.target.value; //
    }); //
    keyDiv.appendChild(keyLabel); //
    keyDiv.appendChild(keyInput); //

    // Value 입력 필드
    const valueDiv = document.createElement('div'); //
    valueDiv.className = 'dict-kv-item'; //
    const valueLabel = document.createElement('label'); //
    valueLabel.textContent = 'value:'; //
    const valueInput = document.createElement('input'); //
    valueInput.type = 'number'; //
    valueInput.step = 'any'; // 실수 허용
    valueInput.className = 'dict-value-input field-input'; //
    valueInput.value = dictValue.value; //
    valueInput.addEventListener('input', (e) => {
        units[selectedIndex][fieldKey].value = parseFloat(e.target.value) || 0; //
    }); //
    valueDiv.appendChild(valueLabel); //
    valueDiv.appendChild(valueInput); //

    container.appendChild(keyDiv); //
    container.appendChild(valueDiv); //

    return container; //
} //

// ***** 새로운 UI 함수 추가: array_dict_kv 처리 *****
function createArrayOfDictKV_UI(fieldKey, arrayValue) {
    const container = document.createElement('div');
    container.className = 'array-dict-kv-container field-input-wrapper'; // CSS 클래스 정의 필요

    const listDiv = document.createElement('div');
    listDiv.className = 'array-dict-kv-list'; // CSS 클래스 정의 필요
    container.appendChild(listDiv);

    // 데이터 유효성 검사 및 초기화 (배열이 아니면 빈 배열로)
    if (!Array.isArray(arrayValue)) {
        arrayValue = [];
        units[selectedIndex][fieldKey] = arrayValue; // 원본 데이터도 수정
    }

    const renderList = () => {
        listDiv.innerHTML = '';
        const currentArray = units[selectedIndex][fieldKey];

        currentArray.forEach((item, index) => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'array-dict-kv-item'; // CSS 클래스 정의 필요

            // 각 항목이 {key, value} 형태가 아니면 기본값으로 설정
            if (typeof item !== 'object' || item === null || !('key' in item) || !('value' in item)) {
                item = { key: "", value: 0 };
                currentArray[index] = item; // 원본 데이터도 수정
            }

            // Key 입력 생성
            const keyLabel = document.createElement('label');
            keyLabel.textContent = `[${index}] key:`;
            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.className = 'dict-key-input field-input'; // 기존 클래스 재활용 가능
            keyInput.value = item.key;
            keyInput.addEventListener('input', (e) => {
                currentArray[index].key = e.target.value;
            });

            // Value 입력 생성
            const valueLabel = document.createElement('label');
            valueLabel.textContent = `value:`;
            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.step = 'any';
            valueInput.className = 'dict-value-input field-input'; // 기존 클래스 재활용 가능
            valueInput.value = item.value;
            valueInput.addEventListener('input', (e) => {
                currentArray[index].value = parseFloat(e.target.value) || 0;
            });

            // 삭제 버튼
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '-';
            removeBtn.className = 'array-remove-btn'; // 기존 클래스 재활용 가능
            removeBtn.type = 'button';
            removeBtn.onclick = () => {
                currentArray.splice(index, 1);
                renderList();
            };

            itemContainer.appendChild(keyLabel);
            itemContainer.appendChild(keyInput);
            itemContainer.appendChild(valueLabel);
            itemContainer.appendChild(valueInput);
            itemContainer.appendChild(removeBtn);
            listDiv.appendChild(itemContainer);
        });
        // (옵션) 배열 비었을 때 메시지 표시 로직 추가
        if (currentArray.length === 0) {
            const emptyMsg = document.createElement('span');
            emptyMsg.textContent = '(항목이 비어있습니다)';
            emptyMsg.style.color = '#999';
            emptyMsg.style.padding = '5px';
            listDiv.appendChild(emptyMsg);
        }
    };

    // 항목 추가 버튼
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ 항목 추가';
    addBtn.className = 'array-add-btn'; // 기존 클래스 재활용 가능
    addBtn.type = 'button';
    addBtn.onclick = () => {
        const currentArray = units[selectedIndex][fieldKey];
        currentArray.push({ key: "", value: 0 }); // 새 항목 기본값
        renderList();
    };

    renderList(); // 초기 렌더링
    container.appendChild(addBtn);

    return container;
}
// ***** 끝: 새로운 UI 함수 추가 *****


// --- 일반 객체 Textarea UI 생성 함수 ---
function createObjectTextareaUI(fieldKey, objectValue) {
    const container = document.createElement('div'); //
    container.className = 'field-input-wrapper'; // wrapper 클래스 추가

    const textarea = document.createElement('textarea'); //
    textarea.className = 'field-textarea'; //

    // 데이터 보정: 객체가 아니면 빈 객체 문자열로
    if (typeof objectValue !== 'object' || objectValue === null || Array.isArray(objectValue)) {
        console.warn(`Expected object for key '${fieldKey}', but got ${typeof objectValue}. Initializing as {}.`); //
        objectValue = {}; //
        units[selectedIndex][fieldKey] = objectValue; // 원본 데이터 수정
    }

    try {
        textarea.value = JSON.stringify(objectValue, null, 2); //
    } catch (e) {
        textarea.value = "Error displaying data"; //
        textarea.classList.add('invalid-input'); //
    }
    textarea.rows = 5; //

    textarea.addEventListener('input', (e) => {
        const textValue = e.target.value; //
        try {
            const parsedValue = JSON.parse(textValue); //
            // 파싱된 값이 객체이고 배열이 아닌 경우에만 업데이트
            if (typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue)) {
                units[selectedIndex][fieldKey] = parsedValue; //
                e.target.classList.remove('invalid-input'); //
                e.target.title = ''; //
            } else {
                throw new Error("Input is not a valid JSON object."); //
            }
        } catch (error) {
            e.target.classList.add('invalid-input'); //
            e.target.title = 'Invalid JSON format: ' + error.message; //
            // 잘못된 입력이어도 units 데이터는 바꾸지 않음
        }
    }); //
    // 초기 유효성 검사
    try {
        JSON.parse(textarea.value); //
    } catch (e) {
        textarea.classList.add('invalid-input'); //
        textarea.title = 'Invalid JSON format.'; //
    }

    container.appendChild(textarea); //
    return container; //
} //


// 다음 유닛 ID 가져오기 (0부터 시작해서 1씩 증가)
function getNextUnitId() {
    if (units.length === 0) {
        return 0; //
    }

    const numericIds = units
        .map(unit => parseInt(unit.id)) // 문자열 ID를 숫자로 변환 시도
        .filter(id => !isNaN(id) && id >= 0); // 유효한 숫자 ID만 필터링

    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : -1; //
    return maxId + 1; //
} //

// 모든 유닛을 템플릿 구조와 동기화
function synchronizeUnitsWithTemplate() {
    let changedUnits = 0; //

    units.forEach((unit, index) => {
        const result = synchronizeUnitWithTemplate(index, false); // 개별 메시지 없이 동기화
        if (result) changedUnits++; //
    }); //

    if (changedUnits > 0) {
        showNotification(`${changedUnits}개의 유닛이 템플릿과 동기화되었습니다.`); //
    } else {
        showNotification(`모든 유닛이 이미 템플릿과 일치합니다.`); //
    }
} //

// 특정 유닛을 템플릿 구조와 동기화
function synchronizeUnitWithTemplate(unitIndex, showMessage = true) {
    if (!template.fields || template.fields.length === 0) {
        if(showMessage) showNotification('템플릿 정의가 없습니다.', true); //
        return false; //
    }

    const unit = units[unitIndex]; //
    let changed = false; //

    // 템플릿에 정의된 필드 집합 (Map으로 변경: 이름 -> 타입)
    const templateProps = new Map(template.fields.map(f => [f.PropertyName, f.DataType])); //

    // 1. 새 유닛 객체 생성 (ID는 항상 유지)
    const synchronizedUnit = { id: unit.id }; //

    // 2. 템플릿 순서대로 필드 추가/유지
    templateProps.forEach((dataType, propName) => {
        if (propName === 'id') return; // ID는 이미 처리됨

        if (propName in unit) {
            // 유닛에 이미 있는 필드면 값 유지
            synchronizedUnit[propName] = unit[propName]; //
        } else {
            // 유닛에 없는 필드면 기본값 추가
            synchronizedUnit[propName] = getDefaultValue(dataType, propName); // getDefaultValue 함수 수정 반영됨
            changed = true; //
        }
    }); //

    // 3. 템플릿에 없는 필드 식별 (삭제 대상)
    Object.keys(unit).forEach(propName => {
        if (propName !== 'id' && !templateProps.has(propName)) {
            changed = true; // 필드가 삭제되므로 변경됨
        }
        // 템플릿에 없는 필드는 synchronizedUnit에 추가하지 않음
    }); //

    // 변경 사항이 실제로 있는지 최종 확인 (키 집합 비교)
    const unitKeys = new Set(Object.keys(unit)); //
    const syncKeys = new Set(Object.keys(synchronizedUnit)); //
    const keysChanged = unitKeys.size !== syncKeys.size || ![...unitKeys].every(key => syncKeys.has(key)); //

    if (changed || keysChanged) { // 필드 추가/삭제/순서변경 감지
        units[unitIndex] = synchronizedUnit; // 유닛 객체 교체

        // 현재 선택된 유닛인 경우 UI 업데이트
        if (unitIndex === selectedIndex) {
            renderUnitInfo(units[unitIndex]); //
        }

        if (showMessage) {
            showNotification(`"${unit.name || unit.id}" 유닛이 템플릿과 동기화되었습니다.`); //
        }
        return true; // 변경됨
    }

    return false; // 변경 없음
} //


// ***** getDefaultValue 함수 수정 *****
// 데이터 타입에 따른 기본값 반환 함수
function getDefaultValue(dataType, propName) {
    switch (dataType.toLowerCase()) {
        case 'int':
        case 'integer':
            return 0; // 숫자 0
        case 'float':
        case 'number':
            return 0.0; // 숫자 0.0
        case 'bool':
        case 'boolean':
            return false; // boolean false
        case 'array':
            return []; // 빈 배열
        case 'dict_kv':
            return { key: "", value: 0 }; // 기본 dict_kv 객체
        // ***** 새로운 타입 기본값 추가 *****
        case 'array_dict_kv': // 새로운 타입 이름
            return []; // 기본값은 빈 배열
        // ***** 끝 *****
        case 'object':
        case 'dict':
        case 'dictionary':
            return {}; // 빈 객체
        case 'string':
            return propName === 'name' ? '새 유닛' : ''; // 이름 필드는 기본값 다르게
        default:
            console.warn("Unknown data type for default value:", dataType); //
            return ''; // 알 수 없는 타입은 빈 문자열
    }
}
// ***** 끝: getDefaultValue 함수 수정 *****