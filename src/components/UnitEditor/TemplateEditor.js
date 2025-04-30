import React from 'react';
import JsonViewer from '../common/JsonViewer';
import { availableDataTypes } from '../../models/initialTemplate';

const TemplateEditor = ({ 
    template, 
    onAddField, 
    onRemoveField, 
    onUpdateField,
    onMoveFieldUp,
    onMoveFieldDown,
    onApplyChanges,
    onGenerateCSharpClass
}) => {
    // 필드 업데이트 핸들러
    const handleFieldUpdate = (index, fieldName, value) => {
        onUpdateField(index, fieldName, value);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">템플릿 편집기</h2>
                <div className="flex space-x-3">
                    <button
                        onClick={onAddField}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-sm inline-flex items-center justify-center whitespace-nowrap"
                        style={{ minWidth: '120px' }}
                    >
                        필드 추가
                    </button>
                    <button
                        onClick={onApplyChanges}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow-sm inline-flex items-center justify-center whitespace-nowrap"
                        style={{ minWidth: '140px' }}
                    >
                        변경사항 적용
                    </button>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                {template.fields.map((field, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg bg-gray-50 shadow-sm">
                        {/* 필드 위치 조정 버튼 */}
                        <div className="flex flex-col space-y-1 mr-2">
                            <button
                                onClick={() => onMoveFieldUp(index)}
                                className="px-2 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                disabled={index === 0}
                                title="위로 이동"
                            >
                                ↑
                            </button>
                            <button
                                onClick={() => onMoveFieldDown(index)}
                                className="px-2 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                disabled={index === template.fields.length - 1}
                                title="아래로 이동"
                            >
                                ↓
                            </button>
                        </div>
                        
                        <div className="flex-grow">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">속성 이름</label>
                                    <input
                                        type="text"
                                        value={field.PropertyName}
                                        onChange={(e) => handleFieldUpdate(index, 'PropertyName', e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">데이터 타입</label>
                                    <select
                                        value={field.DataType}
                                        onChange={(e) => handleFieldUpdate(index, 'DataType', e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        {availableDataTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onRemoveField(index)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg self-end hover:bg-red-600"
                            disabled={template.fields.length <= 1}
                        >
                            삭제
                        </button>
                    </div>
                ))}
            </div>

            <div className="mb-6">
                <JsonViewer title="템플릿 JSON" data={template} />
            </div>

            {/* C# 클래스 생성 섹션 */}
            <div className="p-5 bg-purple-50 border border-purple-200 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-purple-700 mb-3">C# 클래스 생성</h3>
                <p className="text-gray-600 mb-4">
                    현재 템플릿 기반으로 C# 클래스를 생성합니다. 설정 탭에서 클래스 이름과 네임스페이스를 설정할 수 있습니다.
                </p>
                <button
                    onClick={onGenerateCSharpClass}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow-sm inline-flex items-center justify-center whitespace-nowrap"
                    style={{ minWidth: '200px' }}
                >
                    C# 클래스 생성 및 저장
                </button>
            </div>

            <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-lg note note-warning">
                <h3 className="text-lg font-medium text-yellow-700 mb-2">중요 안내</h3>
                <p className="text-gray-600">
                    템플릿을 변경하면 기존 유닛에 새 필드가 추가됩니다. 기존 유닛의 구조가 변경될 수 있습니다.
                    변경사항을 적용하려면 "변경사항 적용" 버튼을 클릭하세요.
                </p>
            </div>
        </div>
    );
};

export default TemplateEditor;