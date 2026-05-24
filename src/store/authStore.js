import { create } from 'zustand';
import api from '../lib/api';

const storedUser = () => {
  try { return JSON.parse(localStorage.getItem('sf_user')); } catch { return null; }
};

export const useAuthStore = create((set) => ({
  user: storedUser(),
  token: localStorage.getItem('sf_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('sf_token', data.token);
      localStorage.setItem('sf_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('sf_token', data.token);
      localStorage.setItem('sf_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    set({ user: null, token: null });
    window.location.href = '/login';
  },

  clearError: () => set({ error: null }),
}));
