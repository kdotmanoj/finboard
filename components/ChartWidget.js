"use client";
import { useState, useEffect, useMemo } from "react";
import { Trash2, RefreshCw, LineChart as ChartIcon , Settings} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetchWithCache } from "@/utils/apiCache";

export default function ChartWidget({
  id,
  title,
  apiEndpoint,
  dataKey,
  columns = [],
  cachedData,
  onRemove,
  onEdit
}) {
  const [data, setData] = useState(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const fetchData = async () => {
    if (!data) setLoading(true);
    setError(null);
    try {
      const json = await fetchWithCache(apiEndpoint);
      setData(json);
    } catch (err) {
      setError("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedData) fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  const chartData = useMemo(() => {
    if (!data || !dataKey) return [];

    const parts = dataKey.split("-->");
    let current = data;
    for (const part of parts) {
      if (current && current[part]) {
        current = current[part];
      } else {
        return [];
      }
    }

    if (Array.isArray(current)) {
      return current.slice(0, 20).reverse();
    } else if (typeof current === "object") {
      return Object.keys(current)
        .slice(0, 20)
        .map((key) => ({
          name: key,
          ...current[key],
        }))
        .reverse();
    }
    return [];
  }, [data, dataKey]);

  
  const colors = ["#2563eb", "#db2777", "#16a34a", "#d97706", "#9333ea"];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 p-4 relative group">
      <div className="flex justify-between items-center mb-2 drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
            <ChartIcon size={16} />
          </div>
          <h3 className="font-semibold text-neutral-700 dark:text-neutral-200 truncate" title={title}>
            {title}
          </h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={fetchData}
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
          </button>
          <button onClick={onEdit} className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-purple-600 dark:hover:text-purple-400 rounded transition-colors" title="Edit">
            <Settings size={15}/>
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-50">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-red-500 dark:text-red-400 text-xs">
            Connection Error.{" "}
            <button onClick={fetchData} className="underline">
              Retry
            </button>
          </div>
        ) : loading && !data ? (
          <div className="h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm animate-pulse">
            Loading Chart...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm">
            No graph data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? "#404040" : "#f0f0f0"}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: isDark ? "#a3a3a3" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: isDark ? "#a3a3a3" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: isDark ? "1px solid #404040" : "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  backgroundColor: isDark ? "#262626" : "#ffffff",
                  color: isDark ? "#e5e5e5" : "#374151"
                }}
                labelStyle={{
                  fontWeight: "bold",
                  color: isDark ? "#e5e5e5" : "#374151",
                  marginBottom: "4px",
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", color: isDark ? "#a3a3a3" : "#374151" }}
              />

              {columns.map((col, index) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  name={col}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}