let units = [];
let presets = {};
let selectedIndex = -1;

const unitList = document.getElementById('unit-list');
const unitInfo = document.getElementById('unit-info');
const addUnitBtn = document.getElementById('add-unit');
const presetModal = document.getElementById('preset-modal');
const presetList = document.getElementById('preset-list');
const closeModalBtn = document.getElementById('close-modal');

document.addEventListener('DOMContentLoaded', async () => {
    units = await window.api.loadUnits();
    presets = await window.api.loadPresets();
    console.log("프리셋 로드됨:", presets);
    renderUnitList();
    updateSaveButtonVisibility();
});

addUnitBtn.addEventListener('click', () => {
    renderPresetList();
    presetModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', () => {
    presetModal.classList.add('hidden');
});

// 저장 버튼 이벤트 핸들러
document.getElementById('right-panel').addEventListener('click', (e) => {
    if (e.target && e.target.id === 'saveButton') {
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
        div.textContent = `${unit.name} (ID: ${unit.id})`;
        div.classList.add('unit-item');

        // 선택된 유닛에 클래스 추가
        if (index === selectedIndex) {
            div.classList.add('selected');
        }

        // 유닛 선택을 위한 클릭 이벤트 추가
        div.addEventListener('click', () => {
            selectUnit(index);
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

    // 객체의 키를 배열로 변환
    const keys = Object.keys(unit);

    // id를 첫 번째로 이동시키기 위해 키 재정렬
    if (keys.includes('id')) {
        const idIndex = keys.indexOf('id');
        keys.splice(idIndex, 1); // id 키 제거
        keys.unshift('id'); // id 키를 배열의 첫 번째로 추가
    }

    // 재정렬된 순서로 필드 생성
    keys.forEach(key => {
        createField(key, unit[key]);
    });
}

function createField(key, value) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'field-container';

    const label = document.createElement('label');
    label.textContent = key;
    label.className = 'field-label';
    label.title = '더블클릭하여 필드 이름 변경';
    label.addEventListener('dblclick', () => {
        const newKey = prompt('필드 이름 변경:', key);
        if (newKey && newKey !== key && !(newKey in units[selectedIndex])) {
            units[selectedIndex][newKey] = units[selectedIndex][key];
            delete units[selectedIndex][key];
            renderUnitInfo(units[selectedIndex]);
            renderUnitList();
        } else if (newKey === key) {
            showNotification('기존 이름과 동일합니다.');
        } else if (newKey in units[selectedIndex]) {
            showNotification('이미 존재하는 필드 이름입니다.', true);
        }
    });

    fieldDiv.appendChild(label);

    const input = document.createElement('input');
    input.value = value;
    input.className = 'field-input';

    // id 필드는 읽기 전용으로 설정
    if (key === 'id') {
        input.readOnly = true;
        input.className += ' read-only';
    }

    input.addEventListener('input', (e) => {
        units[selectedIndex][key] = e.target.value;
        if (key === 'name') {
            renderUnitList();
        }
    });

    fieldDiv.appendChild(input);
    unitInfo.appendChild(fieldDiv);
}

function renderPresetList() {
    presetList.innerHTML = '';
    for (const presetName in presets) {
        const div = document.createElement('div');
        div.textContent = presetName;
        div.addEventListener('click', () => {
            const newUnit = JSON.parse(JSON.stringify(presets[presetName]));

            // 간단한 숫자 ID 생성 (0부터 시작해서 1씩 증가)
            const nextId = getNextUnitId();

            // id 속성을 가장 먼저 설정하고, 그 다음에 다른 속성들을 추가
            const orderedUnit = {
                id: nextId.toString(),
            };

            // id를 제외한 나머지 속성들을 복사
            for (const key in newUnit) {
                if (key !== 'id') {
                    orderedUnit[key] = newUnit[key];
                }
            }

            units.push(orderedUnit);
            selectUnit(units.length - 1);  // 새로 추가된 유닛 선택
            renderUnitList();
            presetModal.classList.add('hidden');
        });
        presetList.appendChild(div);
    }
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