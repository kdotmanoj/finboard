"use client"; 
import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, TrendingUp } from 'lucide-react';
import { getNestedValue } from '../utils/helpers';

export default function CardWidget({ id, title, apiEndpoint, dataKey, label, cachedData, onRemove }) {
    const [data, setData] = useState(cachedData || null);
    const [loading, setLoading] = useState(!cachedData);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(apiEndpoint);
            if (!res.ok) throw new Error('Fetch Error');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err); 
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
    const isPrimitive = displayValue !== null && typeof displayValue !== 'object';

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
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
                    </button>
                    <button 
                        onClick={onRemove} 
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center text-center">
                {loading && !data ? (
                    <div className="animate-pulse h-8 bg-gray-100 rounded w-1/2 mx-auto"></div>
                ) : (
                    <>
                        <div className="text-3xl font-bold text-gray-900 tracking-tight overflow-hidden text-ellipsis">
                            {isPrimitive ? (
                                displayValue
                            ) : (
                                <span className="text-xs text-red-400 font-normal">
                                    Error: Selected a List. Please delete and pick a Value.
                                </span>
                            )}
                        </div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                            {label || "Value"}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}