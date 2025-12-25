import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
    persist(
        (set) => ({
        widgets: [],

        addWidget: (newWidget) => set((state) => {
            const id = Date.now().toString();
            const finalWidget = { 
            ...newWidget,
            id: id,
            cachedData: newWidget.initialData || null
            };
            
            return {
            widgets: [...state.widgets, finalWidget]
            };
        }),

        removeWidget: (id) => set((state) => ({
            widgets: state.widgets.filter((w) => w.id !== id),
        })),
        }),
        {
        name: 'finboard-storage',
        }
    )
);

export default useStore;