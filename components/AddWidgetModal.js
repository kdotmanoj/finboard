"use client";
import { useState, useEffect } from "react";
import {
  X,
  Check,
  List,
  CreditCard,
  LineChart,
  Trash2,
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
    }
  }, [isOpen, editWidgetId, widgets]);

  const handleTest = async () => {
    if (!apiEndpoint) return;
    setLoading(true);
    setError(null);
    setPreviewData(null);
    setSelectedPath(null); 
    setSelectedColumns([]);
    
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
    if (typeof current === "object" && current !== null) {
      if (Array.isArray(current) && current.length > 0)
        return Object.keys(current[0]);
      const keys = Object.keys(current);
      if (keys.length > 0 && typeof current[keys[0]] === "object")
        return Object.keys(current[keys[0]]);
      return keys;
    }
    return [];
  };

  const allColumns =
    displayType === "table" || displayType === "chart"
      ? getAvailableColumns()
      : [];
  const filteredColumns = allColumns.filter((col) =>
    col.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderJsonTree = (data, prefix = "") => {
    if (data === null)
      return <span className="text-neutral-400 dark:text-neutral-500 italic">null</span>;

    const isObject = typeof data === "object";
    const isArray = Array.isArray(data);
    const isSelectedContainer = selectedPath === prefix;

    let isValidList = false;
    if (isArray) {
      isValidList = true;
    } else if (isObject) {
      const keys = Object.keys(data);
      if (
        keys.length > 0 &&
        typeof data[keys[0]] === "object" &&
        data[keys[0]] !== null
      ) {
        isValidList = true;
      }
    }

    if (isObject) {
      const containerHeader = (
        <div className="flex items-center gap-2 my-1">
          {displayType !== "card" && isValidList && (
            <button
              type="button"
              onClick={() => {
                setSelectedPath(prefix);
                setSelectedColumns([]);
                setSearchQuery("");
              }}
              className={`px-2 py-0.5 text-xs rounded border transition-colors flex items-center gap-1
                    ${
                      isSelectedContainer
                        ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
            >
              {isSelectedContainer && <Check size={10} />}
              {prefix === ""
                ? isArray
                  ? "Select Main List"
                  : "Select Root Data"
                : isArray
                  ? "Select List"
                  : "Select Folder"}
            </button>
          )}

          {prefix && (
            <span
              className={`font-mono text-xs font-bold ${displayType !== "card" && isValidList ? "text-purple-700 dark:text-purple-400" : "text-neutral-400 dark:text-neutral-500"}`}
            >
              {prefix.split("-->").pop()}:
            </span>
          )}

          {isArray && (
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800 px-1 rounded border border-neutral-200 dark:border-neutral-700">
              {data.length} items
            </span>
          )}
        </div>
      );

      let childrenContent;
      if (isArray) {
        if (data.length > 0) {
          childrenContent = (
            <div>
              {renderJsonTree(data[0], `${prefix}${prefix ? "-->" : ""}0`)}
              {data.length > 1 && (
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 italic mt-1 ml-2">
                  ... and {data.length - 1} more
                </div>
              )}
            </div>
          );
        } else {
          childrenContent = (
            <div className="text-neutral-400 dark:text-neutral-500 italic text-xs ml-2">(Empty)</div>
          );
        }
      } else {
        childrenContent = Object.keys(data).map((key) => (
          <div key={key}>
            {renderJsonTree(data[key], prefix ? `${prefix}-->${key}` : key)}
          </div>
        ));
      }

      return (
        <div
          className={`pl-2 ml-1 ${prefix !== "" ? "border-l-2 border-neutral-100 dark:border-neutral-800" : ""}`}
        >
          {containerHeader}
          <div className="pl-2">{childrenContent}</div>
        </div>
      );
    }

    if (displayType === "card") {
      const isSelected = cardFields.some((f) => f.path === prefix);
      return (
        <button
          type="button"
          onClick={() => addCardField(prefix, prefix.split("-->").pop())}
          disabled={isSelected}
          className={`ml-2 my-0.5 px-2 py-0.5 text-xs rounded border transition-colors inline-flex items-center gap-1
                    ${
                      isSelected
                        ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 cursor-default"
                        : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-700"
                    }`}
        >
          {isSelected && <Check size={10} />} {String(data)}
        </button>
      );
    }
    return (
      <span className="ml-2 text-neutral-400 dark:text-neutral-500 text-xs select-none">
        {String(data)}
      </span>
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-700">
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
                onClick={() => {
                  setDisplayType(type);
                }}
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
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden flex flex-col max-h-125">
              <div className="bg-neutral-50 dark:bg-neutral-800 p-2 border-b border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                {displayType === "card"
                  ? "Click values to add them"
                  : "Select a Data List"}
              </div>
              <div
                className="p-4 bg-white dark:bg-neutral-900 overflow-auto flex-1 font-mono text-sm border-b border-neutral-200 dark:border-neutral-700"
                style={{ minHeight: "200px" }}
              >
                {renderJsonTree(previewData)}
              </div>

              {displayType === "card" && (
                <div className="p-4 bg-green-50 dark:bg-green-950">
                  <label className="block text-xs font-bold text-green-800 dark:text-green-400 uppercase mb-2">
                    Selected Metrics ({cardFields.length})
                  </label>
                  {cardFields.length === 0 ? (
                    <div className="text-xs text-green-600 dark:text-green-400 italic">
                      Click green values above to add them here.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                      {cardFields.map((field, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 items-center bg-white dark:bg-neutral-800 p-1 rounded border border-green-200 dark:border-green-800"
                        >
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) =>
                              updateCardLabel(idx, e.target.value)
                            }
                            className="flex-1 text-xs p-1 outline-none font-medium text-neutral-700 dark:text-neutral-200 bg-transparent"
                          />
                          <button
                            onClick={() => removeCardField(idx)}
                            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(displayType === "table" || displayType === "chart") &&
                selectedPath !== null && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-xs font-bold text-blue-800 dark:text-blue-400 uppercase">
                        Select Fields
                      </label>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs p-1 px-2 border border-neutral-300 dark:border-neutral-700 rounded w-32 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                      {filteredColumns.map((col) => (
                        <button
                          key={col}
                          onClick={() => toggleColumn(col)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedColumns.includes(col) ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700"}`}
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
          <button onClick={onClose} className="px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
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