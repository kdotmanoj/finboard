import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      widgets: [],

      addWidget: (newWidget) => set((state) => ({
        widgets: [...state.widgets, newWidget]
      })),

      removeWidget: (widgetId) => set((state) => ({
        widgets: state.widgets.filter((w) => w.id !== widgetId)
      })),

      updateLayout: (newLayout) => set((state) => {
        return { layout: newLayout };
      }),
    }),
    {
      name: 'finboard-storage',
    }
  )
);

export default useStore;