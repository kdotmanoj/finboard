"use client";
import { useState, useEffect } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import useStore from '@/store/useStore';
import CardWidget from '@/components/CardWidget';
import AddWidgetModal from '@/components/AddWidgetModal';
import TableWidget from '@/components/TableWidget';
import ChartWidget from '@/components/ChartWidget';
import { SortableItem } from '@/components/SortableItem';

export default function Dashboard() {
  const { widgets, removeWidget, reorderWidgets } = useStore(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  if(!mounted) return <div className="p-10 text-center text-gray-400">Loading FinBoard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My FinBoard</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time Financial Dashboard</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all">+ Add Widget</button>
      </div>

      <div className="max-w-7xl mx-auto">
        {widgets.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-white/50">
            <h3 className="text-xl font-medium text-gray-600">No widgets yet</h3>
            <button onClick={() => setIsModalOpen(true)} className="text-blue-600 font-medium hover:underline mt-2">Click here to add one</button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {widgets.map((widget) => (
                  <SortableItem key={widget.id} id={widget.id}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col cursor-move">
                       {widget.type === 'table' ? (
                          <TableWidget {...widget} onRemove={() => removeWidget(widget.id)} />
                       ) : widget.type === 'chart' ? (
                          <ChartWidget {...widget} onRemove={() => removeWidget(widget.id)} />
                       ) : (
                          <CardWidget {...widget} onRemove={() => removeWidget(widget.id)} />
                       )}
                    </div>
                  </SortableItem>
                ))}

              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AddWidgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}