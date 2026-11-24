import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor â€” attach Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor â€” handle 401, attempt refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

function processQueue(error: AxiosError | null, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data;
        setTokens(accessToken, newRefreshToken);
        processQueue(null, accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        clearTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// â”€â”€â”€ Typed API Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    api.post('/auth/register', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  profile: () => api.get('/auth/profile'),
  setPin: (data: { pin: string; password?: string }) =>
    api.post('/auth/set-pin', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; newPassword: string; otp?: string }) =>
    api.post('/auth/reset-password', data),
  deleteAccount: () => api.delete('/auth/account'),
  logout: () => api.post('/auth/logout'),
};

export const walletApi = {
  getWallet: () => api.get('/wallet'),
  setPin: (data: { pin: string; password?: string }) =>
    api.post('/wallet/set-pin', data),
  addMoney: (data: { amount: number; bankAccountId: string }) =>
    api.post('/wallet/add-money', data),
  withdraw: (data: { amount: number; bankAccountId: string; pin: string }) =>
    api.post('/wallet/withdraw', data),
  getBankAccounts: () => api.get('/bank-accounts'),
  addBankAccount: (data: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName?: string;
    holderName?: string;
  }) =>
    api.post('/bank-accounts', {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      ifscCode: data.ifscCode,
      holderName: data.holderName || data.accountHolderName,
    }),
  deleteBankAccount: (id: string) => api.delete(`/bank-accounts/${id}`),
};

export const paymentsApi = {
  sendMoney: (data: {
    recipientPhone: string;
    amount: number;
    description?: string;
    note?: string;
    pin: string;
  }) => api.post('/payments/send', data),
  lookupUser: (phone: string) => api.get(`/payments/lookup/${phone}`),
  getRecipients: (query?: string) => api.get('/payments/recipients', { params: { query } }),
  getTransactions: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }) => api.get('/payments/transactions', { params }),
  getTransaction: (id: string) => api.get(`/payments/transactions/${id}`),
};

export const analyticsApi = {
  getMonthlyStats: (year?: number, month?: number) =>
    api.get('/analytics/monthly', { params: { year, month } }),
  getSpendingTrend: (months?: number) =>
    api.get('/analytics/trend', { params: { months } }),
  getCategoryBreakdown: (startDate?: string, endDate?: string) =>
    api.get('/analytics/categories', { params: { startDate, endDate } }),
  getDashboardStats: () => api.get('/analytics/dashboard'),
};

export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api;
