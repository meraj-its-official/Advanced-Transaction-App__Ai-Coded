'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Calendar,
  KeyRound,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { getInitials, formatCurrency, formatDate } from '@/lib/utils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const router = useRouter();
  const { user, wallet, logout } = useAuthStore();
  const [copiedWalletId, setCopiedWalletId] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const copyWalletId = () => {
    if (wallet?.id) {
      navigator.clipboard.writeText(wallet.id);
      setCopiedWalletId(true);
      toast.success('Wallet ID copied to clipboard');
      setTimeout(() => setCopiedWalletId(false), 2000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion');
      return;
    }

    try {
      setIsDeleting(true);
      await authApi.deleteAccount();
      toast.success('Your account has been deleted successfully');
      logout();
      onClose();
      router.push('/register');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      toast.error(
        err.response?.data?.message || 'Failed to delete account. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Profile">
      {!showDeleteConfirm ? (
        <div className="space-y-6">
          {/* User Hero Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              {getInitials(user.name || 'User')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white truncate">{user.name}</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  {user.isVerified ? 'Verified' : 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {user.email}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {user.phone ? (user.phone.startsWith('+91') ? user.phone : `+91 ${user.phone}`) : 'No phone'}
              </p>
            </div>
          </div>

          {/* Wallet & Security Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Wallet Balance & ID */}
            <div className="p-3.5 rounded-xl bg-[#12121a] border border-[#1e1e2e] space-y-1">
              <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                Wallet Balance
              </span>
              <p className="text-lg font-bold text-white">
                {formatCurrency(wallet?.balance ?? 0, wallet?.currency ?? 'INR')}
              </p>
              {wallet?.id && (
                <div className="flex items-center justify-between pt-1 border-t border-[#1e1e2e]/60 text-[11px] text-slate-400">
                  <span className="truncate font-mono">ID: {wallet.id.slice(0, 10)}...</span>
                  <button
                    onClick={copyWalletId}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 p-1"
                    title="Copy Wallet ID"
                  >
                    {copiedWalletId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>

            {/* Payment PIN Status */}
            <div className="p-3.5 rounded-xl bg-[#12121a] border border-[#1e1e2e] space-y-1">
              <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                Payment PIN
              </span>
              <div className="flex items-center gap-2 pt-1">
                {user.hasPin ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> 6-Digit PIN Configured
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> Not Set Yet
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  onClose();
                  router.push('/wallet');
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 pt-1"
              >
                {user.hasPin ? 'Update PIN' : 'Create 6-digit PIN'} →
              </button>
            </div>
          </div>

          {/* Member Details */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Member Since
            </span>
            <span className="text-slate-200 font-medium">
              {user.createdAt ? formatDate(user.createdAt) : '2026'}
            </span>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="pt-4 border-t border-[#1e1e2e] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Danger Zone
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Permanently delete your PayFlow account and all saved data
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/50"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Delete Confirmation View */
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Delete PayFlow Account</h4>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              This action is permanent and cannot be undone. All your bank connections,
              active sessions, and profile data will be permanently removed.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Type <span className="font-mono text-rose-400 font-bold">DELETE</span> to confirm:
            </label>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="font-mono text-sm uppercase"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteInput('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleteInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
              loading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default ProfileModal;