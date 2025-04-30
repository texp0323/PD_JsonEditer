import React from 'react';
import JsonViewer from '../common/JsonViewer';

const UnitDetail = ({ 
    unit, 
    template, 
    onUpdateField, 
    onAddArrayItem, 
    onRemoveArrayItem, 
    onUpdateArrayItem, 
    onAddDictItem, 
    onRemoveDictItem, 
    onUpdateDictItem,
    validationStatus // 검증 상태 추가
}) => {
    if (!unit) {
        return (
            <div className="text-center text-gray-500 py-16">
                <p className="text-lg mb-2">유닛이 선택되지 않았습니다</p>
                <p className="text-sm">왼쪽 패널에서 유닛을 선택하거나 새 유닛을 추가하세요.</p>
            </div>
        );
    }

    // 검증 오류가 있는지 확인
    const hasValidationErrors = validationStatus && validationStatus.isInvalid;

    // Render field
    const renderField = (field) => {
        const fieldName = field.PropertyName;
        const value = unit[fieldName];
        
        // 필드가 없거나 정의되지 않았는지 확인
        const fieldMissing = value === undefined;
        // 필드 타입 검사
        const fieldTypeError = !fieldMissing && !isTypeCompatible(value, field.DataType);
        // 필드에 오류가 있는지 여부
        const hasFieldError = fieldMissing || fieldTypeError;

        // 필드 컨테이너 스타일 - 오류가 있으면 빨간색 테두리 추가
        const fieldContainerClass = hasFieldError 
            ? "border-red-300 bg-red-50" 
            : "border-gray-300 bg-white";

        // 필드 오류 메시지
        const errorMessage = fieldMissing 
            ? "이 필드는 템플릿에 정의되어 있지만 유닛 데이터에 없습니다."
            : fieldTypeError 
                ? `타입 오류: ${field.DataType} 타입이 필요하지만 ${getTypeDescription(value)} 타입이 제공되었습니다.`
                : "";

        switch (field.DataType) {
            case 'string':
                return (
                    <div>
                        <input
                            type="text"
                            value={fieldMissing ? "" : value}
                            onChange={(e) => onUpdateField(fieldName, e.target.value)}
                            className={`w-full p-2 border rounded ${fieldContainerClass}`}
                        />
                        {hasFieldError && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
                    </div>
                );
            case 'int':
                return (
                    <div>
                        <input
                            type="number"
                            value={fieldMissing ? 0 : value}
                            onChange={(e) => {
                                const parsedValue = parseInt(e.target.value);
                                const newValue = isNaN(parsedValue) ? 0 : parsedValue;
                                onUpdateField(fieldName, newValue);
                            }}
                            className={`w-full p-2 border rounded ${fieldContainerClass}`}
                        />
                        {hasFieldError && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
                    </div>
                );
            case 'float':
                return (
                    <div>
                        <input
                            type="number"
                            step="0.1"
                            value={fieldMissing ? 0.0 : value}
                            onChange={(e) => {
                                const parsedValue = parseFloat(e.target.value);
                                const newValue = isNaN(parsedValue) ? 0 : parsedValue;
                                onUpdateField(fieldName, newValue);
                            }}
                            className={`w-full p-2 border rounded ${fieldContainerClass}`}
                        />
                        {hasFieldError && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
                    </div>
                );
            case 'bool':
                return (
                    <div>
                        <select
                            value={fieldMissing ? "false" : value.toString()}
                            onChange={(e) => onUpdateField(fieldName, e.target.value === 'true')}
                            className={`w-full p-2 border rounded ${fieldContainerClass}`}
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                        {hasFieldError && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
                    </div>
                );
            case 'array':
                return (
                    <div>
                        <div className={`border rounded p-4 ${hasFieldError ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'}`}>
                            {hasFieldError ? (
                                <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700">
                                    <p className="text-sm font-medium">{errorMessage}</p>
                                    <p className="text-xs mt-1">배열 타입의 필드는 리스트여야 합니다. "배열 항목 추가" 버튼을 클릭하여 이 필드를 초기화하세요.</p>
                                </div>
                            ) : (
                                Array.isArray(value) && value.map((item, idx) => (
                                    <div key={idx} className="flex mb-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => onUpdateArrayItem(fieldName, idx, e.target.value)}
                                            className="flex-grow p-2 border rounded mr-2"
                                        />
                                        <button
                                            onClick={() => onRemoveArrayItem(fieldName, idx)}
                                            className="px-2 py-1 bg-red-500 text-white rounded-lg"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                ))
                            )}
                            <button
                                onClick={() => {
                                    if (fieldMissing || !Array.isArray(value)) {
                                        onUpdateField(fieldName, []); // 필드 초기화
                                    }
                                    onAddArrayItem(fieldName);
                                }}
                                className="px-3 py-1 mt-2 bg-purple-500 text-white rounded-lg btn-sm whitespace-nowrap"
                                style={{ minWidth: '100px' }}
                            >
                                배열 항목 추가
                            </button>
                        </div>
                    </div>
                );
            case 'dict':
                return (
                    <div>
                        <div className={`border rounded p-4 ${hasFieldError ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300'}`}>
                            {hasFieldError ? (
                                <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700">
                                    <p className="text-sm font-medium">{errorMessage}</p>
                                    <p className="text-xs mt-1">딕셔너리 타입의 필드는 key와 value가 있는 객체의 배열이어야 합니다. "항목 추가" 버튼을 클릭하여 이 필드를 초기화하세요.</p>
                                </div>
                            ) : (
                                Array.isArray(value) && value.map((item, idx) => (
                                    <div key={idx} className="flex mb-2">
                                        <input
                                            type="text"
                                            value={item.key}
                                            onChange={(e) => onUpdateDictItem(fieldName, idx, 'key', e.target.value)}
                                            placeholder="Key"
                                            className="flex-grow p-2 border rounded mr-2"
                                        />
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={item.value}
                                            onChange={(e) => {
                                                const inputValue = e.target.value;
                                                const parsedValue = parseFloat(inputValue);
                                                const newValue = inputValue === '' ? 0 : isNaN(parsedValue) ? 0 : parsedValue;
                                                onUpdateDictItem(fieldName, idx, 'value', newValue);
                                            }}
                                            placeholder="Value"
                                            className="flex-grow p-2 border rounded mr-2"
                                        />
                                        <button
                                            onClick={() => onRemoveDictItem(fieldName, idx)}
                                            className="px-2 py-1 bg-red-500 text-white rounded-lg"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                ))
                            )}
                            <button
                                onClick={() => {
                                    if (fieldMissing || !isDictArray(value)) {
                                        onUpdateField(fieldName, []); // 필드 초기화
                                    }
                                    onAddDictItem(fieldName);
                                }}
                                className="px-3 py-1 mt-2 bg-purple-500 text-white rounded-lg btn-sm whitespace-nowrap"
                                style={{ minWidth: '100px' }}
                            >
                                항목 추가
                            </button>
                        </div>
                    </div>
                );
            default:
                return <div>지원되지 않는 데이터 타입: {field.DataType}</div>;
        }
    };

    // 값이 딕셔너리 배열인지 확인
    const isDictArray = (value) => {
        return Array.isArray(value) && value.every(item => 
            typeof item === 'object' && 
            item !== null && 
            'key' in item && 
            'value' in item
        );
    };

    // 값이 지정된 데이터 타입과 호환되는지 확인
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
                return isDictArray(value);
            default:
                return true;
        }
    };
    
    // 값의 타입을 설명하는 문자열 반환
    const getTypeDescription = (value) => {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) {
            if (isDictArray(value)) return 'dict 배열';
            return '배열';
        }
        return typeof value;
    };

    return (
        <div>
            {/* 검증 경고 배너 */}
            {hasValidationErrors && (
                <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-r">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">이 유닛은 템플릿과 일치하지 않습니다.</p>
                            <p className="text-xs mt-1">아래 표시된 필드 오류를 수정하거나, 설정 탭에서 모든 유닛을 자동으로 수정할 수 있습니다.</p>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-bold mb-6 text-gray-800">유닛 상세정보</h2>
            <div className="space-y-5">
                {template.fields.map((field) => (
                    <div key={field.PropertyName} className="mb-5">
                        <label className="block mb-2 font-medium text-gray-700">
                            {field.PropertyName} <span className="text-sm text-gray-500">({field.DataType})</span>
                        </label>
                        {renderField(field)}
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <JsonViewer title="유닛 데이터 JSON" data={{ units: [unit] }} />
            </div>
        </div>
    );
};

export default UnitDetail;