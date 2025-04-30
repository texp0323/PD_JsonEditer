// 템플릿을 기반으로 유닛 생성
export const createUnitFromTemplate = (template, id) => {
    const unit = {};
    template.fields.forEach(field => {
        switch (field.DataType) {
            case 'string':
                unit[field.PropertyName] = field.PropertyName === 'id' ? id : '';
                break;
            case 'int':
                unit[field.PropertyName] = 0;
                break;
            case 'float':
                unit[field.PropertyName] = 0.0;
                break;
            case 'bool':
                unit[field.PropertyName] = false;
                break;
            case 'array':
                unit[field.PropertyName] = [];
                break;
            case 'dict':
                unit[field.PropertyName] = [];
                break;
            default:
                unit[field.PropertyName] = null;
        }
    });
    return unit;
};

// 기존 유닛에 템플릿 변경사항 적용
export const applyTemplateToUnits = (units, template) => {
    return units.map(unit => {
        const updatedUnit = { ...unit };

        template.fields.forEach(field => {
            // 필드가 없을 경우에만 기본값으로 초기화
            if (updatedUnit[field.PropertyName] === undefined) {
                switch (field.DataType) {
                    case 'string':
                        updatedUnit[field.PropertyName] = '';
                        break;
                    case 'int':
                        updatedUnit[field.PropertyName] = 0;
                        break;
                    case 'float':
                        updatedUnit[field.PropertyName] = 0.0;
                        break;
                    case 'bool':
                        updatedUnit[field.PropertyName] = false;
                        break;
                    case 'array':
                        updatedUnit[field.PropertyName] = [];
                        break;
                    case 'dict':
                        updatedUnit[field.PropertyName] = [];
                        break;
                    default:
                        updatedUnit[field.PropertyName] = null;
                }
            }
        });

        return updatedUnit;
    });
};

// 데이터에서 다음 유닛 ID 추출
export const getNextUnitId = (units) => {
    try {
        // 모든 ID에서 숫자 부분만 추출 시도
        const idNumbers = units.map(unit => {
            const matches = String(unit.id).match(/\d+/g);
            return matches ? Math.max(...matches.map(Number)) : 0;
        }).filter(num => !isNaN(num));
        
        // 유효한 숫자가 있으면 최대값 + 1, 없으면 1 사용
        return (idNumbers.length > 0 ? Math.max(...idNumbers) : 0) + 1;
    } catch (error) {
        // 오류 발생 시 안전하게 1부터 시작
        return 1;
    }
};