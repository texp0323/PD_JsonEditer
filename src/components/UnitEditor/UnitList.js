import React from 'react';

const UnitList = ({ units, selectedUnitId, onSelectUnit, onAddUnit, onDeleteUnit, invalidUnitIds = [] }) => {
    return (
        <div className="w-1-3 bg-white p-6 overflow-auto border-r shadow" style={{ width: '33.333%', flexShrink: 0 }}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">유닛 목록</h2>
                <button
                    onClick={onAddUnit}
                    className="px-4 py-2 bg-green-500 text-white rounded shadow-sm inline-flex items-center justify-center whitespace-nowrap"
                    style={{ minWidth: '120px' }}
                >
                    유닛 추가
                </button>
            </div>

            {/* 템플릿 불일치 유닛 수 표시 */}
            {invalidUnitIds.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-r">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-yellow-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">
                            {invalidUnitIds.length}개의 유닛이 템플릿과 일치하지 않습니다.
                        </span>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {units.map((unit) => {
                    // PrimaryKey를 ID로 사용
                    const primaryKey = unit.PrimaryKey || unit.id || '';
                    
                    // 유닛이 템플릿과 일치하지 않는지 확인
                    const isInvalid = invalidUnitIds.includes(primaryKey);
                    
                    return (
                        <div
                            key={primaryKey || `unit-${Math.random()}`}
                            className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center shadow-sm transition-all ${
                                selectedUnitId === primaryKey 
                                    ? isInvalid
                                        ? 'bg-red-50 border-red-500'
                                        : 'bg-purple-50 border-purple-500' 
                                    : isInvalid
                                        ? 'border-red-300 bg-red-50 hover:border-red-500'
                                        : 'border-gray-200 hover:border-purple-200 hover:shadow'
                            }`}
                            onClick={() => onSelectUnit(primaryKey)}
                        >
                            <div>
                                <div className="font-semibold text-gray-800">
                                    {unit.name || '(이름 없음)'}
                                    {isInvalid && (
                                        <span className="ml-2 text-xs inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                            <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            오류
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    PK: {primaryKey === '' ? '(빈 PrimaryKey)' : primaryKey}
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteUnit(primaryKey);
                                }}
                                className="px-2 py-1 bg-red-500 text-white rounded-lg text-sm btn-sm hover:bg-red-600 whitespace-nowrap"
                                style={{ minWidth: '60px' }}
                            >
                                삭제
                            </button>
                        </div>
                    );
                })}
            </div>

            {units.length === 0 && (
                <div className="text-center text-gray-500 mt-12 p-8 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm mb-2">유닛이 없습니다.</p>
                    <p className="text-xs">새로운 유닛을 추가하려면 상단의 "유닛 추가" 버튼을 클릭하세요.</p>
                </div>
            )}
        </div>
    );
};

export default UnitList;