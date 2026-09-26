import React from 'react';
import { X, Landmark, ArrowUpRight, ArrowDownLeft, ShieldCheck, Download, ExternalLink } from 'lucide-react';

interface BankingLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountName?: string;
  accountNumber?: string;
}

export const BankingLedgerModal: React.FC<BankingLedgerModalProps> = ({
  isOpen,
  onClose,
  accountName = 'State Bank of India',
  accountNumber = 'A/C 4567891201 (AC-001)',
}) => {
  if (!isOpen) return null;

  const transactions = [
    {
      id: 'FIN-001-C',
      date: '07 Aug 2026, 17:15',
      type: 'Credit (IMPS Loop Return)',
      amount: '₹7,500',
      isCredit: true,
      sender: 'Suresh Patel (AC-003)',
      beneficiary: 'Rahul Sharma (AC-001)',
      utr: 'SBIN00291048201',
      status: 'Settled',
    },
    {
      id: 'FIN-001-B',
      date: '06 Aug 2026, 12:30',
      type: 'Inter-Account Transfer',
      amount: '₹12,000',
      isCredit: false,
      sender: 'Amit Verma (AC-002)',
      beneficiary: 'Suresh Patel (AC-003)',
      utr: 'SBIN00291039812',
      status: 'Settled',
    },
    {
      id: 'FIN-001-A',
      date: '05 Aug 2026, 10:45',
      type: 'Debit (NEFT Outbound)',
      amount: '₹18,500',
      isCredit: false,
      sender: 'Rahul Sharma (AC-001)',
      beneficiary: 'Amit Verma (AC-002)',
      utr: 'SBIN00192039401',
      status: 'Settled',
    },
    {
      id: 'FIN-002',
      date: '08 Aug 2026, 14:10',
      type: 'Credit (IMPS Transit)',
      amount: '₹9,000',
      isCredit: true,
      sender: 'Neeraj Khan (AC-004)',
      beneficiary: 'Vikram Singh (AC-005)',
      utr: 'IMPS39102948190',
      status: 'Settled',
    },
    {
      id: 'FIN-003',
      date: '09 Aug 2026, 11:20',
      type: 'Transfer (RTGS)',
      amount: '₹15,000',
      isCredit: true,
      sender: 'Priya Sharma (AC-006)',
      beneficiary: 'Rohan Gupta (AC-007)',
      utr: 'SBIN00482910482',
      status: 'Settled',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Core Banking Transaction Ledger (FIN_001 Circular Analysis)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {accountNumber} • IFSC: SBIN0001048 • Branch: Bhopal Central
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Circular Transfer Volume</span>
              <span className="text-slate-900 font-bold text-sm">₹38,000 (FIN_001)</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Loop Completion Return</span>
              <span className="text-slate-900 font-bold text-sm">₹7,500 (AC-003 ➔ AC-001)</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">FIU-IND Status</span>
              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-xs mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                STR-2026-BPL-FIN01 Flagged
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase">
                  <th className="py-2.5 px-4">UTR / Ref ID</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Sender ➔ Recipient</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700">
                      {tx.utr}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        {tx.isCredit ? (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">
                      <div className="text-xs">{tx.beneficiary}</div>
                      <div className="text-[10px] text-slate-400">From: {tx.sender}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="text-slate-400">Source: Core Banking CBS Gateway & Financial Intelligence Unit (FIU)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
