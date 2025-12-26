"use client"; 
import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, TrendingUp } from 'lucide-react';
import { getNestedValue } from '../utils/helpers';

export default function CardWidget({ id, title, apiEndpoint, dataKey, label, cachedData, onRemove }) {
    const [data, setData] = useState(cachedData || null);
    const [loading, setLoading] = useState(!cachedData);
    const [error, setError] = useState(null);
    
    const fetchData = async () => {
        if (!data) setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiEndpoint);
            if (!res.ok) throw new Error('Failed to fetch');
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError('Update failed'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!cachedData) fetchData();
        
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [apiEndpoint]); 

    const displayValue = data ? getNestedValue(data, dataKey) : null;
    const finalLabel = label || dataKey;

    return (
        <div className="flex flex-col h-full bg-white p-5 relative group">
            <div className="flex justify-between items-start mb-2 drag-handle cursor-move">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <TrendingUp size={16} />
                    </div>
                    <h3 className="font-semibold text-gray-700 truncate max-w-30" title={title}>
                        {title}
                    </h3>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={fetchData} 
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={onRemove} 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Remove"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {error && !data ? (
                    <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                        Connection Error
                    </div>
                ) : (
                    <div>
                        <div className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
                            {displayValue !== undefined && displayValue !== null 
                                ? displayValue.toLocaleString() 
                                : <span className="text-gray-300">--</span>}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                                {finalLabel}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}