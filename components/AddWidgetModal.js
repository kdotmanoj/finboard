"use client";
import { useState, useEffect } from "react";
import {
  X,
  Check,
  List,
  CreditCard,
  LineChart,
  Trash2,
  ChevronRight,
  ChevronDown,
  Database,
  Folder,
  Hash,
  MoreHorizontal
} from "lucide-react";
import useStore from "../store/useStore";

export default function AddWidgetModal({ isOpen, onClose, editWidgetId = null }) {
  const { widgets, addWidget, updateWidget } = useStore();

  const [displayType, setDisplayType] = useState("card");
  const [title, setTitle] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [cardFields, setCardFields] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dataFormat, setDataFormat] = useState('raw');
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  
  const [nodeLimits, setNodeLimits] = useState({});

  useEffect(() => {
    if (isOpen && editWidgetId) {
      const widgetToEdit = widgets.find((w) => w.id === editWidgetId);
      if (widgetToEdit) {
        setTitle(widgetToEdit.title);
        setApiEndpoint(widgetToEdit.apiEndpoint);
        setDisplayType(widgetToEdit.type);
        setCardFields(widgetToEdit.cardFields || []);
        setSelectedPath(widgetToEdit.dataKey !== undefined ? widgetToEdit.dataKey : null);
        setSelectedColumns(widgetToEdit.columns || []);
        setPreviewData(widgetToEdit.initialData || null);
        setDataFormat(widgetToEdit.dataFormat || 'raw');
      }
    } else if (isOpen && !editWidgetId) {
      setTitle("");
      setApiEndpoint("");
      setPreviewData(null);
      setCardFields([]);
      setSelectedPath(null);
      setSelectedColumns([]);
      setDataFormat('raw');
      setExpandedPaths(new Set());
      setNodeLimits({});
    }
  }, [isOpen, editWidgetId, widgets]);

  const handleTest = async () => {
    if (!apiEndpoint) return;
    setLoading(true);
    setError(null);
    setPreviewData(null);
    setSelectedPath(null); 
    setSelectedColumns([]);
    setExpandedPaths(new Set(['']));
    setNodeLimits({}); 
    
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setPreviewData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCardField = (path, keyName) => {
    if (cardFields.some((f) => f.path === path)) return;
    setCardFields([...cardFields, { path, label: keyName }]);
  };

  const removeCardField = (index) => {
    const newFields = [...cardFields];
    newFields.splice(index, 1);
    setCardFields(newFields);
  };

  const updateCardLabel = (index, newLabel) => {
    const newFields = [...cardFields];
    newFields[index].label = newLabel;
    setCardFields(newFields);
  };

  const toggleColumn = (colKey) => {
    setSelectedColumns((prev) =>
      prev.includes(colKey)
        ? prev.filter((c) => c !== colKey)
        : [...prev, colKey],
    );
  };

  const toggleExpanded = (path) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const loadMoreItems = (path) => {
    setNodeLimits(prev => ({
        ...prev,
        [path]: (prev[path] || 10) + 50 
    }));
  };

  const getAvailableColumns = () => {
    if (!previewData || selectedPath === null) return [];
    
    let current = previewData;
    if (selectedPath) {
      const parts = selectedPath.split("-->");
      for (const part of parts) {
        if (current && current[part] !== undefined) current = current[part];
        else return [];
      }
    }

    const isNumeric = (val) => {
        if (typeof val === 'number') return true;
        if (typeof val === 'string' && !isNaN(parseFloat(val)) && isFinite(val)) return true;
        return false;
    };

    if (typeof current === "object" && current !== null) {
      if (Array.isArray(current) && current.length > 0) {
        const allKeys = new Set();
        const scanLimit = Math.min(10, current.length);
        for (let i = 0; i < scanLimit; i++) {
          if (typeof current[i] === "object" && current[i] !== null) {
            Object.keys(current[i]).forEach(key => {
              if (displayType === "chart") {
                if (isNumeric(current[i][key])) {
                  allKeys.add(key);
                }
              } else {
                allKeys.add(key);
              }
            });
          }
        }
        return Array.from(allKeys);
      }
      
      const keys = Object.keys(current);
      const hasObjectChildren = keys.some(k => typeof current[k] === "object" && current[k] !== null && (Array.isArray(current[k]) || Object.keys(current[k]).length > 0));
      
      if (keys.length > 0 && hasObjectChildren) {
        const allKeys = new Set();
        keys.slice(0, 10).forEach(key => {
          if (typeof current[key] === "object" && current[key] !== null) {
            Object.keys(current[key]).forEach(subKey => {
              if (displayType === "chart") {
                if (isNumeric(current[key][subKey])) {
                  allKeys.add(subKey);
                }
              } else {
                allKeys.add(subKey);
              }
            });
          }
        });
        return Array.from(allKeys);
      }
      return keys;
    }
    return [];
  };

  const allColumns = displayType === "table" || displayType === "chart" ? getAvailableColumns() : [];
  const filteredColumns = allColumns.filter((col) =>
    col.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderTreeNode = (data, path = "", depth = 0) => {
    if (data === null || typeof data !== "object") {
      const isSelected = cardFields.some((f) => f.path === path);
      
      if (displayType !== "card") {
        return (
          <div className="px-3 py-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-mono truncate">
            {String(data)}
          </div>
        );
      }
      
      return (
        <button
          type="button"
          onClick={() => addCardField(path, path.split("-->").pop())}
          disabled={isSelected}
          className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
            isSelected
              ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 cursor-default border border-green-300 dark:border-green-800"
              : "hover:bg-green-50 dark:hover:bg-green-950 text-neutral-700 dark:text-neutral-300 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600"
          }`}
        >
          <Hash size={14} className={isSelected ? "text-green-600 dark:text-green-400" : "text-green-500 dark:text-green-500"} />
          <span className="font-mono text-xs flex-1 truncate">{String(data)}</span>
          {isSelected && <Check size={14} className="text-green-600 dark:text-green-400" />}
        </button>
      );
    }

    const isArray = Array.isArray(data);
    const isExpanded = expandedPaths.has(path);
    const isSelectedContainer = selectedPath === path;

    let isValidList = false;
    if (isArray) {
      isValidList = true;
    } else if (typeof data === "object") {
      const keys = Object.keys(data);
      const hasObjectChildren = keys.some(k => {
        const val = data[k];
        return typeof val === "object" && val !== null && (Array.isArray(val) || Object.keys(val).length > 0);
      });
      if (keys.length > 0 && hasObjectChildren) {
        isValidList = true;
      }
    }

    const canSelect = displayType !== "card" && isValidList;

    const currentLimit = nodeLimits[path] || 10;
    const arrayLength = isArray ? data.length : Object.keys(data).length;
    const hasMore = arrayLength > currentLimit;

    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md group hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
            isSelectedContainer ? "bg-blue-50 dark:bg-blue-950" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => toggleExpanded(path)}
            className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={14} className="text-neutral-600 dark:text-neutral-400" />
            ) : (
              <ChevronRight size={14} className="text-neutral-600 dark:text-neutral-400" />
            )}
          </button>

          <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded">
            {isArray ? (
              <Database size={12} className="text-purple-600 dark:text-purple-400" />
            ) : (
              <Folder size={12} className="text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <span className="flex-1 font-medium text-sm text-neutral-700 dark:text-neutral-200 truncate">
            {path === "" ? "Root" : path.split("-->").pop()}
          </span>

          {isArray && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
              {data.length}
            </span>
          )}

          {canSelect && (
            <button
              type="button"
              onClick={() => {
                setSelectedPath(path);
                setSelectedColumns([]);
                setSearchQuery("");
              }}
              className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${
                isSelectedContainer
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 opacity-0 group-hover:opacity-100"
              }`}
            >
              {isSelectedContainer ? "✓ Selected" : "Use This"}
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-neutral-200 dark:border-neutral-700 pl-2">
            {isArray ? (
              data.length > 0 ? (
                <>
                  {/* FIX: Render slice based on load more button */}
                  {data.slice(0, currentLimit).map((item, idx) => {
                    const childPath = `${path}${path ? "-->" : ""}${idx}`;
                    const node = renderTreeNode(item, childPath, depth + 1);
                    return node ? <div key={idx}>{node}</div> : null;
                  })}
                  
                  {/* LOAD MORE BUTTON */}
                  {hasMore && (
                    <button 
                        onClick={() => loadMoreItems(path)}
                        className="w-full text-left px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded flex items-center gap-1 font-medium"
                    >
                        <MoreHorizontal size={12} />
                        Load {Math.min(50, data.length - currentLimit)} more... ({data.length - currentLimit} remaining)
                    </button>
                  )}
                </>
              ) : (
                <div className="px-3 py-1 text-xs text-neutral-400 dark:text-neutral-500 italic">
                  Empty array
                </div>
              )
            ) : (
              Object.entries(data).map(([key, value]) => {
                const childPath = path ? `${path}-->${key}` : key;
                const node = renderTreeNode(value, childPath, depth + 1);
                return node ? <div key={key}>{node}</div> : null;
              })
            )}
          </div>
        )}
      </div>
    );
  };

  const handleSave = () => {
    const config = {
      title,
      apiEndpoint,
      type: displayType,
      initialData: previewData,
      cardFields: displayType === "card" ? cardFields : [],
      dataKey: selectedPath,
      columns: selectedColumns,
      dataFormat: displayType === 'card' ? dataFormat : 'raw',
    };

    if (editWidgetId) {
      updateWidget(editWidgetId, config);
    } else {
      addWidget(config);
    }

    setTitle("");
    setApiEndpoint("");
    setPreviewData(null);
    setCardFields([]);
    setSelectedPath(null);
    setSelectedColumns([]);
    setDataFormat('raw');
    setExpandedPaths(new Set());
    setNodeLimits({});
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800">
          <h2 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">
            {editWidgetId ? "Edit Widget" : "Configure New Widget"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X size={20} className="text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg w-fit mb-6">
            {["card", "table", "chart"].map((type) => (
              <button
                key={type}
                onClick={() => setDisplayType(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${displayType === type ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}
              >
                {type === "card" && <CreditCard size={16} />}
                {type === "table" && <List size={16} />}
                {type === "chart" && <LineChart size={16} />}
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-4 mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Widget Title"
              className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
            <div className="flex gap-2">
                {displayType === 'card' && (
                    <select 
                        value={dataFormat} 
                        onChange={(e) => setDataFormat(e.target.value)}
                        className="p-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-neutral-600 dark:text-neutral-300"
                    >
                        <option value="raw">No Format</option>
                        <option value="currency">Currency ($)</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="number">Number (1,000.00)</option>
                    </select>
                )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="API URL"
                className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
              <button
                onClick={handleTest}
                disabled={loading}
                className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Test
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {previewData && (
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 border-b border-neutral-200 dark:border-neutral-700">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                      {displayType === "card" ? "Select Values" : displayType === "table" ? "Select Data List" : "Select Time Series"}
                    </h3>
                    {displayType === "card" && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded">
                        {cardFields.length} selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {displayType === "card" && "Click individual values (green buttons) to add them as metrics"}
                    {displayType === "table" && "Click 'Use This' on a list/array to display it as a data grid"}
                    {displayType === "chart" && "Click 'Use This' on a time-series list to plot trends"}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-neutral-900 max-h-96 overflow-auto">
                <div className="space-y-1">
                  {renderTreeNode(previewData)}
                </div>
              </div>

              {displayType === "card" && cardFields.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border-t border-green-200 dark:border-green-800">
                  <div className="space-y-2">
                    {cardFields.map((field, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 items-center bg-white dark:bg-neutral-800 p-2 rounded border border-green-200 dark:border-green-800"
                      >
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateCardLabel(idx, e.target.value)}
                          className="flex-1 text-xs p-1 outline-none font-medium text-neutral-700 dark:text-neutral-200 bg-transparent"
                        />
                        <button
                          onClick={() => removeCardField(idx)}
                          className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(displayType === "table" || displayType === "chart") && selectedPath !== null && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border-t border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase">
                      Select Columns ({selectedColumns.length})
                    </label>
                    
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filteredColumns.map((col) => (
                      <button
                        key={col}
                        onClick={() => toggleColumn(col)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          selectedColumns.includes(col)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700"
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              !title ||
              (displayType === "card"
                ? cardFields.length === 0
                : !selectedPath && selectedPath !== "" || selectedColumns.length === 0)
            }
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {editWidgetId ? "Save Changes" : "Add Widget"}
          </button>
        </div>
      </div>
    </div>
  );
}