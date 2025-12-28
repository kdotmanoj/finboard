"use client";
import { useState, useEffect } from "react";
import { Trash2, RefreshCw, TrendingUp, Settings} from "lucide-react";
import { formatValue } from "@/utils/formatter";
import { fetchWithCache } from "@/utils/apiCache";

export default function CardWidget({
  id,
  title,
  apiEndpoint,
  cardFields = [],
  cachedData,
  onRemove,
  dataFormat = 'raw',
  onEdit
}) {
  const [data, setData] = useState(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  const fetchData = async () => {
    if (!data) setLoading(true);
    try {
      const json = await fetchWithCache(apiEndpoint);
      setData(json);
    } catch (err) {
      console.error("Fetch failed:",err);
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
    if (!data || !path) return "--";
    const parts = path.split("-->");
    let current = data;
    for (const part of parts) {
      if (current && current[part] !== undefined) current = current[part];
      else return "--";
    }
    return current;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 p-5 relative group">
      <div className="flex justify-between items-start mb-3 drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <TrendingUp size={16} />
          </div>
          <h3
            className="font-semibold text-neutral-700 dark:text-neutral-200 truncate max-w-30"
            title={title}
          >
            {title}
          </h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={fetchData}
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={onEdit} className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-purple-600 dark:hover:text-green-400 rounded transition-colors" title="Edit">
            <Settings size={15}/>
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center min-h-15">
        {loading && !data ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {cardFields.map((field, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-b border-neutral-50 dark:border-neutral-800 last:border-0 pb-1"
              >
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">
                  {field.label}
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-50 font-mono">
                  {formatValue(getValueFromPath(field.path), dataFormat)}
                </span>
              </div>
            ))}
            {cardFields.length === 0 && (
              <div className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
                No fields selected
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}