import React, { useState } from 'react';
import { AdAccount, BusinessManager } from '../types';
import { Plus, X, Building2, DollarSign, ShieldAlert, Sliders, Check } from 'lucide-react';

interface AddAdAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessManagers: BusinessManager[];
  onSaveAccount: (account: AdAccount) => Promise<void>;
  onOpenAddBM: () => void;
}

export const AddAdAccountModal: React.FC<AddAdAccountModalProps> = ({
  isOpen,
  onClose,
  businessManagers,
  onSaveAccount,
  onOpenAddBM,
}) => {
  const [bmId, setBmId] = useState(businessManagers[0]?.id || '');
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [accountSpendingLimit, setAccountSpendingLimit] = useState<number>(5000);
  const [dailySpendLimit, setDailySpendLimit] = useState<number>(500);
  const [billingThreshold, setBillingThreshold] = useState<number>(750);
  const [alertThresholdPercent, setAlertThresholdPercent] = useState<number>(80);
  const [initialSpent, setInitialSpent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selected BM currency
  const handleBMChange = (selectedId: string) => {
    setBmId(selectedId);
    const found = businessManagers.find(b => b.id === selectedId);
    if (found) {
      setCurrency(found.currency);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountId.trim()) {
      alert('Please enter Account Name and Meta Account ID.');
      return;
    }

    if (businessManagers.length === 0) {
      alert('Please create at least one Business Manager first.');
      onOpenAddBM();
      return;
    }

    const selectedBM = businessManagers.find(b => b.id === bmId) || businessManagers[0];

    const newAccount: AdAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bmId: selectedBM.id,
      bmName: selectedBM.name,
      name: name.trim(),
      accountId: accountId.trim().startsWith('act_') ? accountId.trim() : `act_${accountId.trim()}`,
      currency: currency || selectedBM.currency,
      status: initialSpent >= accountSpendingLimit && accountSpendingLimit > 0 ? 'LIMIT_REACHED' : 'ACTIVE',
      amountSpent: Number(initialSpent) || 0,
      accountSpendingLimit: Number(accountSpendingLimit) || 0,
      dailySpendLimit: Number(dailySpendLimit) || 0,
      todaySpend: 0,
      billingThreshold: Number(billingThreshold) || 500,
      currentBillingBill: 0,
      alertThresholdPercent: Number(alertThresholdPercent) || 80,
      purchases: 0,
      purchasesConversionValue: 0,
      costPerPurchase: 0,
      avgPurchaseConversionValue: 0,
      registrationsCompleted: 0,
      costPerRegistration: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      impressions: 0,
      reach: 0,
      campaigns: [],
    };

    setIsSubmitting(true);
    try {
      await onSaveAccount(newAccount);
      setName('');
      setAccountId('');
      setInitialSpent(0);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add New Ad Account</h3>
              <p className="text-xs text-slate-500">Configure spend limit tracking & KPIs for this account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {businessManagers.length === 0 ? (
          <div className="my-6 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No Business Manager Found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              You must add or connect a Meta Business Manager before adding Ad Accounts.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAddBM();
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              + Create Business Manager First
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Parent Business Manager <span className="text-rose-500">*</span>
              </label>
              <select
                value={bmId || businessManagers[0]?.id}
                onChange={(e) => handleBMChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-sky-500 font-medium"
              >
                {businessManagers.map(bm => (
                  <option key={bm.id} value={bm.id}>{bm.name} ({bm.bmId}) - {bm.currency}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ad Account Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scaling Ecom - US"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account ID (act_...) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. act_8921820128"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account Spending Limit (ASL)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={accountSpendingLimit}
                    onChange={(e) => setAccountSpendingLimit(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Daily Spend Cap (DSL)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={dailySpendLimit}
                    onChange={(e) => setDailySpendLimit(Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alert Trigger %
                </label>
                <select
                  value={alertThresholdPercent}
                  onChange={(e) => setAlertThresholdPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                >
                  <option value={50}>50% Limit</option>
                  <option value={75}>75% Limit</option>
                  <option value={80}>80% Limit (Default)</option>
                  <option value={90}>90% Limit</option>
                  <option value={95}>95% Limit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Amount Spent (Starting value)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  value={initialSpent}
                  onChange={(e) => setInitialSpent(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Create Ad Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
