import React from 'react';

const FilePathInput = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    onSave, 
    onLoad,
    saveButtonText = "저장",
    loadButtonText = "불러오기",
    accept = ".json"
}) => {
    return (
        <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">{label}</label>
            <div className="flex items-center">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-grow p-2 border rounded-lg mr-2"
                    placeholder={placeholder}
                />
                <div className="flex space-x-2">
                    <button
                        onClick={onSave}
                        className="px-3 py-2 bg-purple-500 text-white rounded-lg inline-flex items-center justify-center hover:bg-purple-600 whitespace-nowrap"
                        style={{ minWidth: '80px' }}
                    >
                        {saveButtonText}
                    </button>
                    <label className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 inline-flex items-center justify-center whitespace-nowrap" style={{ minWidth: '100px' }}>
                        {loadButtonText}
                        <input
                            type="file"
                            accept={accept}
                            className="hidden"
                            onChange={onLoad}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default FilePathInput;