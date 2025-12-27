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
    <div className="flex flex-col h-full bg-white p-4 relative group">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex justify-between items-center drag-handle cursor-move">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <TableIcon size={16} />
            </div>
            <h3 className="font-semibold text-gray-700 truncate" title={title}>
              {title}
            </h3>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={fetchData}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-green-600 rounded"
              title="Edit"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
          <input
            type="text"
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:border-purple-500 outline-none bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto border rounded-lg scrollbar-thin">
        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-red-500 text-xs p-4 text-center bg-red-50 rounded">
            <p className="font-bold mb-1">API Error</p>
            <p>{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-blue-600 underline hover:text-blue-800"
            >
              Try Again
            </button>
          </div>
        ) : loading && !data ? (
          <div className="p-4 text-center text-gray-400 text-sm animate-pulse">
            Loading data...
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
              <tr>
                <th className="p-2 border-b">Date/Key</th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="p-2 border-b font-mono text-purple-700"
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
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-2 font-medium text-gray-600 whitespace-nowrap">
                      {formatValue(
                        row.key_name || (currentPage - 1) * ROWS_PER_PAGE + idx,
                        dataFormat,
                      )}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="p-2 text-gray-800 font-mono">
                        {formatValue(row[col], dataFormat)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="p-4 text-center text-gray-400"
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
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>

          <span className="text-xs font-medium text-gray-500">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}