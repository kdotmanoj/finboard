"use client";
import { useState } from 'react';
import { X, Check } from 'lucide-react';
import useStore from '../store/useStore';

export default function AddWidgetModal({ isOpen, onClose }) {
    const addWidget = useStore((state) => state.addWidget);

    const [title, setTitle] = useState('');
    const [apiEndpoint, setApiEndpoint] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [selectedPath, setSelectedPath] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldLabel, setFieldLabel] = useState('');

    const handleTest = async () => {
        if(!apiEndpoint) return;
        setLoading(true);
        setError(null);
        setPreviewData(null);
        setSelectedPath('');

        try{
            const res = await fetch(apiEndpoint);
            if (!res.ok) throw new Error('Failed to fetch');
            
            const data = await res.json();
            setPreviewData(data);
        }catch (err){
            setError(err.message);
        }finally{
            setLoading(false);
        }
    };

    const renderJsonTree = (data, prefix = '') => {
        if(data === null) return <span className="text-gray-400 italic">null</span>;

        if(typeof data === 'object'){
            return (
                <div className="pl-4 border-l-2 border-gray-100 ml-1">
                    {Object.keys(data).map((key) => {
                        const newPath = prefix ? `${prefix}-->${key}` : key;
                        return (
                        <div key={newPath} className="my-1">
                            <span className="font-mono text-xs text-purple-600 font-bold">{key}:</span>
                            {renderJsonTree(data[key], newPath)}
                        </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <button
                type="button"
                onClick={() => {
                    setSelectedPath(prefix);
                    const parts = prefix.split('-->');
                    setFieldLabel(parts[parts.length - 1]); 
                }}
                className={`ml-2 px-2 py-0.5 text-xs rounded border transition-colors
                ${selectedPath === prefix 
                    ? 'bg-green-500 text-white border-green-600 shadow-sm' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
            >
                {String(data)}
            </button>
        );
    };

    const handleSave = () => {
        if(!title || !apiEndpoint || !selectedPath) return;

        addWidget({
            title,
            apiEndpoint,
            dataKey: selectedPath,
            label: fieldLabel || "Value",
            initialData: previewData
        });

        setTitle('');
        setApiEndpoint('');
        setFieldLabel('');
        setPreviewData(null);
        setSelectedPath('');
        onClose();
    };

    if(!isOpen) return null;

    return(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-lg text-gray-800">Configure New Widget</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Widget Title</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Bitcoin Price"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint URL</label>
                            <div className="flex gap-2">
                                <input 
                                type="text" 
                                value={apiEndpoint}
                                onChange={(e) => setApiEndpoint(e.target.value)}
                                placeholder="https://api.example.com/data"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                />
                                <button 
                                onClick={handleTest}
                                disabled={loading || !apiEndpoint}
                                className="bg-blue-600 text-white px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                {loading ? 'Testing...' : 'Test API'}
                                </button>
                            </div>
                            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                        </div>
                    </div>

                    {previewData && (
                        <div className="border rounded-lg overflow-hidden flex flex-col max-h-100">
                            <div className="bg-gray-50 p-2 border-b text-xs font-semibold text-gray-500 uppercase flex justify-between items-center">
                                <span>Select a Data Field</span>
                                {selectedPath && (
                                <span className="text-green-600 flex items-center gap-1 normal-case">
                                    <Check size={12} /> Selected: {selectedPath}
                                </span>
                                )}
                            </div>
                            <div className="p-4 bg-white overflow-auto flex-1 font-mono text-sm">
                                {renderJsonTree(previewData)}
                            </div>

                            {selectedPath && (
                                <div className="p-4 bg-blue-50 border-t border-blue-100 animate-in slide-in-from-bottom-2">
                                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">
                                        Label for Selected Field
                                    </label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={fieldLabel} 
                                            onChange={(e) => setFieldLabel(e.target.value)}
                                            className="flex-1 p-2 border border-blue-200 rounded text-sm outline-none focus:border-blue-500"
                                            placeholder="e.g. Current Price"
                                        />
                                        <div className="text-xs text-gray-500 self-center">
                                            Path: {selectedPath.split('-->').pop()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!selectedPath || !title}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Add Widget
                    </button>
                </div>
            </div>
        </div>
    );
}