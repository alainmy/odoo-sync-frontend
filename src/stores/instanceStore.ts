import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export interface WooCommerceInstance {
  id: number;
  name: string;
  woocommerce_url: string;
  woocommerce_consumer_key: string;
  woocommerce_consumer_secret: string;
  odoo_url: string;
  odoo_db: string;
  odoo_username: string;
  odoo_password: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  user_id: number;
  odoo_language: string;
}
export interface Language {
  code: string;
  name: string;
}

interface InstanceState {
  activeInstance: WooCommerceInstance | null;
  instances: WooCommerceInstance[];
  languages: Language[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveInstance: (instance: WooCommerceInstance) => void;
  setInstances: (instances: WooCommerceInstance[]) => void;
  fetchInstances: () => Promise<void>;
  fetchActiveInstance: () => Promise<void>;
  activateInstance: (id: number) => Promise<void>;
  clearInstances: () => void;
  fetchLanguages: () => Promise<void>;
}

export const useInstanceStore = create<InstanceState>()(
  persist(
    (set, get) => ({
      activeInstance: null,
      instances: [],
      isLoading: false,
      error: null,
      languages: [],

      setActiveInstance: (instance) => {
        set({ activeInstance: instance });
        // También actualizar localStorage para compatibilidad
        localStorage.setItem('active_instance_id', instance.id.toString());
      },

      setInstances: (instances) => {
        set({ instances });
        // Actualizar instancia activa si está en la lista
        const active = instances.find(i => i.is_active);
        if (active) {
          get().setActiveInstance(active);
        }
      },
      fetchLanguages: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/odoo/active-languages');
          const languages = response.data;
          set({ isLoading: false, languages });
        } catch (error: any) {
          console.error('Error fetching languages:', error);
          set({
            error: error.response?.data?.detail || 'Error al cargar idiomas',
            isLoading: false
          });
          toast({
            title: 'Error',
            description: 'Failed to load languages from Odoo',
            variant: 'destructive'
          });
        }
      },
      fetchInstances: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/api/v1/instances');
          const instances = response.data;

          set({ instances, isLoading: false });

          // Encontrar y establecer la instancia activa
          const active = instances.find((i: WooCommerceInstance) => i.is_active);
          if (active) {
            get().setActiveInstance(active);
          } else {
            set({ activeInstance: null });
            localStorage.removeItem('active_instance_id');
          }
        } catch (error: any) {
          console.error('Error fetching instances:', error);
          set({
            error: error.response?.data?.detail || 'Error al cargar instancias',
            isLoading: false
          });
          toast({
            title: 'Error',
            description: 'No se pudieron cargar las instancias desde Odoo',
            variant: 'destructive'
          });
        }
      },

      fetchActiveInstance: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/api/v1/instances/active');
          const instance = response.data;

          get().setActiveInstance(instance);
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Error fetching active instance:', error);
          set({
            activeInstance: null,
            error: error.response?.data?.detail || 'No hay instancia activa',
            isLoading: false
          });
          localStorage.removeItem('active_instance_id');
        }
      },

      activateInstance: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.patch(`/api/v1/instances/${id}/activate`);
          const activatedInstance = response.data;

          // Actualizar la instancia activa
          get().setActiveInstance(activatedInstance);

          // Actualizar la lista de instancias localmente
          const updatedInstances = get().instances.map(instance => ({
            ...instance,
            is_active: instance.id === id
          }));

          set({ instances: updatedInstances, isLoading: false });

          // Emitir evento para sincronización entre pestañas
          window.dispatchEvent(new CustomEvent('instance-changed', {
            detail: { instanceId: id }
          }));

        } catch (error: any) {
          console.error('Error activating instance:', error);
          set({
            error: error.response?.data?.detail || 'Error al activar instancia',
            isLoading: false
          });
          throw error;
        }
      },

      clearInstances: () => {
        set({
          activeInstance: null,
          instances: [],
          error: null,
          isLoading: false
        });
        localStorage.removeItem('active_instance_id');
      },
    }),
    {
      name: 'instance-storage',
      partialize: (state) => ({
        activeInstance: state.activeInstance,
      }),
    }
  )
);

// Listener para sincronización entre pestañas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'active_instance_id' && e.newValue) {
      // Otra pestaña cambió la instancia activa, recargar
      useInstanceStore.getState().fetchActiveInstance();
    }
  });

  // Listener para eventos personalizados de la misma pestaña
  window.addEventListener('instance-changed', () => {
    // Opcional: actualizar otros componentes si es necesario
    console.log('Instance changed event received');
  });
}
