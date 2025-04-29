import React, { useState, useEffect } from 'react';
import _ from 'lodash';

// Initial template data
const initialTemplate = {
    fields: [
        { PropertyName: "id", DataType: "string" },
        { PropertyName: "name", DataType: "string" },
        { PropertyName: "type", DataType: "string" },
        { PropertyName: "hp", DataType: "int" },
        { PropertyName: "attack", DataType: "int" },
        { PropertyName: "defense", DataType: "int" },
        { PropertyName: "speed", DataType: "float" },
        { PropertyName: "isActive", DataType: "bool" },
        { PropertyName: "skills", DataType: "array" },
        { PropertyName: "equipment", DataType: "dict" }
    ]
};

// Available data types
const availableDataTypes = ["string", "int", "float", "bool", "array", "dict"];

// Function to create unit from template
const createUnitFromTemplate = (template, id) => {
    const unit = {};
    template.fields.forEach(field => {
        switch (field.DataType) {
            case 'string':
                unit[field.PropertyName] = field.PropertyName === 'id' ? id : '';
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

const UnitEditor = () => {
    const [template, setTemplate] = useState(initialTemplate);
    const [units, setUnits] = useState([]);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [nextUnitId, setNextUnitId] = useState(1);
    const [activeTab, setActiveTab] = useState('unit'); // 'unit', 'template', 'settings'
    const [settings, setSettings] = useState({
        templatePath: './assets/data/template.json',
        unitDataPath: './assets/data/unitData.json'
    });

    // Add unit
    const addUnit = () => {
        const id = `unit_${nextUnitId}`;
        const newUnit = createUnitFromTemplate(template, id);
        newUnit.name = `Unit ${nextUnitId}`;
        setUnits([...units, newUnit]);
        setNextUnitId(nextUnitId + 1);
        setSelectedUnitId(id);
    };

    // Delete unit
    const deleteUnit = (id) => {
        const filteredUnits = units.filter(unit => unit.id !== id);
        setUnits(filteredUnits);
        if (selectedUnitId === id) {
            setSelectedUnitId(filteredUnits.length > 0 ? filteredUnits[0].id : null);
        }
    };

    // Get selected unit
    const getSelectedUnit = () => {
        return units.find(unit => unit.id === selectedUnitId) || null;
    };

    // Update unit field
    const updateUnitField = (propertyName, value) => {
        const updatedUnits = units.map(unit => {
            if (unit.id === selectedUnitId) {
                return { ...unit, [propertyName]: value };
            }
            return unit;
        });
        setUnits(updatedUnits);
    };

    // Add dictionary item
    const addDictItem = (propertyName) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const newItem = { key: "", value: 0 };
        const updatedDictItems = [...selectedUnit[propertyName], newItem];
        updateUnitField(propertyName, updatedDictItems);
    };

    // Remove dictionary item
    const removeDictItem = (propertyName, index) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedDictItems = [...selectedUnit[propertyName]];
        updatedDictItems.splice(index, 1);
        updateUnitField(propertyName, updatedDictItems);
    };

    // Update dictionary item
    const updateDictItem = (propertyName, index, field, value) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedDictItems = [...selectedUnit[propertyName]];
        updatedDictItems[index] = { ...updatedDictItems[index], [field]: value };
        updateUnitField(propertyName, updatedDictItems);
    };

    // Add array item
    const addArrayItem = (propertyName) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedArray = [...selectedUnit[propertyName], ""];
        updateUnitField(propertyName, updatedArray);
    };

    // Remove array item
    const removeArrayItem = (propertyName, index) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedArray = [...selectedUnit[propertyName]];
        updatedArray.splice(index, 1);
        updateUnitField(propertyName, updatedArray);
    };

    // Update array item
    const updateArrayItem = (propertyName, index, value) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return;

        const updatedArray = [...selectedUnit[propertyName]];
        updatedArray[index] = value;
        updateUnitField(propertyName, updatedArray);
    };

    // Get unit data JSON
    const getUnitDataJson = () => {
        return JSON.stringify({ units }, null, 2);
    };

    // Add template field
    const addTemplateField = () => {
        const newField = {
            PropertyName: "newProperty",
            DataType: "string"
        };
        setTemplate({
            ...template,
            fields: [...template.fields, newField]
        });
    };

    // Remove template field
    const removeTemplateField = (index) => {
        const updatedFields = [...template.fields];
        updatedFields.splice(index, 1);
        setTemplate({
            ...template,
            fields: updatedFields
        });
    };

    // Update template field
    const updateTemplateField = (index, field, value) => {
        const updatedFields = [...template.fields];
        updatedFields[index] = {
            ...updatedFields[index],
            [field]: value
        };
        setTemplate({
            ...template,
            fields: updatedFields
        });
    };

    // Apply template changes
    const applyTemplateChanges = () => {
        // Apply template changes to existing units (add new fields)
        const updatedUnits = units.map(unit => {
            const updatedUnit = { ...unit };

            template.fields.forEach(field => {
                // Initialize with default value only if field doesn't exist
                if (updatedUnit[field.PropertyName] === undefined) {
                    switch (field.DataType) {
                        case 'string':
                            updatedUnit[field.PropertyName] = '';
                            break;
                        case 'int':
                            updatedUnit[field.PropertyName] = 0;
                            break;
                        case 'float':
                            updatedUnit[field.PropertyName] = 0.0;
                            break;
                        case 'bool':
                            updatedUnit[field.PropertyName] = false;
                            break;
                        case 'array':
                            updatedUnit[field.PropertyName] = [];
                            break;
                        case 'dict':
                            updatedUnit[field.PropertyName] = [];
                            break;
                        default:
                            updatedUnit[field.PropertyName] = null;
                    }
                }
            });

            return updatedUnit;
        });

        setUnits(updatedUnits);
        setActiveTab('unit');
    };

    // Update settings
    const updateSettings = (field, value) => {
        setSettings({
            ...settings,
            [field]: value
        });
    };

    // Save file (Electron environment)
    const saveFile = async (filePath, content) => {
        try {
            // In Electron environment, use electronAPI
            if (window.electronAPI) {
                const result = await window.electronAPI.saveFile({
                    filePath,
                    content: JSON.stringify(content, null, 2)
                });

                if (result.success) {
                    alert(`File saved successfully: ${filePath}`);
                } else {
                    alert(`File save failed: ${result.error}`);
                }
            } else {
                // In web environment, handle with download
                downloadFile(JSON.stringify(content, null, 2), filePath.split('/').pop());
            }
        } catch (error) {
            alert(`File save error: ${error.message}`);
        }
    };

    // Download file in web environment
    const downloadFile = (content, filename) => {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Save template
    const saveTemplate = () => {
        if (window.electronAPI) {
            saveFile(settings.templatePath, template);
        } else {
            const filename = settings.templatePath.split('/').pop();
            downloadFile(JSON.stringify(template, null, 2), filename);
        }
    };

    // Save unit data
    const saveUnitData = () => {
        if (window.electronAPI) {
            saveFile(settings.unitDataPath, { units });
        } else {
            const filename = settings.unitDataPath.split('/').pop();
            downloadFile(JSON.stringify({ units }, null, 2), filename);
        }
    };

    // Save all data
    const saveAllData = () => {
        saveTemplate();
        saveUnitData();
    };

    // Load file (Electron environment)
    const loadFile = async (filePath, callback) => {
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.readFile({ filePath });

                if (result.success) {
                    const data = JSON.parse(result.content);
                    callback(data);
                    alert(`File loaded successfully: ${filePath}`);
                } else {
                    alert(`File load failed: ${result.error}`);
                }
            }
        } catch (error) {
            alert(`File load error: ${error.message}`);
        }
    };

    // Load file dialog (Electron environment)
    const loadFileDialog = async (callback) => {
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.showOpenDialog();

                if (result.success && !result.canceled) {
                    const data = JSON.parse(result.content);
                    callback(data);
                    return result.filePath;
                }
            }
        } catch (error) {
            alert(`File load error: ${error.message}`);
        }
        return null;
    };

    // Load file in web environment
    const loadFileWeb = (file, callback) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                callback(data);
            } catch (error) {
                alert('File parse error: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    // Load template file
    const loadTemplateFile = (e) => {
        if (window.electronAPI) {
            loadFileDialog((data) => {
                if (data && data.fields) {
                    setTemplate(data);
                } else {
                    alert('Invalid template format.');
                }
            }).then(filePath => {
                if (filePath) updateSettings('templatePath', filePath);
            });
        } else {
            const file = e.target.files[0];
            if (!file) return;

            loadFileWeb(file, (data) => {
                if (data && data.fields) {
                    setTemplate(data);
                } else {
                    alert('Invalid template format.');
                }
            });
        }
    };

    // Load unit data file
    const loadUnitDataFile = (e) => {
        if (window.electronAPI) {
            loadFileDialog((data) => {
                if (data && data.units) {
                    setUnits(data.units);
                    if (data.units.length > 0) {
                        setSelectedUnitId(data.units[0].id);

                        // Set next ID
                        const lastId = Math.max(...data.units.map(unit => {
                            const idMatch = unit.id.match(/unit_(\d+)/);
                            return idMatch ? parseInt(idMatch[1]) : 0;
                        }));
                        setNextUnitId(lastId + 1);
                    }
                } else {
                    alert('Invalid unit data format.');
                }
            }).then(filePath => {
                if (filePath) updateSettings('unitDataPath', filePath);
            });
        } else {
            const file = e.target.files[0];
            if (!file) return;

            loadFileWeb(file, (data) => {
                if (data && data.units) {
                    setUnits(data.units);
                    if (data.units.length > 0) {
                        setSelectedUnitId(data.units[0].id);

                        // Set next ID
                        const lastId = Math.max(...data.units.map(unit => {
                            const idMatch = unit.id.match(/unit_(\d+)/);
                            return idMatch ? parseInt(idMatch[1]) : 0;
                        }));
                        setNextUnitId(lastId + 1);
                    }
                } else {
                    alert('Invalid unit data format.');
                }
            });
        }
    };

    // Render field
    const renderField = (field) => {
        const selectedUnit = getSelectedUnit();
        if (!selectedUnit) return null;

        const value = selectedUnit[field.PropertyName];

        switch (field.DataType) {
            case 'string':
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => updateUnitField(field.PropertyName, e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                );
            case 'int':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => updateUnitField(field.PropertyName, parseInt(e.target.value) || 0)}
                        className="w-full p-2 border rounded"
                    />
                );
            case 'float':
                return (
                    <input
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) => updateUnitField(field.PropertyName, parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border rounded"
                    />
                );
            case 'bool':
                return (
                    <select
                        value={value.toString()}
                        onChange={(e) => updateUnitField(field.PropertyName, e.target.value === 'true')}
                        className="w-full p-2 border rounded"
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                );
            case 'array':
                return (
                    <div className="border rounded p-2">
                        {value.map((item, idx) => (
                            <div key={idx} className="flex mb-2">
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateArrayItem(field.PropertyName, idx, e.target.value)}
                                    className="flex-grow p-2 border rounded mr-2"
                                />
                                <button
                                    onClick={() => removeArrayItem(field.PropertyName, idx)}
                                    className="px-2 bg-red-500 text-white rounded"
                                >
                                    X
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => addArrayItem(field.PropertyName)}
                            className="px-3 py-1 bg-blue-500 text-white rounded mt-2"
                        >
                            Add
                        </button>
                    </div>
                );
            case 'dict':
                return (
                    <div className="border rounded p-2">
                        {value.map((item, idx) => (
                            <div key={idx} className="flex mb-2">
                                <input
                                    type="text"
                                    value={item.key}
                                    onChange={(e) => updateDictItem(field.PropertyName, idx, 'key', e.target.value)}
                                    placeholder="Key"
                                    className="flex-grow p-2 border rounded mr-2"
                                />
                                <input
                                    type="number"
                                    step="0.1"
                                    value={item.value}
                                    onChange={(e) => updateDictItem(field.PropertyName, idx, 'value', parseFloat(e.target.value) || 0)}
                                    placeholder="Value"
                                    className="flex-grow p-2 border rounded mr-2"
                                />
                                <button
                                    onClick={() => removeDictItem(field.PropertyName, idx)}
                                    className="px-2 bg-red-500 text-white rounded"
                                >
                                    X
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => addDictItem(field.PropertyName)}
                            className="px-3 py-1 bg-blue-500 text-white rounded mt-2"
                        >
                            Add
                        </button>
                    </div>
                );
            default:
                return <div>Unsupported data type: {field.DataType}</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Panel: Unit List */}
            <div className="w-1/3 bg-white p-4 overflow-auto border-r">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Unit List</h2>
                    <button
                        onClick={addUnit}
                        className="px-3 py-1 bg-green-500 text-white rounded"
                    >
                        Add Unit
                    </button>
                </div>

                <div className="space-y-2">
                    {units.map((unit) => (
                        <div
                            key={unit.id}
                            className={`p-3 border rounded cursor-pointer flex justify-between items-center ${selectedUnitId === unit.id ? 'bg-blue-100 border-blue-500' : ''}`}
                            onClick={() => setSelectedUnitId(unit.id)}
                        >
                            <div>
                                <div className="font-semibold">{unit.name}</div>
                                <div className="text-sm text-gray-500">ID: {unit.id}</div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteUnit(unit.id);
                                }}
                                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>

                {units.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        No units available. Click "Add Unit" to create one.
                    </div>
                )}

                {/* File Save Button */}
                <div className="mt-6 pt-4 border-t">
                    <button
                        onClick={saveAllData}
                        className="w-full py-2 bg-blue-500 text-white rounded flex justify-center items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                        </svg>
                        Save All Data
                    </button>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <label className="block text-center py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300">
                            <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                            </svg>
                            Load Template
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={loadTemplateFile}
                            />
                        </label>

                        <label className="block text-center py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300">
                            <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                            </svg>
                            Load Unit Data
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={loadUnitDataFile}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Right Panel: Unit Details / Template Editor / Settings */}
            <div className="w-2/3 p-4 overflow-auto">
                {/* Tab Menu */}
                <div className="flex mb-4 border-b">
                    <button
                        className={`px-4 py-2 ${activeTab === 'unit'
                            ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                            : 'text-gray-500'}`}
                        onClick={() => setActiveTab('unit')}
                    >
                        Unit Details
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'template'
                            ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                            : 'text-gray-500'}`}
                        onClick={() => setActiveTab('template')}
                    >
                        Template Editor
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'settings'
                            ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                            : 'text-gray-500'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
                    </button>
                </div>

                {/* Unit Details Tab */}
                {activeTab === 'unit' && (
                    selectedUnitId ? (
                        <>
                            <h2 className="text-xl font-bold mb-4">Unit Details</h2>
                            <div className="space-y-4">
                                {template.fields.map((field) => (
                                    <div key={field.PropertyName} className="mb-4">
                                        <label className="block mb-2 font-medium">
                                            {field.PropertyName} ({field.DataType})
                                        </label>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-gray-100 rounded">
                                <h3 className="text-lg font-bold mb-2">Unit Data JSON</h3>
                                <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto text-sm">
                                    {getUnitDataJson()}
                                </pre>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-gray-500 mt-16">
                            Select a unit from the left panel or add a new one.
                        </div>
                    )
                )}

                {/* Template Editor Tab */}
                {activeTab === 'template' && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Template Editor</h2>
                            <div>
                                <button
                                    onClick={addTemplateField}
                                    className="px-3 py-1 bg-green-500 text-white rounded mr-2"
                                >
                                    Add Field
                                </button>
                                <button
                                    onClick={applyTemplateChanges}
                                    className="px-3 py-1 bg-blue-500 text-white rounded"
                                >
                                    Apply Changes
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 mb-4">
                            {template.fields.map((field, index) => (
                                <div key={index} className="flex items-center space-x-2 p-3 border rounded">
                                    <div className="flex-grow">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Property Name</label>
                                                <input
                                                    type="text"
                                                    value={field.PropertyName}
                                                    onChange={(e) => updateTemplateField(index, 'PropertyName', e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Data Type</label>
                                                <select
                                                    value={field.DataType}
                                                    onChange={(e) => updateTemplateField(index, 'DataType', e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                >
                                                    {availableDataTypes.map(type => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeTemplateField(index)}
                                        className="px-2 py-1 bg-red-500 text-white rounded self-end"
                                        disabled={template.fields.length <= 1}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-gray-100 rounded">
                            <h3 className="text-lg font-bold mb-2">Template JSON</h3>
                            <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto text-sm">
                                {JSON.stringify(template, null, 2)}
                            </pre>
                        </div>

                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                            <h3 className="text-lg font-medium text-yellow-800 mb-2">Important Note</h3>
                            <p className="text-yellow-700">
                                Changing the template will add new fields to existing units. The structure of existing units may change.
                                Click "Apply Changes" to apply the modifications.
                            </p>
                        </div>
                    </>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <>
                        <h2 className="text-xl font-bold mb-4">Settings</h2>

                        <div className="space-y-4 mb-4">
                            <div className="p-4 border rounded">
                                <label className="block text-sm font-medium mb-2">Template File Path</label>
                                <input
                                    type="text"
                                    value={settings.templatePath}
                                    onChange={(e) => updateSettings('templatePath', e.target.value)}
                                    className="w-full p-2 border rounded mb-2"
                                    placeholder="e.g. ./assets/data/template.json"
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={saveTemplate}
                                        className="px-3 py-1 bg-blue-500 text-white rounded flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                                        </svg>
                                        Save
                                    </button>
                                    <label className="px-3 py-1 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                        </svg>
                                        Load
                                        <input
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            onChange={loadTemplateFile}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="p-4 border rounded">
                                <label className="block text-sm font-medium mb-2">Unit Data File Path</label>
                                <input
                                    type="text"
                                    value={settings.unitDataPath}
                                    onChange={(e) => updateSettings('unitDataPath', e.target.value)}
                                    className="w-full p-2 border rounded mb-2"
                                    placeholder="e.g. ./assets/data/unitData.json"
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={saveUnitData}
                                        className="px-3 py-1 bg-blue-500 text-white rounded flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                                        </svg>
                                        Save
                                    </button>
                                    <label className="px-3 py-1 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                        </svg>
                                        Load
                                        <input
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            onChange={loadUnitDataFile}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={saveAllData}
                                className="px-4 py-2 bg-green-500 text-white rounded flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                                </svg>
                                Save All Data
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                            <h3 className="text-lg font-medium text-blue-800 mb-2">Help</h3>
                            <ul className="list-disc pl-5 text-blue-700 space-y-1">
                                <li>Set file paths to define where to save templates and unit data.</li>
                                <li>Click the Save button to download with the specified file name.</li>
                                <li>Click the Load button to load existing templates or unit data.</li>
                                <li>In Electron environment, files are saved to the file system. In the web environment, they are downloaded.</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UnitEditor;