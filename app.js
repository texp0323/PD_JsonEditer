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
    console.log("기본 템플릿 로드됨:", template);
    
    // 템플릿과 유닛 구조 동기화
    if (units.length > 0 && template.fields && template.fields.length > 0) {
        synchronizeUnitsWithTemplate();
    }
    
    renderUnitList();
    updateSaveButtonVisibility();

    // 컨텍스트 메뉴가 열려있을 때 페이지 스크롤 시 메뉴 닫기
    document.addEventListener('scroll', () => {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }
    });
    
    // ESC 키 누를 때 열려있는 컨텍스트 메뉴 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const existingMenu = document.querySelector('.context-menu');
            if (existingMenu) {
                document.body.removeChild(existingMenu);
            }
        }
    });
});

addUnitBtn.addEventListener('click', async () => {
    // 템플릿이 비어있지 않은지 확인
    if (!template.fields || template.fields.length === 0) {
        showNotification('템플릿을 찾을 수 없습니다. template.json 파일을 확인해주세요.', true);
        return;
    }

    // 새 유닛 객체 생성 (id는 먼저 추가)
    const nextId = getNextUnitId();
    const newUnit = {
        id: nextId.toString()
    };

    // 템플릿의 각 필드에 대해 기본값 설정
    template.fields.forEach(field => {
        const propName = field.PropertyName;
        if (propName !== 'id') {
            // 데이터 타입에 따른 기본값 설정
            switch (field.DataType.toLowerCase()) {
                case 'int':
                case 'integer':
                    newUnit[propName] = '0';
                    break;
                case 'float':
                case 'number':
                    newUnit[propName] = '0.0';
                    break;
                case 'bool':
                case 'boolean':
                    newUnit[propName] = 'false';
                    break;
                default:
                    // string 등 기타 타입
                    newUnit[propName] = propName === 'name' ? '새 유닛' : '';
            }
        }
    });

    units.push(newUnit);
    selectUnit(units.length - 1);  // 새로 추가된 유닛 선택
    renderUnitList();
    showNotification('새 유닛이 추가되었습니다!');
});

deleteUnitBtn.addEventListener('click', () => {
    if (selectedIndex === -1) {
        showNotification('삭제할 유닛을 먼저 선택해주세요.', true);
        return;
    }

    if (confirm(`정말로 "${units[selectedIndex].name}" 유닛을 삭제하시겠습니까?`)) {
        // 선택된 유닛 삭제
        const deletedName = units[selectedIndex].name;
        units.splice(selectedIndex, 1);
        
        // 선택 인덱스 재설정
        if (units.length === 0) {
            selectedIndex = -1;
            unitInfo.innerHTML = '';
        } else {
            // 마지막 항목이 삭제된 경우 이전 항목 선택
            if (selectedIndex >= units.length) {
                selectedIndex = units.length - 1;
            }
            renderUnitInfo(units[selectedIndex]);
        }
        
        renderUnitList();
        updateSaveButtonVisibility();
        showNotification(`"${deletedName}" 유닛이 삭제되었습니다.`);
    }
});

syncTemplateBtn.addEventListener('click', () => {
    if (units.length === 0) {
        showNotification('동기화할 유닛이 없습니다.', true);
        return;
    }
    
    if (!template.fields || template.fields.length === 0) {
        showNotification('템플릿을 찾을 수 없습니다. template.json 파일을 확인해주세요.', true);
        return;
    }
    
    if (confirm('모든 유닛을 템플릿 구조와 동기화하시겠습니까? 템플릿에 없는 필드는 삭제되고, 템플릿에 있는 필드는 추가됩니다.')) {
        synchronizeUnitsWithTemplate();
        
        // 현재 선택된 유닛이 있으면 정보 다시 렌더링
        if (selectedIndex !== -1) {
            renderUnitInfo(units[selectedIndex]);
        }
        
        renderUnitList();
    }
});

