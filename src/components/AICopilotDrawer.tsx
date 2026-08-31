import React, { useState } from 'react';
import { AdAccount, BusinessManager } from '../types';
import { formatCurrency, getASLStatusMeta } from '../utils/formatters';
import { Sparkles, X, TrendingUp, Clock, AlertTriangle, ShieldCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AdAccount[];
  businessManagers: BusinessManager[];
  onOpenEditASL: (account: AdAccount) => void;
  onResetSpend: (accountId: string) => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  accounts,
  businessManagers,
  onOpenEditASL,
  onResetSpend,
}) => {
  const [appliedRecommendations, setAppliedRecommendations] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  // Compute pacing velocity
  const accountPredictions = accounts.map((acc) => {
    const meta = getASLStatusMeta(acc.amountSpent, acc.accountSpendingLimit, acc.alertThresholdPercent);
    // Estimated spend rate per hour based on daily spend
    const hourlyBurnRate = Math.max(15, acc.todaySpend > 0 ? acc.todaySpend / 14 : acc.amountSpent / 72);
    const hoursRemaining = meta.remaining > 0 ? meta.remaining / hourlyBurnRate : 0;

    return {
      account: acc,
      meta,
      hourlyBurnRate,
      hoursRemaining,
    };
  }).sort((a, b) => a.hoursRemaining - b.hoursRemaining);

  const urgentPredictions = accountPredictions.filter(p => p.meta.remaining > 0 && p.hoursRemaining < 24);

  const handleApplyRec = (key: string, accountId: string, actionType: 'reset' | 'edit') => {
    setAppliedRecommendations(prev => ({ ...prev, [key]: true }));
    if (actionType === 'reset') {
      onResetSpend(accountId);
    } else {
      const target = accounts.find(a => a.id === accountId);
      if (target) onOpenEditASL(target);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  ASL Burn Rate & Pacing Copilot
                </h3>
                <p className="text-xs text-slate-500">Cross-BM spend limit velocity forecast</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Predictions Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Urgent Warning Summary Card */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Urgent Pacing Watchlist</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                {urgentPredictions.length} ad accounts across your Business Managers are projected to hit their Account Spending Limit in &lt; 24 hours based on active burn rate.
              </p>
            </div>

            {/* List of Accounts by Hours Remaining */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Real-Time Burn Rate Forecast
              </h4>

              {accountPredictions.map(({ account, meta, hourlyBurnRate, hoursRemaining }, idx) => {
                const isLimitHit = meta.status === 'LIMIT_HIT';
                const isUrgent = !isLimitHit && hoursRemaining < 12;

                return (
                  <div
                    key={account.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isLimitHit
                        ? 'bg-rose-50/80 border-rose-200 shadow-xs'
                        : isUrgent
                        ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                        : 'bg-slate-50 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{account.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          BM: {account.bmName}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isLimitHit 
                          ? 'bg-rose-100 text-rose-800 border-rose-200' 
                          : isUrgent 
                          ? 'bg-amber-100 text-amber-800 border-amber-200' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {isLimitHit ? '0 hrs left' : `~${hoursRemaining.toFixed(1)} hrs left`}
                      </span>
                    </div>

                    {/* Pacing details */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2 rounded border border-slate-200 mb-2.5">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Burn Velocity</span>
                        <span className="text-slate-800 font-semibold">~{formatCurrency(hourlyBurnRate)}/hr</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Remaining Buffer</span>
                        <span className={meta.remaining <= 300 ? 'text-amber-600 font-bold' : 'text-slate-800 font-semibold'}>
                          {formatCurrency(meta.remaining, account.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Recommendation Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-[11px] text-slate-600">
                        {isLimitHit ? 'Action: Reset spend to resume' : `Suggested: Increase ASL to ${formatCurrency(account.accountSpendingLimit + 2000)}`}
                      </span>

                      {isLimitHit ? (
                        <button
                          onClick={() => handleApplyRec(`rec_${idx}`, account.id, 'reset')}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Zap className="w-3 h-3" />
                          Reset ASL
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenEditASL(account)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium border border-slate-200 transition-colors flex items-center gap-1 shadow-xs"
                        >
                          Adjust Limit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
