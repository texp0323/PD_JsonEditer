// src/utils/dataMigrationUtils.js

/**
 * 이전 형식의 유닛 데이터(id 사용)를 새 형식(PrimaryKey 사용)으로 마이그레이션합니다.
 * @param {Array} units 마이그레이션할 유닛 배열
 * @returns {Array} 마이그레이션된 유닛 배열
 */
export const migrateUnitsToPrimaryKey = (units) => {
  if (!Array.isArray(units)) {
    console.error('유효하지 않은 유닛 배열:', units);
    return [];
  }

  return units.map(unit => {
    const migratedUnit = { ...unit };

    // id가 있고 PrimaryKey가 없는 경우, id를 PrimaryKey로 복사
    if (migratedUnit.id !== undefined && migratedUnit.PrimaryKey === undefined) {
      migratedUnit.PrimaryKey = migratedUnit.id;
      
      // 옵션: 원래 id 필드 유지 또는 삭제
      // delete migratedUnit.id; // 원하는 경우 이전 id 필드 삭제 가능
    }
    
    // id와 PrimaryKey 모두 없는 경우, 새 PrimaryKey 생성
    if (migratedUnit.id === undefined && migratedUnit.PrimaryKey === undefined) {
      migratedUnit.PrimaryKey = `unit_${Math.floor(Math.random() * 10000)}`;
    }

    return migratedUnit;
  });
};

/**
 * 템플릿 데이터를 PrimaryKey 형식으로 마이그레이션합니다.
 * @param {Object} template 마이그레이션할 템플릿 객체
 * @returns {Object} 마이그레이션된 템플릿 객체
 */
export const migrateTemplateToPrimaryKey = (template) => {
  if (!template || !template.fields || !Array.isArray(template.fields)) {
    console.error('유효하지 않은 템플릿:', template);
    return {
      fields: [
        { PropertyName: "PrimaryKey", DataType: "string", Required: true }
      ]
    };
  }

  const migratedTemplate = { ...template };
  const fields = [...migratedTemplate.fields];

  // id 필드 찾기
  const idFieldIndex = fields.findIndex(field => field.PropertyName === 'id');

  // id 필드가 있으면 PrimaryKey로 변경
  if (idFieldIndex >= 0) {
    fields[idFieldIndex] = {
      ...fields[idFieldIndex],
      PropertyName: 'PrimaryKey',
      Required: true
    };
  } else {
    // id 필드가 없고 PrimaryKey도 없으면 PrimaryKey 필드 추가
    const primaryKeyExists = fields.some(field => field.PropertyName === 'PrimaryKey');
    
    if (!primaryKeyExists) {
      fields.unshift({ PropertyName: "PrimaryKey", DataType: "string", Required: true });
    }
  }

  // PrimaryKey 필드가 첫 번째 위치에 있는지 확인하고 조정
  const primaryKeyIndex = fields.findIndex(field => field.PropertyName === 'PrimaryKey');
  
  if (primaryKeyIndex > 0) {
    // PrimaryKey 필드를 첫 번째로 이동
    const primaryKeyField = fields[primaryKeyIndex];
    fields.splice(primaryKeyIndex, 1);
    fields.unshift(primaryKeyField);
  }

  migratedTemplate.fields = fields;
  return migratedTemplate;
};

/**
 * 이전 형식의 로컬 스토리지 데이터를 마이그레이션합니다.
 */
export const migrateLocalStorageData = () => {
  try {
    // 템플릿 마이그레이션
    const storedTemplate = localStorage.getItem('unitEditor_template');
    if (storedTemplate) {
      try {
        const template = JSON.parse(storedTemplate);
        const migratedTemplate = migrateTemplateToPrimaryKey(template);
        localStorage.setItem('unitEditor_template', JSON.stringify(migratedTemplate, null, 2));
      } catch (error) {
        console.error('템플릿 마이그레이션 오류:', error);
      }
    }

    // 유닛 데이터 마이그레이션
    const storedUnitData = localStorage.getItem('unitEditor_unitData');
    if (storedUnitData) {
      try {
        const unitData = JSON.parse(storedUnitData);
        if (unitData && unitData.units) {
          const migratedUnits = migrateUnitsToPrimaryKey(unitData.units);
          localStorage.setItem('unitEditor_unitData', JSON.stringify({ units: migratedUnits }, null, 2));
        }
      } catch (error) {
        console.error('유닛 데이터 마이그레이션 오류:', error);
      }
    }

    return true;
  } catch (error) {
    console.error('로컬 스토리지 마이그레이션 오류:', error);
    return false;
  }
};