// 저장 버튼 이벤트 핸들러
document.getElementById('right-panel').addEventListener('click', (e) => {
    if (e.target && e.target.id === 'saveButton') {
        // 모든 유닛의 값이 데이터 타입에 맞는지 검증
        const invalidFields = validateAllUnits();
        
        if (invalidFields.length > 0) {
            const message = `다음 유닛의 필드가 올바르지 않습니다:\n${invalidFields.join('\n')}`;
            if (!confirm(`${message}\n\n그래도 저장하시겠습니까?`)) {
                return;
            }
        }
        
        window.api.saveUnits(units)
            .then(() => {
                showNotification('유닛이 성공적으로 저장되었습니다!');
            })
            .catch((error) => {
                console.error('유닛 저장 실패:', error);
                showNotification('유닛 저장에 실패했습니다!', true);
            });
    }
});

// 모든 유닛의 필드값이 템플릿의 데이터 타입에 맞는지 검증
function validateAllUnits() {
    const invalidFields = [];
    
    if (!template.fields) return invalidFields;
    
    units.forEach((unit, index) => {
        template.fields.forEach(field => {
            const propName = field.PropertyName;
            const dataType = field.DataType;
            
            if (propName in unit) {
                const value = unit[propName];
                
                if (!validateDataType(value, dataType)) {
                    invalidFields.push(`유닛 ${unit.id}(${unit.name || '이름 없음'}): ${propName} 필드의 값이 ${dataType} 타입이 아닙니다.`);
                }
            }
        });
    });
    
    return invalidFields;
}

// 주어진 값이 지정된 데이터 타입에 맞는지 검증
function validateDataType(value, dataType) {
    // 빈 값은 항상 유효
    if (value === '' || value === null || value === undefined) {
        return true;
    }
    
    switch (dataType.toLowerCase()) {
        case 'string':
            return true; // 모든 값은 문자열로 취급 가능
        
        case 'int':
        case 'integer':
            return /^-?\d+$/.test(value);
            
        case 'float':
        case 'number':
            return /^-?\d+(\.\d+)?$/.test(value);
            
        case 'bool':
        case 'boolean':
            return value === 'true' || value === 'false' || value === true || value === false;
            
        default:
            return true; // 알 수 없는 타입은 항상 유효하다고 가정
    }
}

// 템플릿에서 특정 속성 이름에 대한 데이터 타입 찾기
function findDataTypeForProperty(propertyName) {
    if (!template.fields) return 'string';
    
    const field = template.fields.find(f => f.PropertyName === propertyName);
    return field ? field.DataType : 'string';
}

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // 3초 후 알림 제거
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

function updateSaveButtonVisibility() {
    const saveButtonContainer = document.getElementById('save-button-container');
    if (!saveButtonContainer) return;

    if (selectedIndex === -1) {
        saveButtonContainer.classList.add('hidden');
    } else {
        saveButtonContainer.classList.remove('hidden');
    }
}

