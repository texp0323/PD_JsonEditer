import React from 'react';
import FilePathInput from '../common/FilePathInput';

const Settings = ({ 
    settings, 
    onUpdateSettings, 
    onSaveTemplate, 
    onLoadTemplate,
    onSaveUnitData, 
    onLoadUnitData,
    onSaveAllData,
    onGenerateCSharpClass
}) => {
    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-gray-800">설정</h2>

            <div className="space-y-6 mb-6">
                <div className="p-5 border rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">파일 저장 경로</h3>
                    <div className="space-y-4">
                        <FilePathInput
                            label="템플릿 파일 경로"
                            value={settings.templatePath}
                            onChange={(value) => onUpdateSettings('templatePath', value)}
                            placeholder="e.g. ./assets/data/template.json"
                            onSave={onSaveTemplate}
                            onLoad={onLoadTemplate}
                        />

                        <FilePathInput
                            label="유닛 데이터 파일 경로"
                            value={settings.unitDataPath}
                            onChange={(value) => onUpdateSettings('unitDataPath', value)}
                            placeholder="e.g. ./assets/data/unitData.json"
                            onSave={onSaveUnitData}
                            onLoad={onLoadUnitData}
                        />
                    </div>
                </div>

                {/* C# 클래스 생성 설정 */}
                <div className="p-5 border rounded-lg shadow-sm bg-purple-50">
                    <h3 className="text-lg font-medium text-purple-700 mb-4">C# 클래스 생성 설정</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">C# 클래스 저장 경로</label>
                            <input
                                type="text"
                                value={settings.csharpClassPath}
                                onChange={(e) => onUpdateSettings('csharpClassPath', e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                placeholder="e.g. ./Assets/Scripts/GameData/"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">C# 클래스 이름</label>
                            <input
                                type="text"
                                value={settings.csharpClassName}
                                onChange={(e) => onUpdateSettings('csharpClassName', e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                placeholder="e.g. UnitData"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">C# 네임스페이스</label>
                            <input
                                type="text"
                                value={settings.csharpNamespace}
                                onChange={(e) => onUpdateSettings('csharpNamespace', e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                placeholder="e.g. GameData"
                            />
                        </div>
                        
                        <button 
                            onClick={onGenerateCSharpClass}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg mt-2 inline-flex items-center justify-center whitespace-nowrap"
                            style={{ minWidth: '200px' }}
                        >
                            C# 클래스 생성 및 저장
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={onSaveAllData}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg inline-flex items-center justify-center shadow hover:bg-green-600 whitespace-nowrap"
                    style={{ minWidth: '160px' }}
                >
                    모든 데이터 저장
                </button>
            </div>

            <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-lg note note-info">
                <h3 className="text-lg font-medium text-blue-800 mb-2">도움말</h3>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>템플릿과 유닛 데이터를 저장할 파일 경로를 설정합니다.</li>
                    <li>저장 버튼을 클릭하여 지정된 파일 이름으로 다운로드합니다.</li>
                    <li>불러오기 버튼을 클릭하여 기존 템플릿이나 유닛 데이터를 불러옵니다.</li>
                    <li>UnitEditor 실행 시 마지막으로 저장한 경로의 파일들이 자동으로 로드됩니다.</li>
                    <li>템플릿과 일치하지 않는 유닛 데이터는 자동으로 수정됩니다.</li>
                    <li>Electron 환경에서는 파일 시스템에 저장됩니다. 웹 환경에서는 다운로드됩니다.</li>
                    <li>C# 클래스 설정에서 템플릿 기반 C# 클래스의 생성 옵션을 지정할 수 있습니다.</li>
                </ul>
            </div>
        </div>
    );
};

export default Settings;