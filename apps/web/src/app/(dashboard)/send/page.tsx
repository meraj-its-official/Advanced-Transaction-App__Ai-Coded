"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  Phone,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Wallet,
  Users,
  Check,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatPhone, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { paymentsApi } from "@/lib/api";

interface Recipient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isVerified?: boolean;
  hasWallet?: boolean;
}

export default function SendMoneyPage() {
  const { wallet, updateBalance, user: currentUser } = useAuthStore();

  // Dynamic recipients list from database
  const [dbRecipients, setDbRecipients] = useState<Recipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected recipient & form state
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Confirmation & PIN modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [transactionResult, setTransactionResult] = useState<{
    id: string;
    referenceId?: string;
    amount: number;
    recipientName: string;
    date: string;
  } | null>(null);

  // Fetch registered users dynamically from database
  const fetchRecipients = useCallback(async (query?: string) => {
    try {
      setIsLoadingRecipients(true);
      const res = await paymentsApi.getRecipients(query);
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setDbRecipients(data);
      } else {
        setDbRecipients([]);
      }
    } catch {
      // If endpoint is unreachable or empty, keep empty array
      setDbRecipients([]);
    } finally {
      setIsLoadingRecipients(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  // Handle dynamic recipient search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchRecipients(val);
  };

  // Handle selecting a dynamic recipient from the database list
  const handleSelectRecipient = (user: Recipient) => {
    setRecipient(user);
    setPhone(user.phone.replace(/^\+91/, ""));
  };

  // Handle manual phone number lookup dynamically in the database
  const handlePhoneLookup = async () => {
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (
      currentUser?.phone &&
      currentUser.phone.replace(/\D/g, "").endsWith(cleanPhone)
    ) {
      toast.error("You cannot send money to yourself");
      return;
    }

    try {
      setIsLookingUp(true);
      const res = await paymentsApi.lookupUser(cleanPhone);
      const data = res.data?.data || res.data;
      if (data && data.name) {
        setRecipient({
          id: data.id,
          name: data.name,
          phone: data.phone || cleanPhone,
          email: data.email,
          isVerified: data.isVerified ?? true,
          hasWallet: data.hasWallet ?? true,
        });
        toast.success(`Found user: ${data.name}`);
      } else {
        setRecipient(null);
        toast.error("User not found with this mobile number in database");
      }
    } catch (err: unknown) {
      setRecipient(null);
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errMsg =
        error.response?.data?.message ||
        "User not found in database with this phone number";
      toast.error(errMsg);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!recipient) {
      toast.error("Please select or verify a recipient first");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if ((wallet?.balance || 0) < amountNum) {
      toast.error("Insufficient wallet balance to complete this payment");
      return;
    }

    setPin("");
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (pin.length < 4) {
      toast.error("Please enter your 4 to 6-digit transaction PIN");
      return;
    }

    const amountNum = parseFloat(amount);

    try {
      setIsSubmitting(true);
      const res = await paymentsApi.sendMoney({
        recipientPhone: recipient?.phone || phone,
        amount: amountNum,
        note: description || undefined,
        description: description || undefined,
        pin,
      });

      const data = res.data?.data || res.data;
      const txId = data?.transactionId || data?.id || `TXN_${Date.now()}`;
      const refId = data?.referenceId;

      updateBalance((wallet?.balance || 0) - amountNum);

      setTransactionResult({
        id: txId,
        referenceId: refId,
        amount: amountNum,
        recipientName: recipient?.name || "Recipient",
        date: new Date().toISOString(),
      });

      setIsConfirmModalOpen(false);
      toast.success("Payment sent successfully!");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Payment failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTransactionResult(null);
    setPhone("");
    setAmount("");
    setDescription("");
    setRecipient(null);
    setPin("");
    fetchRecipients();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Send className="w-7 h-7 text-indigo-400" />
          Send Money
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Instant zero-fee transfer to any registered wallet user
        </p>
      </div>

      {/* Success State Screen */}
      {transactionResult ? (
        <Card className="bg-[#12121a] border-emerald-500/30 p-8 text-center space-y-6 animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Payment Completed
            </span>
            <h2 className="text-4xl font-black text-white mt-2">
              {formatCurrency(transactionResult.amount)}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Transferred to{" "}
              <span className="text-white font-medium">
                {transactionResult.recipientName}
              </span>
            </p>
          </div>

          <div className="bg-[#1a1a27] p-4 rounded-xl border border-[#2d2d44] text-xs text-slate-300 space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono text-slate-200">
                {transactionResult.id}
              </span>
            </div>
            {transactionResult.referenceId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono text-slate-200">
                  {transactionResult.referenceId}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Timestamp:</span>
              <span>{new Date(transactionResult.date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-400 font-semibold">
                Instant Settled (Database)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="primary" fullWidth onClick={handleReset}>
              Send Another Payment
            </Button>
            <Link href="/dashboard" className="w-full">
              <Button variant="secondary" fullWidth>
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Form & Dynamic Users State */
        <div className="space-y-6">
          {/* Dynamic Users from Database */}
          <Card className="bg-[#12121a] border-[#1e1e2e] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">
                  Registered Users in Database
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                  Dynamic
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name/phone..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#1a1a27] border border-[#2d2d44] rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {isLoadingRecipients ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Loading users from database...
              </div>
            ) : dbRecipients.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                <AlertCircle className="w-5 h-5 text-slate-500" />
                <span>
                  No registered recipients match your search in the database.
                </span>
                <span className="text-slate-500">
                  You can also enter a 10-digit mobile number below to verify
                  directly.
                </span>
              </div>
            ) : (
              <div className="py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {dbRecipients.map((u) => {
                  const isSelected =
                    recipient?.id === u.id || recipient?.phone === u.phone;
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectRecipient(u)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500/80 shadow-md shadow-indigo-500/20"
                          : "bg-[#1a1a27] border-[#2d2d44] hover:border-slate-500 hover:bg-[#202030]"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow">
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white truncate">
                            {u.name}
                          </p>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          {formatPhone(u.phone)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Transfer Form Card */}
          <Card className="bg-[#12121a] border-[#1e1e2e] p-6 sm:p-8 space-y-6">
            <form onSubmit={handleInitiateSend} className="space-y-5">
              {/* Wallet Balance status bar */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Wallet className="w-4 h-4" />
                  <span>Available Balance:</span>
                </div>
                <span className="font-bold text-white text-sm">
                  {formatCurrency(wallet?.balance ?? 0)}
                </span>
              </div>

              {/* Step A: Recipient Phone */}
              <div className="space-y-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label="Recipient Mobile Number"
                      type="tel"
                      placeholder="e.g. 9876543211"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (recipient) setRecipient(null);
                      }}
                      leftIcon={<Phone className="w-4 h-4" />}
                      maxLength={10}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePhoneLookup}
                    loading={isLookingUp}
                    className="h-11 px-4 text-xs font-semibold"
                  >
                    Verify
                  </Button>
                </div>

                {/* Recipient Preview Badge */}
                {recipient && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {getInitials(recipient.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {recipient.name}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                            DATABASE VERIFIED
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {formatPhone(recipient.phone)}{" "}
                          {recipient.email ? `\u2022 ${recipient.email}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRecipient(null);
                        setPhone("");
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
                      title="Clear recipient"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Step B: Amount */}
              <div className="space-y-2">
                <Input
                  label={`Amount ( \u20B9 )`}
                  type="number"
                  min="1"
                  placeholder="Enter amount to transfer"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[100, 500, 1000, 2000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setAmount(String(quick))}
                      className="py-2 text-xs font-semibold rounded-xl bg-[#1e1e2e] text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/30 border border-[#2d2d44] transition-all"
                    >
                      {`\u20B9`} {quick}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step C: Description Note */}
              <Input
                label="Note / Purpose (Optional)"
                placeholder="e.g. Rent share, Dinner, Coffee"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                variant="primary"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="py-3.5 text-base font-semibold mt-4 shadow-lg shadow-indigo-600/30"
              >
                Continue to Confirm
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Confirmation & PIN Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Payment"
        description="Verify transaction details and enter your security PIN"
      >
        <div className="space-y-5 mt-2">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-[#1a1a27] border border-[#2d2d44] space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Paying To:</span>
              <span className="font-semibold text-white">
                {recipient?.name}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Recipient Phone:</span>
              <span className="text-slate-300 font-mono">
                {recipient ? formatPhone(recipient.phone) : phone}
              </span>
            </div>
            {description && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Description:</span>
                <span className="text-slate-300 italic">{description}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#2d2d44] flex justify-between items-center">
              <span className="text-sm font-medium text-slate-300">
                Total Amount:
              </span>
              <span className="text-xl font-bold text-white">
                {formatCurrency(parseFloat(amount) || 0)}
              </span>
            </div>
          </div>

          {/* Security PIN */}
          <PinInput
            label="Enter Transaction PIN"
            value={pin}
            onChange={setPin}
            length={6}
          />

          <div className="flex items-center gap-1.5 text-xs text-slate-500 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-end encrypted database transfer</span>
          </div>

          <Button
            type="button"
            fullWidth
            variant="primary"
            loading={isSubmitting}
            onClick={handleConfirmPayment}
            className="py-3"
          >
            Authorize &amp; Pay {formatCurrency(parseFloat(amount) || 0)}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
