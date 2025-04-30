// src/utils/templateValidationUtils.js

/**
 * 템플릿과 유닛 데이터의 호환성을 검증합니다.
 * @param {Object} unit 검증할 유닛 데이터
 * @param {Object} template 템플릿 정보
 * @returns {Object} 검증 결과 (isValid, missingFields, typeErrors, validationErrors)
 */
export const validateUnitAgainstTemplate = (unit, template) => {
  if (!unit || !template || !template.fields) {
    return {
      isValid: false,
      missingFields: [],
      typeErrors: [],
      validationErrors: ['유닛 또는 템플릿 데이터가 유효하지 않습니다.']
    };
  }

  const missingFields = [];
  const typeErrors = [];
  const validationErrors = [];

  // 템플릿의 모든 필드가 유닛에 존재하는지 확인
  template.fields.forEach(field => {
    const fieldName = field.PropertyName;

    // 필드가 유닛에 없는 경우
    if (unit[fieldName] === undefined) {
      missingFields.push(fieldName);
    } 
    // 필드가 있지만 타입이 일치하지 않는 경우
    else if (!isTypeCompatible(unit[fieldName], field.DataType)) {
      typeErrors.push({
        field: fieldName,
        expectedType: field.DataType,
        actualValue: unit[fieldName]
      });
    }
  });

  // 유효성 검사 통과 여부
  const isValid = missingFields.length === 0 && typeErrors.length === 0;

  // 요약 오류 메시지 생성
  if (missingFields.length > 0) {
    validationErrors.push(`누락된 필드: ${missingFields.join(', ')}`);
  }
  
  if (typeErrors.length > 0) {
    typeErrors.forEach(error => {
      validationErrors.push(
        `타입 오류: ${error.field} - 기대값: ${error.expectedType}, 실제값: ${getTypeDescription(error.actualValue)}`
      );
    });
  }

  return {
    isValid,
    missingFields,
    typeErrors,
    validationErrors
  };
};

/**
 * 값이 지정된 데이터 타입과 호환되는지 확인합니다.
 */
const isTypeCompatible = (value, dataType) => {
  switch (dataType) {
    case 'string':
      return typeof value === 'string';
    case 'int':
      return Number.isInteger(value);
    case 'float':
      return typeof value === 'number';
    case 'bool':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'dict':
      return Array.isArray(value) && value.every(item => 
        typeof item === 'object' && 
        item !== null && 
        'key' in item && 
        'value' in item
      );
    default:
      return true; // 알 수 없는 타입은 기본적으로 통과
  }
};

/**
 * 값의 타입을 문자열로 설명합니다.
 */
const getTypeDescription = (value) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) {
    if (value.length === 0) return '빈 배열';
    if (value[0] && typeof value[0] === 'object' && 'key' in value[0] && 'value' in value[0]) {
      return 'dict-like 배열';
    }
    return '배열';
  }
  return typeof value;
};

/**
 * 유닛 데이터가 템플릿에 맞지 않을 경우 초기화하여 복구합니다.
 * @param {Object} unit 복구할 유닛 데이터
 * @param {Object} template 템플릿 정보
 * @returns {Object} 복구된 유닛 데이터
 */
export const repairUnitData = (unit, template) => {
  if (!unit || !template || !template.fields) {
    return null;
  }

  const repairedUnit = { ...unit };

  // 모든 템플릿 필드 검사
  template.fields.forEach(field => {
    const fieldName = field.PropertyName;

    // 필드가 없거나 타입이 맞지 않으면 기본값으로 초기화
    if (repairedUnit[fieldName] === undefined || !isTypeCompatible(repairedUnit[fieldName], field.DataType)) {
      // 기본값 설정
      switch (field.DataType) {
        case 'string':
          repairedUnit[fieldName] = '';
          break;
        case 'int':
          repairedUnit[fieldName] = 0;
          break;
        case 'float':
          repairedUnit[fieldName] = 0.0;
          break;
        case 'bool':
          repairedUnit[fieldName] = false;
          break;
        case 'array':
          repairedUnit[fieldName] = [];
          break;
        case 'dict':
          repairedUnit[fieldName] = [];
          break;
        default:
          repairedUnit[fieldName] = null;
      }
    }
  });

  return repairedUnit;
};

/**
 * 템플릿을 적용하여 여러 유닛 데이터를 확인하고 복구합니다.
 * @param {Array} units 복구할 유닛 배열
 * @param {Object} template 템플릿 정보
 * @returns {Object} 검증 및 복구 결과
 */
export const validateAndRepairUnits = (units, template) => {
  if (!Array.isArray(units) || !template || !template.fields) {
    return {
      valid: [],
      invalid: [],
      repaired: [],
      validationSummary: '유효하지 않은 데이터'
    };
  }

  const valid = [];
  const invalid = [];
  const repaired = [];
  const errorSummaries = [];

  units.forEach(unit => {
    const validation = validateUnitAgainstTemplate(unit, template);
    
    if (validation.isValid) {
      valid.push(unit);
    } else {
      invalid.push({
        unit,
        errors: validation.validationErrors
      });
      
      const repairedUnit = repairUnitData(unit, template);
      repaired.push(repairedUnit);
      
      // 오류 요약 메시지 추가
      if (unit.id) {
        errorSummaries.push(`유닛 ID ${unit.id || '알 수 없음'}: ${validation.validationErrors.join(', ')}`);
      }
    }
  });

  return {
    valid,
    invalid,
    repaired,
    validationSummary: errorSummaries.length > 0 
      ? `${errorSummaries.length}개의 유닛이 템플릿과 일치하지 않습니다.` 
      : '모든 유닛이 템플릿과 일치합니다.',
    errorDetails: errorSummaries
  };
};
