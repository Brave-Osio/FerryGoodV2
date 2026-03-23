// lib/api.ts — Axios API client with JWT injection
import axios, { AxiosError } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fg_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 globally
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fg_token');
        localStorage.removeItem('fg_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data: object) => api.post('/auth/users', data),
  toggleUser: (id: number) => api.patch(`/auth/users/${id}/toggle`),
};

// ── Schedules ───────────────────────────────────────────────
export const schedulesAPI = {
  list: (params?: object) => api.get('/schedules', { params }),
  get: (id: number) => api.get(`/schedules/${id}`),
  getOptions: () => api.get('/schedules/meta/options'),
  updateStatus: (id: number, status: string) =>  
    api.patch(`/schedules/${id}/status`, { status }),
  assignCustomer: (scheduleId: number, data: object) =>
    api.post(`/schedules/${scheduleId}/assign`, data),
  removeCustomer: (scheduleId: number, assignmentId: number, reason?: string) =>
    api.delete(`/schedules/${scheduleId}/customers/${assignmentId}`, { data: { reason } }),
};

// ── Customers ───────────────────────────────────────────────
export const customersAPI = {
  list: (params?: object) => api.get('/customers', { params }),
  get: (id: number) => api.get(`/customers/${id}`),
  create: (data: object) => api.post('/customers', data),
  update: (id: number, data: object) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
  history: (params?: object) => api.get('/customers/history/all', { params }),
};

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An unexpected error occurred.';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}