import React from 'react';

const TabNavigation = ({ activeTab, setActiveTab, tabs }) => {
    return (
        <div className="flex p-4 bg-gray-50">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`px-5 py-3 ${activeTab === tab.id
                        ? 'border-b-2 border-purple-500 text-purple-600 font-medium'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default TabNavigation;