export const API_ROUTES = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  WALLET: {
    BALANCE: '/wallet/balance',
    ADD_MONEY: '/wallet/add-money',
    WITHDRAW: '/wallet/withdraw',
  },
  PAYMENTS: {
    SEND: '/payments/send',
    HISTORY: '/payments/history',
    TRANSACTION: (id: string) => `/payments/${id}`,
  },
  BANK_ACCOUNTS: {
    LIST: '/bank-accounts',
    ADD: '/bank-accounts',
    DELETE: (id: string) => `/bank-accounts/${id}`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    SPENDING: '/analytics/spending',
  },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const TRANSACTION_LIMITS = {
  MIN_AMOUNT: 1,
  MAX_SINGLE_TRANSACTION: 100000,
  DAILY_LIMIT: 200000,
  MIN_WALLET_BALANCE: 0,
} as const;

export const FRAUD_THRESHOLDS = {
  HIGH_RISK_SCORE: 0.8,
  MEDIUM_RISK_SCORE: 0.5,
  LARGE_AMOUNT_THRESHOLD: 50000,
  VELOCITY_THRESHOLD: 10,
} as const;