function renderUnitList() {
    unitList.innerHTML = '';  // 기존 목록 초기화

    if (units.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '유닛이 없습니다. 추가해주세요.';
        unitList.appendChild(emptyMessage);
        return;
    }

    units.forEach((unit, index) => {
        const div = document.createElement('div');
        div.textContent = `${unit.name || '이름 없음'} (ID: ${unit.id})`;
        div.classList.add('unit-item');

        // 선택된 유닛에 클래스 추가
        if (index === selectedIndex) {
            div.classList.add('selected');
        }

        // 유닛 선택을 위한 클릭 이벤트 추가
        div.addEventListener('click', () => {
            selectUnit(index);
        });

        // 컨텍스트 메뉴(우클릭) 이벤트 추가
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // 현재 열려있는 컨텍스트 메뉴 제거
            const existingMenu = document.querySelector('.context-menu');
            if (existingMenu) {
                document.body.removeChild(existingMenu);
            }
            
            // 선택되지 않은 유닛이면 먼저 선택
            if (index !== selectedIndex) {
                selectUnit(index);
            }
            
            // 컨텍스트 메뉴 생성
            const contextMenu = document.createElement('div');
            contextMenu.className = 'context-menu';
            
            // 삭제 옵션 추가
            const deleteOption = document.createElement('div');
            deleteOption.className = 'menu-item';
            deleteOption.textContent = '유닛 삭제';
            deleteOption.addEventListener('click', () => {
                if (confirm(`정말로 "${unit.name || '이름 없음'}" 유닛을 삭제하시겠습니까?`)) {
                    // 선택된 유닛 삭제
                    const deletedName = unit.name || '이름 없음';
                    units.splice(index, 1);
                    
                    // 선택 인덱스 재설정
                    if (units.length === 0) {
                        selectedIndex = -1;
                        unitInfo.innerHTML = '';
                    } else {
                        // 마지막 항목이 삭제된 경우 이전 항목 선택
                        if (selectedIndex >= units.length) {
                            selectedIndex = units.length - 1;
                        }
                        renderUnitInfo(units[selectedIndex]);
                    }
                    
                    renderUnitList();
                    updateSaveButtonVisibility();
                    showNotification(`"${deletedName}" 유닛이 삭제되었습니다.`);
                }
                document.body.removeChild(contextMenu);
            });
            
            contextMenu.appendChild(deleteOption);
            
            // 복제 옵션 추가
            const duplicateOption = document.createElement('div');
            duplicateOption.className = 'menu-item';
            duplicateOption.textContent = '유닛 복제';
            duplicateOption.addEventListener('click', () => {
                // 현재 유닛 복제
                const clonedUnit = JSON.parse(JSON.stringify(unit));
                clonedUnit.id = getNextUnitId().toString();
                if (clonedUnit.name) {
                    clonedUnit.name = `${clonedUnit.name} (복제)`;
                } else {
                    clonedUnit.name = '복제된 유닛';
                }
                
                units.push(clonedUnit);
                selectUnit(units.length - 1);
                renderUnitList();
                showNotification(`"${unit.name || '이름 없음'}"의 복제본이 생성되었습니다.`);
                document.body.removeChild(contextMenu);
            });
            
            contextMenu.appendChild(duplicateOption);
            
            // 콘텍스트 메뉴에 템플릿 동기화 옵션 추가
            const syncOption = document.createElement('div');
            syncOption.className = 'menu-item';
            syncOption.textContent = '템플릿과 동기화';
            syncOption.addEventListener('click', () => {
                synchronizeUnitWithTemplate(index);
                document.body.removeChild(contextMenu);
            });
            
            contextMenu.appendChild(syncOption);
            
            // 메뉴 위치 설정
            contextMenu.style.top = `${e.pageY}px`;
            contextMenu.style.left = `${e.pageX}px`;
            
            // 메뉴를 body에 추가
            document.body.appendChild(contextMenu);
            
            // 다른 곳 클릭 시 메뉴 닫기
            document.addEventListener('click', function closeMenu(e) {
                if (!contextMenu.contains(e.target)) {
                    if (document.body.contains(contextMenu)) {
                        document.body.removeChild(contextMenu);
                    }
                    document.removeEventListener('click', closeMenu);
                }
            });
        });

        unitList.appendChild(div);
    });
}

function selectUnit(index) {
    selectedIndex = index;
    renderUnitList();
    renderUnitInfo(units[index]);
    updateSaveButtonVisibility();
}

function renderUnitInfo(unit) {
    unitInfo.innerHTML = '';

    if (!template.fields) {
        // 템플릿이 없는 경우, 기존 방식대로 렌더링
        const keys = Object.keys(unit);
        
        // id를 첫 번째로 이동시키기 위해 키 재정렬
        if (keys.includes('id')) {
            const idIndex = keys.indexOf('id');
            keys.splice(idIndex, 1); // id 키 제거
            keys.unshift('id'); // id 키를 배열의 첫 번째로 추가
        }
        
        keys.forEach(key => {
            createField(key, unit[key], 'string');
        });
        return;
    }

    // 템플릿 정의 순서대로 필드 렌더링
    const renderedProps = new Set(['id']); // id는 항상 처리됨
    
    // 우선 id 필드 렌더링
    createField('id', unit.id, 'string');
    
    // 템플릿 정의 순서대로 필드 렌더링
    template.fields.forEach(field => {
        const propName = field.PropertyName;
        const dataType = field.DataType;
        
        if (propName !== 'id') {
            createField(propName, unit[propName], dataType);
            renderedProps.add(propName);
        }
    });
    
    // 템플릿에 없는 남은 필드들 렌더링
    Object.keys(unit).forEach(propName => {
        if (!renderedProps.has(propName)) {
            createField(propName, unit[propName], 'string');
        }
    });
}

