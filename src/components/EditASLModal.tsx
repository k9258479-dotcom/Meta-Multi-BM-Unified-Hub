import React, { useState } from 'react';
import { AdAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { X, Sliders, RotateCcw, AlertTriangle, Check, ShieldCheck, DollarSign } from 'lucide-react';

interface EditASLModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AdAccount | null;
  onSave: (accountId: string, newASL: number, newDSL: number, alertThreshold: number) => void;
  onResetSpend: (accountId: string) => void;
}

export const EditASLModal: React.FC<EditASLModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
  onResetSpend,
}) => {
  if (!isOpen || !account) return null;

  const [aslValue, setAslValue] = useState<number>(account.accountSpendingLimit);
  const [dslValue, setDslValue] = useState<number>(account.dailySpendLimit);
  const [thresholdValue, setThresholdValue] = useState<number>(account.alertThresholdPercent || 85);
  const [isResetConfirming, setIsResetConfirming] = useState(false);

  const percentUsed = aslValue > 0 ? (account.amountSpent / aslValue) * 100 : 0;
  const remaining = Math.max(0, aslValue - account.amountSpent);

  const handleQuickAdd = (amount: number) => {
    setAslValue(prev => prev + amount);
  };

  const handleSetUnlimited = () => {
    setAslValue(0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(account.id, aslValue, dslValue, thresholdValue);
    onClose();
  };

  const handleResetSpendAction = () => {
    onResetSpend(account.id);
    setIsResetConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Account Spending Limit (ASL) Settings</h3>
              <p className="text-xs text-slate-500 font-mono">{account.name} • BM: {account.bmName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Indicator */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-slate-500">Current Spend vs. Limit:</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatCurrency(account.amountSpent, account.currency)} / {aslValue > 0 ? formatCurrency(aslValue, account.currency) : 'No Limit (Unlimited)'}
            </span>
          </div>

          {aslValue > 0 ? (
            <>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full rounded-full transition-all ${
                    percentUsed >= 100 
                      ? 'bg-rose-500' 
                      : percentUsed >= thresholdValue 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, percentUsed)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{percentUsed.toFixed(1)}% Used</span>
                <span className={remaining <= 500 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                  {formatCurrency(remaining, account.currency)} Remaining
                </span>
              </div>
            </>
          ) : (
            <div className="px-3 py-2 bg-slate-100 rounded border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>No Account Spending Limit configured (Ads will run continuously).</span>
            </div>
          )}
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1.5 flex items-center justify-between">
              <span>Account Spending Limit (ASL) Target ($)</span>
              <span className="text-slate-500 text-[11px]">Meta Ads Manager Lifetime Cap</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="50"
                value={aslValue}
                onChange={(e) => setAslValue(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Quick Increase Pills */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-500">Quick actions:</span>
              <button
                type="button"
                onClick={() => handleQuickAdd(500)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono border border-slate-200 transition-colors"
              >
                +$500
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1000)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono border border-slate-200 transition-colors"
              >
                +$1,000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(5000)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono border border-slate-200 transition-colors"
              >
                +$5,000
              </button>
              <button
                type="button"
                onClick={handleSetUnlimited}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] border border-slate-200 transition-colors"
              >
                Remove Limit (0)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1.5">
                Daily Spend Limit (DSL) ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={dslValue}
                  onChange={(e) => setDslValue(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1.5 flex items-center justify-between">
                <span>Alert Trigger (%)</span>
                <span className="text-amber-600 font-mono font-bold">{thresholdValue}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="98"
                step="1"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(parseInt(e.target.value, 10))}
                className="w-full mt-2 accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>50%</span>
                <span>80%</span>
                <span>90%</span>
                <span>98%</span>
              </div>
            </div>
          </div>

          {/* Reset Spend Section */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                  <span>Reset Spent Amount in Meta</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Simulates pressing "Reset Spend" in Meta Ads Manager to reset spend to $0.00 without changing campaign history.
                </p>
              </div>
              
              {!isResetConfirming ? (
                <button
                  type="button"
                  onClick={() => setIsResetConfirming(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded border border-slate-300 transition-colors shrink-0 ml-2 shadow-xs"
                >
                  Reset Spend
                </button>
              ) : (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={handleResetSpendAction}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded transition-colors"
                  >
                    Confirm Reset!
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetConfirming(false)}
                    className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Save Limits & Thresholds
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
