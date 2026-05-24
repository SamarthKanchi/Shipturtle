import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── VENDORS ─────────────────────────────────────────────────────────────────

export const useVendors = (params = {}) =>
  useQuery({
    queryKey: ['vendors', params],
    queryFn: async () => {
      const { data } = await api.get('/vendors', { params });
      return data;
    },
  });

export const useVendor = (id) =>
  useQuery({
    queryKey: ['vendors', id],
    queryFn: async () => {
      const { data } = await api.get(`/vendors/${id}`);
      return data.vendor;
    },
    enabled: !!id,
  });

export const useCreateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/vendors', body).then(r => r.data.vendor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  });
};

export const useUpdateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/vendors/${id}`, body).then(r => r.data.vendor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  });
};

export const useUpdateVendorStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/vendors/${id}/status`, { status }).then(r => r.data.vendor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  });
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export const useProducts = (params = {}) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await api.get('/products', { params });
      return data;
    },
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/products', body).then(r => r.data.product),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/products/${id}`, body).then(r => r.data.product),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useProductSyncStatus = () =>
  useQuery({
    queryKey: ['products', 'sync-status'],
    queryFn: async () => {
      const { data } = await api.get('/products/sync/status');
      return data.syncStatus;
    },
  });

// ─── ORDERS ──────────────────────────────────────────────────────────────────

export const useOrders = (params = {}) =>
  useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params });
      return data;
    },
  });

export const useOrderAnalytics = () =>
  useQuery({
    queryKey: ['orders', 'analytics'],
    queryFn: async () => {
      const { data } = await api.get('/orders/analytics/summary');
      return data;
    },
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data.order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useFulfillOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.post(`/orders/${id}/fulfill`, body).then(r => r.data.order),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useMonthlyAnalytics = () =>
  useQuery({
    queryKey: ['orders', 'analytics', 'monthly'],
    queryFn: async () => {
      const { data } = await api.get('/orders/analytics/monthly');
      return data.monthly;
    },
  });

export const useVendorAnalytics = () =>
  useQuery({
    queryKey: ['orders', 'analytics', 'vendors'],
    queryFn: async () => {
      const { data } = await api.get('/orders/analytics/vendors');
      return data.vendors;
    },
  });

export const useFulfillmentAnalytics = () =>
  useQuery({
    queryKey: ['orders', 'analytics', 'fulfillment'],
    queryFn: async () => {
      const { data } = await api.get('/orders/analytics/fulfillment');
      return data.fulfillment;
    },
  });

export const useRecentOrders = (limit = 5) =>
  useQuery({
    queryKey: ['orders', 'recent', limit],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params: { limit, sort: '-createdAt' } });
      return data.orders;
    },
  });

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const useMe = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data.user;
    },
    retry: false,
  });
