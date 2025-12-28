"use client";
import { useState, useEffect } from "react";
import {
  Trash2,
  RefreshCw,
  Table as TableIcon,
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatValue } from "../utils/formatter";
import { fetchWithCache } from "@/utils/apiCache";

export default function TableWidget({
  id,
  title,
  apiEndpoint,
  dataKey,
  columns = [],
  dataFormat,
  cachedData,
  onRemove,
  onEdit,
}) {
  const [data, setData] = useState(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchWithCache(apiEndpoint);
      if (json.Note || json.Information) throw new Error("API Limit Reached");
      setData(json);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedData) fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getTableData = () => {
    if (!data) return [];

    let current = data;
    if (dataKey) {
      const parts = dataKey.split("-->");
      for (const part of parts) {
        if (current && current[part]) current = current[part];
        else return [];
      }
    }

    if (Array.isArray(current)) {
      return current;
    } else if (typeof current === "object") {
      return Object.keys(current)
        .slice(0, 100)
        .map((key) => ({
          key_name: key,
          ...current[key],
        }));
    }
    return [];
  };

  const rows = getTableData();

  const filteredRows = rows.filter((row) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (
      (row.key_name &&
        String(row.key_name).toLowerCase().includes(lowerTerm)) ||
      columns.some((col) => String(row[col]).toLowerCase().includes(lowerTerm))
    );
  });

  const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 p-4 relative group">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex justify-between items-center drag-handle cursor-move">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-lg">
              <TableIcon size={16} />
            </div>
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-200 truncate" title={title}>
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
            <button
              onClick={onEdit}
              className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 dark:border-neutral-700 rounded-md focus:border-purple-500 dark:focus:border-purple-400 outline-none bg-neutral-50 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-750 transition-colors text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-neutral-200 dark:border-neutral-700 rounded-lg scrollbar-thin">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-red-500 dark:text-red-400 text-xs p-4 text-center bg-red-50 dark:bg-red-950 rounded">
            <p className="font-bold mb-1">API Error</p>
            <p>{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loading && !data ? (
          <div className="p-4 text-center text-neutral-400 dark:text-neutral-500 text-sm animate-pulse">
            Loading data...
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium sticky top-0">
              <tr>
                <th className="p-2 border-b border-neutral-200 dark:border-neutral-700">Date/Key</th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="p-2 border-b border-neutral-200 dark:border-neutral-700 font-mono text-purple-700 dark:text-purple-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <td className="p-2 font-medium text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                      {formatValue(
                        row.key_name || (currentPage - 1) * ROWS_PER_PAGE + idx,
                        dataFormat,
                      )}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="p-2 text-neutral-800 dark:text-neutral-200 font-mono">
                        {formatValue(row[col], dataFormat)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="p-4 text-center text-neutral-400 dark:text-neutral-500"
                  >
                    {rows.length === 0
                      ? "No Data Found"
                      : `No results for "${searchTerm}"`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft size={16} className="text-neutral-600 dark:text-neutral-400" />
          </button>

          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight size={16} className="text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      )}
    </div>
  );
}