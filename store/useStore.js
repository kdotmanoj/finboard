import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
    persist(
        (set) => ({
        widgets: [],

        addWidget: (newWidget) => set((state) => {
            const id = Date.now().toString();
            const newLayoutItem = { i: id, x: 0, y: Infinity, w: 4, h: 2 };
            
            return {
            widgets: [...state.widgets, { ...widget, id }],
            layout: [...state.layout, newLayoutItem]
            };
        }),

        removeWidget: (id) => set((state) => ({
            widgets: state.widgets.filter((w) => w.id !== id),
            layout: state.layout.filter((l) => l.i !== id)
        })),

        updateLayout: (newLayout) => set({ layout: newLayout }),
        }),
        {
        name: 'finboard-storage',
        }
    )
);

export default useStore;