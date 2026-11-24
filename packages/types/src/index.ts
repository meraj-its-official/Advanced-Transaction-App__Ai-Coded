// === ENUMS ===
export enum TransactionType {
  TRANSFER = 'TRANSFER',
  TOP_UP = 'TOP_UP',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  TRANSACTION = 'TRANSACTION',
  SECURITY = 'SECURITY',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
}

// === INTERFACES ===
export interface IUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  kycStatus: KycStatus;
  isActive: boolean;
  createdAt: Date;
}

export interface IWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isLocked: boolean;
}

export interface ITransaction {
  id: string;
  fromWalletId?: string;
  toWalletId?: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  referenceId?: string;
  createdAt: Date;
}

export interface IBankAccount {
  id: string;
  userId: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  holderName: string;
  isVerified: boolean;
  isPrimary: boolean;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

// === DTOs ===
export interface RegisterDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface SendMoneyDTO {
  recipientPhone: string;
  amount: number;
  description?: string;
  pin: string;
}

export interface AddMoneyDTO {
  amount: number;
  bankAccountId: string;
}

export interface WithdrawDTO {
  amount: number;
  bankAccountId: string;
  pin: string;
}

export interface AddBankAccountDTO {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  holderName: string;
}

// === API RESPONSE ===
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: IUser;
  wallet: IWallet;
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStats {
  walletBalance: number;
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  recentTransactions: ITransaction[];
}
