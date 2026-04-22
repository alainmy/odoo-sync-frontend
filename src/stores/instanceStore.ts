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
  product_descriptions: string;
  price_list_id: number | null;
  auto_sync_orders: number | null;
  auto_sync_products: number | null;
  odoo_description: string | null;
  category_from_product: boolean | true;
  website_id: number | null;
  website: Website | null;
}
export interface Language {
  code: string;
  name: string;
}
export interface PriceList {
  id: number;
  odoo_pricelist_name: string;
}

export interface Website {
  id: number;
  name: string;
}

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password: string;
}
interface InstanceState {
  activeInstance: WooCommerceInstance | null;
  activeWebsite: Website | null;
  instances: WooCommerceInstance[];
  languages: Language[];
  price_list: PriceList[]; // Consider defining a proper interface for price list items
  websites: Website[];
  isLoading: boolean;
  error: string | null;
  odooConfig: OdooConfig | null;

  // Actions
  setActiveInstance: (instance: WooCommerceInstance) => void;
  setActiveWebsite: (website: Website) => void;
  setInstances: (instances: WooCommerceInstance[]) => void;
  fetchInstances: () => Promise<void>;
  fetchActiveInstance: () => Promise<void>;
  activateInstance: (id: number) => Promise<void>;
  activateWebsite: (id: number) => Promise<void>;
  clearInstances: () => void;
  fetchLanguages: () => Promise<void>;
  fetchPriceList: () => Promise<void>;
  fetchWebsites: (odoo_config: OdooConfig) => Promise<void>;
}

export const useInstanceStore = create<InstanceState>()(
  persist(
    (set, get) => ({
      activeInstance: null,
      activeWebsite: null,
      instances: [],
      websites: [],
      isLoading: false,
      error: null,
      languages: [],
      price_list: [],
      odooConfig: null,

      setActiveInstance: (instance) => {
        set({ activeInstance: instance });
        set({ activeWebsite: instance ? instance?.website : null });
        var website_id = instance ? instance?.website?.id : null;
        localStorage.setItem('active_instance_id', instance ? instance.id.toString() : '');
        // También actualizar localStorage para compatibilidad
        localStorage.setItem('active_website_id', website_id ? website_id?.toString() : '');
      },
      setActiveWebsite: (website) => {
        set({ activeWebsite: website });
        // También actualizar localStorage para compatibilidad
        localStorage.setItem('active_website_id', website.id.toString());
      },
      activateWebsite: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.patch(`/api/v1/websites/${id}/activate`);
          const activeWebsite = response.data;
          // Actualizar la instancia activa
          get().setActiveWebsite(activeWebsite);

          // Actualizar la lista de instancias localmente
          const updateWebsites = get().websites.map(website => ({
            ...website,
            is_active: website.id === id
          }));

          set({ websites: updateWebsites, isLoading: false });

          // Emitir evento para sincronización entre pestañas
          window.dispatchEvent(new CustomEvent('instance-changed', {
            detail: { instanceId: id }
          }));
        } catch (error: any) {
          console.error('Error activating website:', error);
          set({
            error: error.response?.data?.detail || 'Error al activar website',
            isLoading: false
          });
          throw error;
        }
      },
      setInstances: (instances) => {
        set({ instances });
        // Actualizar instancia activa si está en la lista
        const active = instances.find(i => i.is_active);
        if (active) {
          get().setActiveInstance(active);
          if (active.website) {
            get().setActiveWebsite(active.website);
          }
        }
      },
      setWebsites: (websites: Website[]) => {
        set({ websites });
        // Actualizar instancia activa si está en la lista
        const active = websites[0];
        if (active) {
          get().setActiveWebsite(active);
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
      fetchPriceList: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/api/v1/pricelists/config?instance_id=${get().activeInstance?.id || 0}&active_only=true`);
          const price_list = response.data;
          set({ isLoading: false, price_list });
        } catch (error: any) {
          console.error('Error fetching price lists:', error);
          set({
            error: error.response?.data?.detail || 'Error al cargar listas de precios',
            isLoading: false
          });
          toast({
            title: 'Error',
            description: 'Failed to load price lists from Odoo',
            variant: 'destructive'
          });
        }
      },
      fetchWebsites: async (odoo_config: OdooConfig) => {
        set({ isLoading: true, error: null });
        console.log('odoo_config', odoo_config);
        try {
          if (odoo_config.url && odoo_config.db && odoo_config.username && odoo_config.password) {
            const response = await api.post(`/api/v1/odoo-websites`, odoo_config);
            const websites = response.data.websites;
            const active_instance = get().instances[0];
            const activeWebsite = active_instance ? active_instance : null;
            if (activeWebsite) {
              get().setActiveWebsite(activeWebsite);
            } else {
              set({ activeWebsite: null });
              localStorage.removeItem('active_instance_id');
            }
            set({ isLoading: false, websites });
          }

        } catch (error: any) {
          console.error('Error fetching price lists:', error);
          set({
            error: error.response?.data?.detail || 'Error al cargar listas de precios',
            isLoading: false
          });
          toast({
            title: 'Error',
            description: 'Failed to load price lists from Odoo',
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
          if (instance.website) {
            get().setActiveWebsite(instance.website);
          }
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
          if (activatedInstance.website) {
            get().setActiveWebsite(activatedInstance.website);
          }
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
          websites: [],
          activeWebsite: null,
          error: null,
          isLoading: false
        });
        localStorage.removeItem('active_instance_id');
        localStorage.removeItem('active_website_id');
      },
    }),
    {
      name: 'instance-storage',
      partialize: (state) => ({
        activeInstance: state.activeInstance,
        activeWebsite: state.activeWebsite,
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
      useInstanceStore.getState().fetchWebsites({
        db: useInstanceStore.getState().odooConfig?.db || "",
        url: useInstanceStore.getState().odooConfig?.url || "",
        username: useInstanceStore.getState().odooConfig?.username || "",
        password: useInstanceStore.getState().odooConfig?.password || ""
      });
    }
  });

  // Listener para eventos personalizados de la misma pestaña
  window.addEventListener('instance-changed', () => {
    // Opcional: actualizar otros componentes si es necesario
    console.log('Instance changed event received');
  });
}
