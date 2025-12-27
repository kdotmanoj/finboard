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
      return <span className="text-gray-400 italic">null</span>;

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
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
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
              className={`font-mono text-xs font-bold ${displayType !== "card" && isValidList ? "text-purple-700" : "text-gray-400"}`}
            >
              {prefix.split("-->").pop()}:
            </span>
          )}

          {isArray && (
            <span className="text-[10px] text-gray-400 bg-gray-50 px-1 rounded border">
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
                <div className="text-[10px] text-gray-400 italic mt-1 ml-2">
                  ... and {data.length - 1} more
                </div>
              )}
            </div>
          );
        } else {
          childrenContent = (
            <div className="text-gray-400 italic text-xs ml-2">(Empty)</div>
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
          className={`pl-2 ml-1 ${prefix !== "" ? "border-l-2 border-gray-100" : ""}`}
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
                        ? "bg-green-100 text-green-700 border-green-200 cursor-default"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                    }`}
        >
          {isSelected && <Check size={10} />} {String(data)}
        </button>
      );
    }
    return (
      <span className="ml-2 text-gray-400 text-xs select-none">
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg text-gray-800">
            {editWidgetId ? "Edit Widget" : "Configure New Widget"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit mb-6">
            {["card", "table", "chart"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setDisplayType(type);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${displayType === type ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
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
              className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
                {displayType === 'card' && (
                    <select 
                        value={dataFormat} 
                        onChange={(e) => setDataFormat(e.target.value)}
                        className="p-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
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
                className="w-full p-2 border rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleTest}
                disabled={loading}
                className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Test
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          {previewData && (
            <div className="border rounded-lg overflow-hidden flex flex-col max-h-125">
              <div className="bg-gray-50 p-2 border-b text-xs font-bold text-gray-500 uppercase">
                {displayType === "card"
                  ? "Click values to add them"
                  : "Select a Data List"}
              </div>
              <div
                className="p-4 bg-white overflow-auto flex-1 font-mono text-sm border-b"
                style={{ minHeight: "200px" }}
              >
                {renderJsonTree(previewData)}
              </div>

              {displayType === "card" && (
                <div className="p-4 bg-green-50">
                  <label className="block text-xs font-bold text-green-800 uppercase mb-2">
                    Selected Metrics ({cardFields.length})
                  </label>
                  {cardFields.length === 0 ? (
                    <div className="text-xs text-green-600 italic">
                      Click green values above to add them here.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                      {cardFields.map((field, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 items-center bg-white p-1 rounded border border-green-200"
                        >
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) =>
                              updateCardLabel(idx, e.target.value)
                            }
                            className="flex-1 text-xs p-1 outline-none font-medium text-gray-700"
                          />
                          <button
                            onClick={() => removeCardField(idx)}
                            className="text-red-400 hover:text-red-600 p-1"
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
                  <div className="p-4 bg-blue-50">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-xs font-bold text-blue-800 uppercase">
                        Select Fields
                      </label>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs p-1 px-2 border rounded w-32"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                      {filteredColumns.map((col) => (
                        <button
                          key={col}
                          onClick={() => toggleColumn(col)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedColumns.includes(col) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600"}`}
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
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">
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
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {editWidgetId ? "Save Changes" : "Add Widget"}
          </button>
        </div>
      </div>
    </div>
  );
}