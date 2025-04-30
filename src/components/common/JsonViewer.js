import React from 'react';

const JsonViewer = ({ title, data }) => {
    const jsonString = JSON.stringify(data, null, 2);
    
    return (
        <div className="p-5 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-bold mb-3 text-gray-800">{title}</h3>
            <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
                {jsonString}
            </pre>
        </div>
    );
};

export default JsonViewer;