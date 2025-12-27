import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";

const useStore = create(
  persist(
    (set) => ({
      widgets: [],

      addWidget: (newWidget) =>
        set((state) => ({
          widgets: [
            ...state.widgets,
            {
              ...newWidget,
              id: Date.now().toString(),
              cachedData: newWidget.initialData || null,
            },
          ],
        })),
      
      updateWidget: (id, updatedConfig) => set((state) => ({
        widgets: state.widgets.map((w) => 
          w.id === id ? { ...w, ...updatedConfig } : w
        )
      })),
      
      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),

      reorderWidgets: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.widgets.findIndex((w) => w.id === activeId);
          const newIndex = state.widgets.findIndex((w) => w.id === overId);
          return {
            widgets: arrayMove(state.widgets, oldIndex, newIndex),
          };
        }),
    }),
    {
      name: "finboard-storage",
    },
  ),
);

export default useStore;
