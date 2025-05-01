import React from 'react';
import JsonViewer from '../common/JsonViewer';
import { availableDataTypes } from '../../models/initialTemplate';

const TemplateEditor = ({ 
    template, 
    onAddField, 
    onRemoveField, 
    onUpdateField,
    onMoveFieldUp,
    onMoveFieldDown
}) => {
    // 필드 업데이트 핸들러
    const handleFieldUpdate = (index, fieldName, value) => {
        // PrimaryKey 필드인 경우 PropertyName 변경을 막음
        if (index === 0 && fieldName === 'PropertyName') {
            alert('PrimaryKey 필드의 이름은 변경할 수 없습니다.');
            return;
        }
        
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
                </div>
            </div>

            <div className="mb-4 p-3 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded-r">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium">
                            PrimaryKey 필드는 필수 항목이며 제거하거나 위치를 변경할 수 없습니다.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                {template.fields.map((field, index) => (
                    <div key={index} className={`flex items-center space-x-3 p-4 border rounded-lg ${index === 0 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'} shadow-sm`}>
                        <div className="flex flex-col space-y-1 mr-2">
                            <button
                                onClick={() => onMoveFieldUp(index)}
                                className="px-2 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                disabled={index === 0} // PrimaryKey는 이동 불가
                                title={index === 0 ? "PrimaryKey는 이동할 수 없습니다" : "위로 이동"}
                            >
                                ↑
                            </button>
                            <button
                                onClick={() => onMoveFieldDown(index)}
                                className="px-2 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                disabled={index === 0 || index === template.fields.length - 1}
                                title={index === 0 ? "PrimaryKey는 이동할 수 없습니다" : "아래로 이동"}
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
                                        disabled={index === 0} // PrimaryKey는 이름 변경 불가
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
                            disabled={index === 0 || template.fields.length <= 1} // PrimaryKey는 삭제 불가
                            title={index === 0 ? "PrimaryKey는 삭제할 수 없습니다" : "삭제"}
                        >
                            삭제
                        </button>
                    </div>
                ))}
            </div>

            <div className="mb-6">
                <JsonViewer title="템플릿 JSON" data={template} />
            </div>
        </div>
    );
};

export default TemplateEditor;