function createField(key, value, dataType) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'field-container';

    const label = document.createElement('label');
    label.textContent = key;
    label.className = 'field-label';
    
    // 데이터 타입 표시 추가
    const typeIndicator = document.createElement('span');
    typeIndicator.className = 'type-indicator';
    typeIndicator.textContent = `[${dataType}]`;
    label.appendChild(typeIndicator);
    
    label.title = '더블클릭하여 필드 이름 변경';
    label.addEventListener('dblclick', () => {
        if (key === 'id') {
            showNotification('ID 필드는 변경할 수 없습니다.', true);
            return;
        }
        
        const newKey = prompt('필드 이름 변경:', key);
        if (newKey && newKey.trim() !== '' && newKey !== key && !(newKey in units[selectedIndex])) {
            // 변경된 필드 이름으로 새 객체를 생성하고 값을 복사
            const updatedUnit = {};
            
            // 기존 속성을 순서대로 복사하되, 변경할 키만 새 이름으로 교체
            for (const propKey in units[selectedIndex]) {
                if (propKey === key) {
                    updatedUnit[newKey] = units[selectedIndex][key];
                } else {
                    updatedUnit[propKey] = units[selectedIndex][propKey];
                }
            }
            
            // 기존 유닛을 새 객체로 교체
            units[selectedIndex] = updatedUnit;
            
            renderUnitInfo(units[selectedIndex]);
            renderUnitList();
            showNotification(`필드 "${key}"가 "${newKey}"로 변경되었습니다.`);
        } else if (newKey === key) {
            showNotification('기존 이름과 동일합니다.');
        } else if (!newKey || newKey.trim() === '') {
            showNotification('필드 이름은 비워둘 수 없습니다.', true);
        } else if (newKey in units[selectedIndex]) {
            showNotification('이미 존재하는 필드 이름입니다.', true);
        }
    });

    fieldDiv.appendChild(label);

    const input = document.createElement('input');
    input.value = value !== undefined && value !== null ? value : '';
    input.className = 'field-input';
    
    // 데이터 타입에 따라 input 속성 설정
    if (dataType.toLowerCase() === 'float' || dataType.toLowerCase() === 'number') {
        input.type = 'number';
        input.step = 'any'; // 소수점 입력 가능
    } else if (dataType.toLowerCase() === 'int' || dataType.toLowerCase() === 'integer') {
        input.type = 'number';
        input.step = '1'; // 정수만 입력 가능
    } else if (dataType.toLowerCase() === 'bool' || dataType.toLowerCase() === 'boolean') {
        // 불리언 타입을 위한 셀렉트 박스로 대체
        const select = document.createElement('select');
        select.className = 'field-input';
        
        const optTrue = document.createElement('option');
        optTrue.value = 'true';
        optTrue.textContent = 'true';
        
        const optFalse = document.createElement('option');
        optFalse.value = 'false';
        optFalse.textContent = 'false';
        
        select.appendChild(optTrue);
        select.appendChild(optFalse);
        
        select.value = String(value).toLowerCase();
        
        select.addEventListener('change', (e) => {
            units[selectedIndex][key] = e.target.value;
        });
        
        // input 대신 select를 사용
        fieldDiv.removeChild(input);
        fieldDiv.appendChild(select);
        
        // id 필드는 읽기 전용으로 설정
        if (key === 'id') {
            select.disabled = true;
            select.className += ' read-only';
        }
        
        // 다음 코드를 건너뛰기
        unitInfo.appendChild(fieldDiv);
        return;
    }

    // id 필드는 읽기 전용으로 설정
    if (key === 'id') {
        input.readOnly = true;
        input.className += ' read-only';
    }

    // 데이터 타입에 맞게 유효성 검사 추가
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        units[selectedIndex][key] = value;
        
        // 입력값 유효성 검사
        if (value !== '' && !validateDataType(value, dataType)) {
            input.classList.add('invalid-input');
            input.title = `이 필드는 ${dataType} 타입이어야 합니다.`;
        } else {
            input.classList.remove('invalid-input');
            input.title = '';
        }
        
        if (key === 'name') {
            renderUnitList();
        }
    });

    // 초기 유효성 검사
    if (value !== '' && !validateDataType(value, dataType)) {
        input.classList.add('invalid-input');
        input.title = `이 필드는 ${dataType} 타입이어야 합니다.`;
    }

    fieldDiv.appendChild(input);
    unitInfo.appendChild(fieldDiv);
}

