import { api } from '../lib/api';

// Obtener la instancia activa
export const getActiveInstance = async () => {
  const response = await api.get('/api/v1/instances/active');
  return response.data;
};

// Actualizar la instancia activa
export const updateActiveInstance = async (instanceId: number, data: any) => {
  const response = await api.put(`/api/v1/instances/${instanceId}`, data);
  return response.data;
};
