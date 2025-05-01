export const createUnitFromTemplate = (template, id) => {
    const unit = {};
    template.fields.forEach(field => {
        switch (field.DataType) {
            case 'string':
                if (field.PropertyName === 'PrimaryKey') {
                    unit[field.PropertyName] = id;
                } else {
                    unit[field.PropertyName] = '';
                }
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

export const applyTemplateToUnits = (units, template) => {
    return units.map(unit => {
        // 템플릿 필드만 포함하는 새 객체 생성 (다른 필드는 제거)
        const updatedUnit = {};

        // PrimaryKey 먼저 처리
        if (unit.PrimaryKey !== undefined) {
            updatedUnit.PrimaryKey = unit.PrimaryKey;
        } else if (unit.id !== undefined) {
            updatedUnit.PrimaryKey = unit.id;
        } else {
            updatedUnit.PrimaryKey = `unit_${Math.floor(Math.random() * 10000)}`;
        }

        // 템플릿에 정의된 필드만 복사
        template.fields.forEach(field => {
            const fieldName = field.PropertyName;
            
            // 필드가 유닛에 있으면 복사, 없으면 기본값 설정
            if (fieldName !== 'PrimaryKey') { // PrimaryKey는 이미 처리함
                if (unit[fieldName] !== undefined) {
                    updatedUnit[fieldName] = unit[fieldName];
                } else {
                    // 기본값 설정
                    switch (field.DataType) {
                        case 'string':
                            updatedUnit[fieldName] = '';
                            break;
                        case 'int':
                            updatedUnit[fieldName] = 0;
                            break;
                        case 'float':
                            updatedUnit[fieldName] = 0.0;
                            break;
                        case 'bool':
                            updatedUnit[fieldName] = false;
                            break;
                        case 'array':
                            updatedUnit[fieldName] = [];
                            break;
                        case 'dict':
                            updatedUnit[fieldName] = [];
                            break;
                        default:
                            updatedUnit[fieldName] = null;
                    }
                }
            }
        });

        return updatedUnit;
    });
};

export const getNextUnitId = (units) => {
    try {
        const idNumbers = units.map(unit => {
            const primaryKey = unit.PrimaryKey || unit.id || '';
            const matches = String(primaryKey).match(/\d+/g);
            return matches ? Math.max(...matches.map(Number)) : 0;
        }).filter(num => !isNaN(num));
        
        return (idNumbers.length > 0 ? Math.max(...idNumbers) : 0) + 1;
    } catch (error) {
        console.error('다음 ID 생성 오류:', error);
        return 1;
    }
};