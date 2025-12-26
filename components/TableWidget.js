"use client";
import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Table as TableIcon } from 'lucide-react';

export default function TableWidget({ id, title, apiEndpoint, dataKey, columns = [], cachedData, onRemove }) {
    const [data, setData] = useState(cachedData || null);
    const [loading, setLoading] = useState(!cachedData);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const res = await fetch(apiEndpoint);
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError('Failed to load ddata');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(!cachedData) fetchData();
        const interval = setInterval(fetchData, 30000); 
        return () => clearInterval(interval);
    }, [apiEndpoint]);

    const getTableData = () => {
        if(!data || !dataKey) return [];

        const parts = dataKey.split('-->');
        let current = data;
        for(const part of parts){
            if(current && current[part]){
                current = current[part];
            } else {
                return [];
            }
        }

        if(Array.isArray(current)){
            return current; 
        } else if (typeof current === 'object') {
            return Object.keys(current).slice(0, 10).map(key => ({
                key_name: key,
                ...current[key] 
            }));
        }
        return [];
    };

    const rows = getTableData();

    return (
        <div className="flex flex-col h-full bg-white p-4 relative group">
            <div className="flex justify-between items-center mb-4 drag-handle cursor-move">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                        <TableIcon size={16} />
                    </div>
                    <h3 className="font-semibold text-gray-700 truncate" title={title}>{title}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={fetchData} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><RefreshCw size={14}/></button>
                    <button onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg scrollbar-thin">
                {error ? (
                    <div className="h-full flex flex-col items-center justify-center text-red-500 text-xs p-4 text-center">
                        <p className="font-semibold mb-1">Connection Error</p>
                        <button onClick={fetchData} className="text-blue-600 underline hover:text-blue-800">Try Again</button>
                    </div>
                ) : loading && !data ? (
                    <div className="p-4 text-center text-gray-400 text-sm animate-pulse">Loading data...</div>
                ) : (
                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
                        <tr>
                            <th className="p-2 border-b">Date/Key</th>
                            {columns.map(col => (
                                <th key={col} className="p-2 border-b font-mono text-purple-700">{col}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {rows.length > 0 ? rows.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-2 font-medium text-gray-600 whitespace-nowrap">{row.key_name || idx}</td>
                            {columns.map(col => (
                                <td key={col} className="p-2 text-gray-800 font-mono">
                                    {row[col] ? String(row[col]) : '-'}
                                </td>
                            ))}
                            </tr>
                        )) : (
                            <tr><td colSpan={columns.length + 1} className="p-4 text-center text-gray-400">No Data Found</td></tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}