"use client"; 
import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, TrendingUp } from 'lucide-react';

export default function CardWidget({ id, title, apiEndpoint, cardFields = [], cachedData, onRemove }) {
    const [data, setData] = useState(cachedData || null);
    const [loading, setLoading] = useState(!cachedData);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(apiEndpoint);
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

    const getValueFromPath = (path) => {
        if (!data || !path) return '--';
        const parts = path.split('-->');
        let current = data;
        for (const part of parts) {
             if (current && current[part] !== undefined) current = current[part];
             else return '--';
        }
        return current;
    };

    return (
        <div className="flex flex-col h-full bg-white p-5 relative group">
            <div className="flex justify-between items-start mb-3 drag-handle cursor-move">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <TrendingUp size={16} />
                    </div>
                    <h3 className="font-semibold text-gray-700 truncate max-w-30" title={title}>
                        {title}
                    </h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={fetchData} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/></button>
                    <button onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14}/></button>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-15">
                {loading && !data ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cardFields.map((field, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-1">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                    {field.label}
                                </span>
                                <span className="text-sm font-bold text-gray-900 font-mono">
                                    {String(getValueFromPath(field.path))}
                                </span>
                            </div>
                        ))}
                        {cardFields.length === 0 && <div className="text-xs text-gray-400 text-center">No fields selected</div>}
                    </div>
                )}
            </div>
        </div>
    );
}