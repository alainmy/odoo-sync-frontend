import { api } from '../lib/api';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  is_superuser?: boolean;
}

export interface UserUpdate {
  username: string;
  email: string;
  changed_password: string | null;
  full_name: string | null;
  is_superuser: boolean | null;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const createUser = async (data: UserCreate): Promise<User> => {
  const response = await api.post('/auth/users/register', data);
  return response.data;
};

export const updateUser = async (id: number, data: UserUpdate): Promise<User> => {
  const response = await api.put(`/auth/users/me?user_id=${id}`, data);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/auth/users/${id}`);
};
