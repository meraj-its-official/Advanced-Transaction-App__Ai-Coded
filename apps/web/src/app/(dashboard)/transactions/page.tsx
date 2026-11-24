'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TransactionStatusBadge } from '@/components/ui/badge';
import { TransactionCard, TransactionItem } from '@/components/features/transaction-card';
import { paymentsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentsApi.getTransactions({
        page,
        limit: 10,
        type: selectedType === 'ALL' ? undefined : selectedType,
        search: searchQuery.trim() || undefined,
      });

      const raw = res.data?.data || res.data;
      const items: TransactionItem[] =
        raw?.items || raw?.data || (Array.isArray(raw) ? raw : []);
      const totalPagesCount = raw?.totalPages || raw?.meta?.totalPages || 1;

      setTransactions(items);
      setTotalPages(totalPagesCount);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setTransactions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, selectedType, searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Transactions' },
    { id: 'TRANSFER', label: 'Transfers' },
    { id: 'TOP_UP', label: 'Top-Ups' },
    { id: 'WITHDRAWAL', label: 'Withdrawals' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transaction History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, and export all digital wallet activities
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success('Exporting monthly statement CSV...')}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export CSV
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-[#12121a] border-[#1e1e2e] p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="w-full md:w-96">
            <Input
              placeholder="Search by name, phone or reference ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedType(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedType === tab.id
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-[#1e1e2e] text-slate-400 hover:text-white hover:bg-[#252538]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-[#12121a] border border-[#1e1e2e] skeleton"
              />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              onClick={(item) => setSelectedTransaction(item)}
            />
          ))
        ) : (
          <Card className="bg-[#12121a] border-[#1e1e2e] p-12 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-semibold text-white">No transactions found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or filter options
            </p>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="Transaction Details"
      >
        {selectedTransaction && (
          <div className="space-y-5">
            <div className="text-center py-4 bg-[#1a1a27] rounded-2xl border border-[#2d2d44]">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Amount
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                {formatCurrency(selectedTransaction.amount, selectedTransaction.currency || 'INR')}
              </h2>
              <div className="mt-2 flex justify-center">
                <TransactionStatusBadge status={selectedTransaction.status} />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[#1e1e2e]">
                <span className="text-slate-400">Transaction Type</span>
                <span className="font-semibold text-white">{selectedTransaction.type}</span>
              </div>

              {selectedTransaction.recipientName && (
                <div className="flex justify-between py-2 border-b border-[#1e1e2e]">
                  <span className="text-slate-400">Recipient</span>
                  <span className="font-semibold text-white">
                    {selectedTransaction.recipientName} ({selectedTransaction.recipientPhone})
                  </span>
                </div>
              )}

              {selectedTransaction.senderName && (
                <div className="flex justify-between py-2 border-b border-[#1e1e2e]">
                  <span className="text-slate-400">Sender</span>
                  <span className="font-semibold text-white">
                    {selectedTransaction.senderName} ({selectedTransaction.senderPhone})
                  </span>
                </div>
              )}

              {selectedTransaction.description && (
                <div className="flex justify-between py-2 border-b border-[#1e1e2e]">
                  <span className="text-slate-400">Note</span>
                  <span className="text-slate-200 italic">{selectedTransaction.description}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-b border-[#1e1e2e]">
                <span className="text-slate-400">Date &amp; Time</span>
                <span className="text-slate-200">{formatDate(selectedTransaction.createdAt)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Reference ID</span>
                <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-400">
                  <span>{selectedTransaction.referenceId || selectedTransaction.id}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(selectedTransaction.referenceId || selectedTransaction.id)
                    }
                    className="p-1 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => setSelectedTransaction(null)}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
