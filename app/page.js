"use client";
import { useState, useEffect } from 'react';
import { Download, Upload, Moon, Sun } from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';

import useStore from '@/store/useStore';
import CardWidget from '@/components/CardWidget';
import AddWidgetModal from '@/components/AddWidgetModal';
import TableWidget from '@/components/TableWidget';
import ChartWidget from '@/components/ChartWidget';
import { SortableItem } from '@/components/SortableItem';

export default function Dashboard() {
  const { widgets, removeWidget, reorderWidgets, importWidgets } = useStore(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); 
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(saved === 'true');
    } else {
      // Check if dark class already exists (from system or other source)
      setDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('darkMode', darkMode.toString());
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode, mounted]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      reorderWidgets(active.id, over.id);
    }
  };

  const handleEdit = (id) => {
    setEditId(id);      
    setIsModalOpen(true); 
  };

  const handleAdd = () => {
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(widgets));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "finboard-config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedWidgets = JSON.parse(e.target.result);
            if (Array.isArray(importedWidgets)) {
                importWidgets(importedWidgets);
                alert('Dashboard loaded successfully!');
            }
        } catch (error) {
            alert('Invalid configuration file');
        }
    };
    reader.readAsText(file);
  };

  if(!mounted) return <div className="min-h-screen flex items-center justify-center text-neutral-400">Loading FinBoard...</div>;

  return (
    <div className="min-h-screen p-6 transition-colors">
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">My FinBoard</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Real-time Financial Dashboard</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 p-2.5 rounded-lg shadow-sm transition-all"
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <label className="cursor-pointer bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2">
              <Upload size={18} />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button onClick={handleExport} className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2">
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
          </button>

          <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2">
              + Add Widget
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {widgets.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl bg-white/50 dark:bg-neutral-900/50">
            <h3 className="text-xl font-medium text-neutral-600 dark:text-neutral-300">No widgets yet</h3>
            <p className="text-neutral-400 dark:text-neutral-500 mt-2 mb-6">Add your first custom API widget to get started</p>
            <button onClick={handleAdd} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Click here to add one
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {widgets.map((widget) => (
                  <SortableItem key={widget.id} id={widget.id}>
                    <div className="card-widget rounded-xl overflow-hidden hover:shadow-md transition-all h-full flex flex-col cursor-move">
                       
                       {widget.type === 'table' ? (
                          <TableWidget 
                            {...widget} 
                            onRemove={() => removeWidget(widget.id)} 
                            onEdit={() => handleEdit(widget.id)}
                          />
                       ) : widget.type === 'chart' ? (
                          <ChartWidget 
                            {...widget} 
                            onRemove={() => removeWidget(widget.id)} 
                            onEdit={() => handleEdit(widget.id)}
                          />
                       ) : (
                          <CardWidget 
                            {...widget} 
                            onRemove={() => removeWidget(widget.id)} 
                            onEdit={() => handleEdit(widget.id)}
                          />
                       )}

                    </div>
                  </SortableItem>
                ))}

              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AddWidgetModal 
        isOpen={isModalOpen} 
        onClose={handleClose} 
        editWidgetId={editId} 
      />
    </div>
  );
}