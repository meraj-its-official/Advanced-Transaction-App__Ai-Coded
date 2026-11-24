'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  Plus,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Building2,
  CreditCard,
  AlertTriangle,
  KeyRound,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { PinInput } from '@/components/ui/pin-input';
import { TransactionCard, TransactionItem } from '@/components/features/transaction-card';
import { useAuthStore } from '@/store/auth.store';
import { walletApi, paymentsApi } from '@/lib/api';
import { formatCurrency, maskAccountNumber } from '@/lib/utils';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  holderName: string;
  isPrimary?: boolean;
}

export default function WalletPage() {
  const searchParams = useSearchParams();
  const { wallet, setWallet, updateBalance, user, setHasPin } = useAuthStore();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [isCreatePinOpen, setIsCreatePinOpen] = useState(false);

  // Add Money Form State
  const [addAmount, setAddAmount] = useState('');
  const [addBankId, setAddBankId] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankId, setWithdrawBankId] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Create PIN Form State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinPassword, setPinPassword] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // Add Bank Form State
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [holderName, setHolderName] = useState('');
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const [walletRes, banksRes, txRes] = await Promise.allSettled([
        walletApi.getWallet(),
        walletApi.getBankAccounts(),
        paymentsApi.getTransactions({ limit: 10 }),
      ]);

      if (walletRes.status === 'fulfilled' && walletRes.value.data) {
        const w = walletRes.value.data?.data || walletRes.value.data;
        setWallet(w);
      }

      if (banksRes.status === 'fulfilled' && banksRes.value.data) {
        const b = banksRes.value.data?.data || banksRes.value.data;
        if (Array.isArray(b) && b.length > 0) {
          setBankAccounts(b);
          setAddBankId(b[0].id);
          setWithdrawBankId(b[0].id);
        } else {
          setBankAccounts([]);
          setAddBankId('');
          setWithdrawBankId('');
        }
      } else {
        setBankAccounts([]);
        setAddBankId('');
        setWithdrawBankId('');
      }

      if (txRes.status === 'fulfilled' && txRes.value.data) {
        const txs = txRes.value.data?.data?.items || txRes.value.data?.items || txRes.value.data;
        if (Array.isArray(txs)) {
          setWalletTransactions(txs);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [setWallet]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Handle URL actions
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') setIsAddMoneyOpen(true);
    if (action === 'withdraw') setIsWithdrawOpen(true);
  }, [searchParams]);

  // Handlers
  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(addAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsSubmittingAdd(true);
      const res = await walletApi.addMoney({
        amount: amountNum,
        bankAccountId: addBankId || bankAccounts[0]?.id || 'default_bank',
      });
      const updated = res.data?.data?.wallet || res.data?.data;
      if (updated?.balance !== undefined) {
        updateBalance(updated.balance);
      } else {
        updateBalance((wallet?.balance || 0) + amountNum);
      }
      toast.success(`Successfully added ${formatCurrency(amountNum)} to your wallet!`);
      setIsAddMoneyOpen(false);
      setAddAmount('');
      fetchWalletData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || 'Failed to add money to wallet');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if ((wallet?.balance || 0) < amountNum) {
      toast.error('Insufficient wallet balance');
      return;
    }
    if (!user?.hasPin && withdrawPin.length !== 6) {
      toast.error('Please create your 6-digit payment PIN first');
      setIsCreatePinOpen(true);
      return;
    }
    if (withdrawPin.length !== 6) {
      toast.error('Please enter your complete 6-digit payment PIN');
      return;
    }

    try {
      setIsSubmittingWithdraw(true);
      const res = await walletApi.withdraw({
        amount: amountNum,
        bankAccountId: withdrawBankId || bankAccounts[0]?.id || 'default_bank',
        pin: withdrawPin,
      });
      const updated = res.data?.data?.wallet || res.data?.data;
      if (updated?.balance !== undefined) {
        updateBalance(updated.balance);
      } else {
        updateBalance((wallet?.balance || 0) - amountNum);
      }
      toast.success(`Withdrawal of ${formatCurrency(amountNum)} initiated to bank account!`);
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawPin('');
      fetchWalletData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || 'Withdrawal failed. Check your PIN.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      const msg = 'PIN must be exactly 6 digits';
      setPinError(msg);
      toast.error(msg);
      return;
    }

    if (newPin !== confirmPin) {
      const msg = 'PINs do not match';
      setPinError(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsSubmittingPin(true);
      await walletApi.setPin({
        pin: newPin,
        password: pinPassword || undefined,
      });

      setHasPin(true);
      setWithdrawPin(newPin); // Auto-fill into withdraw form
      toast.success('6-Digit Payment PIN created successfully! You can now authorize your withdrawal.');
      setIsCreatePinOpen(false);
      setNewPin('');
      setConfirmPin('');
      setPinPassword('');
      setPinError('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message || 'Failed to create payment PIN';
      setPinError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingPin(false);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !ifscCode || !holderName) {
      toast.error('Please fill in all bank details');
      return;
    }

    try {
      setIsSubmittingBank(true);
      await walletApi.addBankAccount({
        bankName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        accountHolderName: holderName,
      });
      toast.success('Bank account linked successfully!');
      setIsAddBankOpen(false);
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setHolderName('');
      fetchWalletData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || 'Failed to link bank account');
    } finally {
      setIsSubmittingBank(false);
    }
  };

  const handleDeleteBank = async (id: string) => {
    try {
      await walletApi.deleteBankAccount(id);
      toast.success('Bank account unlinked successfully');
      fetchWalletData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || 'Failed to unlink bank account');
    }
  };

  const currentBalance = wallet?.balance ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Wallet &amp; Payment Sources
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your balance, bank accounts, and funds transfers
        </p>
      </div>

      {/* Balance Showcase Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-[#12121a] border border-indigo-500/30">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Wallet className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Active Digital Balance
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {formatCurrency(currentBalance)}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Secured by RBI Compliant Escrow Partner
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <button
                type="button"
                onClick={() => {
                  setNewPin('');
                  setConfirmPin('');
                  setPinPassword('');
                  setPinError('');
                  setIsCreatePinOpen(true);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors hover:underline"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {user?.hasPin ? 'Payment PIN: Active (Change)' : 'Setup 6-Digit Payment PIN'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setIsAddMoneyOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="py-3 px-5 text-sm"
            >
              Add Money
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsWithdrawOpen(true)}
              leftIcon={<Landmark className="w-4 h-4 text-amber-400" />}
              className="py-3 px-5 text-sm"
            >
              Withdraw to Bank
            </Button>
          </div>
        </div>
      </div>

      {/* Linked Bank Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Linked Bank Accounts</h3>
            <p className="text-xs text-slate-400">
              Accounts used for instant Top-ups and payouts
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddBankOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Link New Bank
          </Button>
        </div>

        {bankAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((account) => (
              <Card
                key={account.id}
                className="bg-[#12121a] border-[#1e1e2e] relative overflow-hidden group hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {account.isPrimary ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Primary
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        Verified
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteBank(account.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Unlink Bank Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-base text-white">{account.bankName}</h4>
                <p className="text-sm font-mono text-slate-300 mt-1">
                  {maskAccountNumber(account.accountNumber)}
                </p>

                <div className="mt-4 pt-4 border-t border-[#1e1e2e] flex items-center justify-between text-xs text-slate-400">
                  <span>IFSC: {account.ifscCode}</span>
                  <span className="text-slate-300">{account.holderName}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#12121a] rounded-2xl border border-[#1e1e2e] text-slate-400 space-y-3">
            <Building2 className="w-10 h-10 mx-auto text-slate-500 opacity-40" />
            <div>
              <h4 className="text-base font-semibold text-white">No Linked Bank Accounts</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                There are no bank accounts linked to your wallet yet. Link your bank account to enable instant top-ups and payouts.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddBankOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Link New Bank Account
            </Button>
          </div>
        )}
      </div>

      {/* Wallet History */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Wallet Activity</h3>
          <p className="text-xs text-slate-400">
            Recent top-ups, settlements, and payouts
          </p>
        </div>

        <div className="space-y-3">
          {walletTransactions.length > 0 ? (
            walletTransactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} />
            ))
          ) : (
            <div className="p-8 text-center bg-[#12121a] rounded-2xl border border-[#1e1e2e] text-slate-400">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No wallet top-ups or withdrawals recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Add Money */}
      <Modal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        title="Add Money to Wallet"
        description="Transfer funds instantly from your linked bank account"
      >
        <form onSubmit={handleAddMoney} className="space-y-4 mt-2">
          <Input
            label="Amount (₹)"
            type="number"
            min="10"
            max="100000"
            placeholder="e.g. 2000"
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            hint="Min ₹10, Max ₹1,00,000 per transaction"
            required
          />

          <div className="flex gap-2">
            {[500, 1000, 2000, 5000].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setAddAmount(String(quick))}
                className="flex-1 py-1.5 text-xs rounded-lg bg-[#1e1e2e] text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 border border-[#2d2d44] transition-colors"
              >
                +₹{quick}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">
              Select Funding Account
            </label>
            {bankAccounts.length > 0 ? (
              <select
                value={addBankId}
                onChange={(e) => setAddBankId(e.target.value)}
                className="w-full bg-[#1e1e2e] border border-[#2d2d44] rounded-xl text-sm text-slate-100 p-3 focus:outline-none focus:border-indigo-500"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} ({maskAccountNumber(b.accountNumber)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-semibold">No bank account linked</p>
                <p className="text-amber-200/80">
                  Please link a bank account first to add funds to your wallet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMoneyOpen(false);
                    setIsAddBankOpen(true);
                  }}
                  className="text-xs text-indigo-400 font-bold hover:underline block pt-1"
                >
                  + Link Bank Account Now
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isSubmittingAdd}
            disabled={bankAccounts.length === 0}
            className="mt-4"
          >
            Confirm &amp; Add Money
          </Button>
        </form>
      </Modal>

      {/* Modal 2: Withdraw */}
      <Modal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        title="Withdraw Funds to Bank"
        description="Transfer your wallet balance back into your bank account"
      >
        <form onSubmit={handleWithdraw} className="space-y-4 mt-2">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
            <span>Available to withdraw:</span>
            <span className="font-bold text-white">{formatCurrency(currentBalance)}</span>
          </div>

          <Input
            label="Withdrawal Amount (₹)"
            type="number"
            min="10"
            max={currentBalance}
            placeholder="e.g. 1500"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            required
          />

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">
              Destination Bank Account
            </label>
            {bankAccounts.length > 0 ? (
              <select
                value={withdrawBankId}
                onChange={(e) => setWithdrawBankId(e.target.value)}
                className="w-full bg-[#1e1e2e] border border-[#2d2d44] rounded-xl text-sm text-slate-100 p-3 focus:outline-none focus:border-indigo-500"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} ({maskAccountNumber(b.accountNumber)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-semibold">No bank account linked</p>
                <p className="text-amber-200/80">
                  Please link a bank account first to receive your withdrawn funds.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsWithdrawOpen(false);
                    setIsAddBankOpen(true);
                  }}
                  className="text-xs text-indigo-400 font-bold hover:underline block pt-1"
                >
                  + Link Bank Account Now
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-[#1e1e2e]">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                Enter 6-Digit Payment PIN
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewPin('');
                    setConfirmPin('');
                    setPinPassword('');
                    setPinError('');
                    setIsCreatePinOpen(true);
                  }}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 hover:underline transition-colors"
                >
                  Forgot PIN?
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setNewPin('');
                    setConfirmPin('');
                    setPinPassword('');
                    setPinError('');
                    setIsCreatePinOpen(true);
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors hover:underline"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {user?.hasPin ? 'Change PIN' : 'Create PIN'}
                </button>
              </div>
            </div>

            {!user?.hasPin && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-200">Payment PIN Required</p>
                  <p className="text-amber-300/80 mt-0.5">
                    You need a 6-digit payment PIN to authorize bank withdrawals.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPin('');
                      setConfirmPin('');
                      setPinPassword('');
                      setPinError('');
                      setIsCreatePinOpen(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create 6-Digit Payment PIN Now
                  </button>
                </div>
              </div>
            )}

            <PinInput
              value={withdrawPin}
              onChange={setWithdrawPin}
              length={6}
            />

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Secured with RBI compliant encrypted validation</span>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isSubmittingWithdraw}
            disabled={bankAccounts.length === 0 || !user?.hasPin || withdrawPin.length !== 6}
            variant="primary"
            className="mt-4"
          >
            Authorize Payout
          </Button>
        </form>
      </Modal>

      {/* Modal 3: Link Bank Account */}
      <Modal
        isOpen={isAddBankOpen}
        onClose={() => setIsAddBankOpen(false)}
        title="Link New Bank Account"
        description="Enter IFSC and Account number for instant IMPS verification"
      >
        <form onSubmit={handleAddBank} className="space-y-4 mt-2">
          <Input
            label="Bank Name"
            placeholder="e.g. State Bank of India"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
          />
          <Input
            label="Account Holder Name"
            placeholder="e.g. Rahul Sharma"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            required
          />
          <Input
            label="Account Number"
            type="password"
            placeholder="Enter bank account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
          <Input
            label="IFSC Code"
            placeholder="e.g. SBIN0001234"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            required
          />

          <Button
            type="submit"
            fullWidth
            loading={isSubmittingBank}
            className="mt-4"
          >
            Verify &amp; Link Account
          </Button>
        </form>
      </Modal>

      {/* Modal 4: Create / Reset 6-Digit Payment PIN */}
      <Modal
        isOpen={isCreatePinOpen}
        onClose={() => {
          setIsCreatePinOpen(false);
          setPinError('');
        }}
        title={user?.hasPin ? 'Change 6-Digit Payment PIN' : 'Create New 6-Digit Payment PIN'}
        description="Set up your 6-digit transaction PIN to authorize withdrawals and transfers"
      >
        <form onSubmit={handleCreatePin} className="space-y-5 mt-2">
          {/* Security Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#12121a] border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">Payment PIN Protection</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Your 6-digit PIN encrypts and authorizes all bank withdrawals and outgoing wallet transfers. Keep it confidential.
              </p>
            </div>
          </div>

          {/* New 6-Digit PIN */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 block text-center">
              Enter New 6-Digit PIN
            </label>
            <PinInput
              value={newPin}
              onChange={setNewPin}
              length={6}
            />
          </div>

          {/* Confirm 6-Digit PIN */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 block text-center">
              Confirm New 6-Digit PIN
            </label>
            <PinInput
              value={confirmPin}
              onChange={setConfirmPin}
              length={6}
            />
          </div>

          {/* Realtime Match Indicator */}
          {confirmPin.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-xs">
              {confirmPin.length === 6 && newPin === confirmPin ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PINs match
                </span>
              ) : confirmPin.length === 6 && newPin !== confirmPin ? (
                <span className="text-rose-400 flex items-center gap-1 font-medium bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> PINs do not match
                </span>
              ) : (
                <span className="text-slate-400">
                  Entering confirmation PIN ({confirmPin.length}/6)...
                </span>
              )}
            </div>
          )}

          {pinError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-center">
              {pinError}
            </div>
          )}

          {/* Optional Password Verification */}
          <div className="pt-2 border-t border-[#1e1e2e]">
            <Input
              label="Account Password (Optional)"
              type="password"
              placeholder="Enter current password if set"
              value={pinPassword}
              onChange={(e) => setPinPassword(e.target.value)}
              hint="Required only if verifying existing password credentials"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => {
                setIsCreatePinOpen(false);
                setPinError('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmittingPin}
              disabled={newPin.length !== 6 || confirmPin.length !== 6 || newPin !== confirmPin}
            >
              Save 6-Digit PIN
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