// 다음 유닛 ID 가져오기 (0부터 시작해서 1씩 증가)
function getNextUnitId() {
    if (units.length === 0) {
        return 0;
    }

    // 모든 유닛의 ID를 숫자로 변환 (가능한 경우)
    const numericIds = units
        .map(unit => {
            const id = parseInt(unit.id);
            return isNaN(id) ? -1 : id;
        })
        .filter(id => id >= 0);

    // 최대 ID 값 찾기
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : -1;

    // 최대값 + 1 반환 (또는 기본값 0)
    return maxId + 1;
}

// 모든 유닛을 템플릿 구조와 동기화
function synchronizeUnitsWithTemplate() {
    let changedUnits = 0;
    
    units.forEach((unit, index) => {
        const result = synchronizeUnitWithTemplate(index, false);
        if (result) changedUnits++;
    });
    
    if (changedUnits > 0) {
        showNotification(`${changedUnits}개의 유닛이 템플릿과 동기화되었습니다.`);
    } else {
        showNotification(`모든 유닛이 이미 템플릿과 일치합니다.`);
    }
}

// 특정 유닛을 템플릿 구조와 동기화
function synchronizeUnitWithTemplate(unitIndex, showMessage = true) {
    if (!template.fields || template.fields.length === 0) {
        showNotification('템플릿 정의가 없습니다.', true);
        return false;
    }
    
    const unit = units[unitIndex];
    let changed = false;
    
    // 원본 유닛의 ID와 이름 값 저장 (항상 유지되어야 함)
    const unitId = unit.id;
    const unitName = unit.name || '';
    
    // 1. 템플릿의 키 순서대로 새로운 객체 생성
    const orderedUnit = {
        id: unitId // 항상 id를 먼저 유지
    };
    
    // 2. 템플릿의 순서대로 필드 복사
    template.fields.forEach(field => {
        const propName = field.PropertyName;
        
        if (propName === 'id') return; // ID는 이미 처리함
        
        if (propName === 'name' && unitName) {
            // 이름 필드는 유닛의 기존 이름 유지
            orderedUnit['name'] = unitName;
        } else if (propName in unit) {
            // 유닛에 이미 있는 필드면 값 유지
            orderedUnit[propName] = unit[propName];
        } else {
            // 유닛에 없는 필드면 기본값 추가
            // 데이터 타입에 따른 기본값 설정
            const dataType = field.DataType.toLowerCase();
            switch (dataType) {
                case 'int':
                case 'integer':
                    orderedUnit[propName] = '0';
                    break;
                case 'float':
                case 'number':
                    orderedUnit[propName] = '0.0';
                    break;
                case 'bool':
                case 'boolean':
                    orderedUnit[propName] = 'false';
                    break;
                default:
                    // string 등 기타 타입
                    orderedUnit[propName] = '';
            }
            changed = true;
        }
    });
    
    // 3. 템플릿에 없는 필드 여부 확인
    const templateProps = new Set(template.fields.map(f => f.PropertyName));
    const extraFields = Object.keys(unit).filter(key => !templateProps.has(key) && key !== 'id');
    
    // 변경 사항이 있는 경우에만 유닛을 업데이트
    const unitPropsSet = new Set(Object.keys(unit));
    const orderedPropsSet = new Set(Object.keys(orderedUnit));
    
    // 세트 비교를 통한 변경 감지
    const propsChanged = extraFields.length > 0 || 
                         changed || 
                         unitPropsSet.size !== orderedPropsSet.size ||
                         ![...unitPropsSet].every(key => orderedPropsSet.has(key));
    
    if (propsChanged) {
        // 4. 템플릿에 없는 필드를 마지막에 추가 (필요한 경우)
        extraFields.forEach(key => {
            orderedUnit[key] = unit[key];
        });
        
        // 5. 유닛 객체 교체
        units[unitIndex] = orderedUnit;
        
        // 현재 선택된 유닛인 경우 UI 업데이트
        if (unitIndex === selectedIndex) {
            renderUnitInfo(units[unitIndex]);
        }
        
        // 메시지 표시 옵션이 활성화된 경우
        if (showMessage) {
            showNotification(`"${unitName || '유닛'}" 유닛이 템플릿과 동기화되었습니다.`);
        }
        
        return true;
    }
    
    return false;
}