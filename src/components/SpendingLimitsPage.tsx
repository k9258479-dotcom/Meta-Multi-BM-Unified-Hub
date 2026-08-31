import React, { useState, useMemo } from 'react';
import { AdAccount, BusinessManager } from '../types';
import { formatCurrency, getASLStatusMeta, getBMColorStyle } from '../utils/formatters';
import { 
  ShieldAlert, 
  RotateCcw, 
  Sliders, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Receipt, 
  Zap, 
  Building2, 
  Layers, 
  Filter, 
  ArrowUpDown,
  Search,
  Plus
} from 'lucide-react';

interface SpendingLimitsPageProps {
  accounts: AdAccount[];
  businessManagers: BusinessManager[];
  onOpenEditASL: (account: AdAccount) => void;
  onResetSpend: (accountId: string) => void;
  onQuickAddASL: (accountId: string, amount: number) => void;
  onOpenBMManager: () => void;
}

export const SpendingLimitsPage: React.FC<SpendingLimitsPageProps> = ({
  accounts,
  businessManagers,
  onOpenEditASL,
  onResetSpend,
  onQuickAddASL,
  onOpenBMManager,
}) => {
  const [viewMode, setViewMode] = useState<'grouped_by_bm' | 'unified_grid'>('unified_grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'warning_only' | 'limit_hit' | 'healthy'>('all');
  const [sortBy, setSortBy] = useState<'percent_used' | 'remaining_dollars' | 'current_spent' | 'name'>('percent_used');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBMFilter, setSelectedBMFilter] = useState<string>('all');

  // Filtered & Sorted accounts
  const processedAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // BM filter
      if (selectedBMFilter !== 'all' && acc.bmId !== selectedBMFilter) {
        return false;
      }
      // Status filter
      const meta = getASLStatusMeta(acc.amountSpent, acc.accountSpendingLimit, acc.alertThresholdPercent);
      if (statusFilter === 'warning_only' && meta.status !== 'APPROACHING' && meta.status !== 'CRITICAL' && meta.status !== 'LIMIT_HIT') {
        return false;
      }
      if (statusFilter === 'limit_hit' && meta.status !== 'LIMIT_HIT') {
        return false;
      }
      if (statusFilter === 'healthy' && meta.status !== 'NORMAL') {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return acc.name.toLowerCase().includes(q) || 
               acc.bmName.toLowerCase().includes(q) || 
               acc.accountId.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => {
      const metaA = getASLStatusMeta(a.amountSpent, a.accountSpendingLimit, a.alertThresholdPercent);
      const metaB = getASLStatusMeta(b.amountSpent, b.accountSpendingLimit, b.alertThresholdPercent);

      if (sortBy === 'percent_used') {
        return metaB.percent - metaA.percent;
      }
      if (sortBy === 'remaining_dollars') {
        return metaA.remaining - metaB.remaining;
      }
      if (sortBy === 'current_spent') {
        return b.amountSpent - a.amountSpent;
      }
      return a.name.localeCompare(b.name);
    });
  }, [accounts, selectedBMFilter, statusFilter, searchQuery, sortBy]);

  // Overall ASL Aggregates
  const stats = useMemo(() => {
    let totalSpent = 0;
    let totalLimitPool = 0;
    let limitHitCount = 0;
    let approachingCount = 0;
    let healthyCount = 0;
    let totalRemaining = 0;

    accounts.forEach((acc) => {
      totalSpent += acc.amountSpent;
      totalLimitPool += acc.accountSpendingLimit;
      const meta = getASLStatusMeta(acc.amountSpent, acc.accountSpendingLimit, acc.alertThresholdPercent);
      if (meta.status === 'LIMIT_HIT') limitHitCount++;
      else if (meta.status === 'CRITICAL' || meta.status === 'APPROACHING') approachingCount++;
      else healthyCount++;

      if (acc.accountSpendingLimit > 0) {
        totalRemaining += Math.max(0, acc.accountSpendingLimit - acc.amountSpent);
      }
    });

    const overallPercent = totalLimitPool > 0 ? (totalSpent / totalLimitPool) * 100 : 0;

    return {
      totalSpent,
      totalLimitPool,
      totalRemaining,
      overallPercent,
      limitHitCount,
      approachingCount,
      healthyCount,
    };
  }, [accounts]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-800 p-4 lg:p-6 space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-xs border border-sky-200">
                Multi-BM Guard Active
              </span>
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">
                Cross-BM Account Spending Limit (ASL) Command Center
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Monitor and control account spending limits across all your Business Managers in a single real-time view. 
              Reset counters, adjust budget ceilings, and prevent ad stops without logging in and out of different BMs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenBMManager}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Building2 className="w-4 h-4 text-sky-600" />
              Manage BMs ({businessManagers.length})
            </button>
          </div>
        </div>

        {/* Global Summary KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Total Combined Spend</span>
              <DollarSign className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              {formatCurrency(stats.totalSpent)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Across {accounts.length} ad accounts in {businessManagers.length} BMs
            </div>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Combined ASL Capacity</span>
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              {formatCurrency(stats.totalLimitPool)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{stats.overallPercent.toFixed(1)}%</span> total pool utilized
            </div>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Remaining Spend Buffer</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
              {formatCurrency(stats.totalRemaining)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Safe budget before caps trigger
            </div>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Account Danger Index</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {stats.limitHitCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold font-mono">
                  {stats.limitHitCount} Limit Hit
                </span>
              )}
              {stats.approachingCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold font-mono">
                  {stats.approachingCount} Warning
                </span>
              )}
              {stats.limitHitCount === 0 && stats.approachingCount === 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  All Healthy
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {stats.healthyCount} accounts in safe zone
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by account or BM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
            />
          </div>

          {/* BM Filter Select */}
          <select
            value={selectedBMFilter}
            onChange={(e) => setSelectedBMFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-sky-500"
          >
            <option value="all">All Business Managers ({businessManagers.length})</option>
            {businessManagers.map(bm => (
              <option key={bm.id} value={bm.id}>{bm.name}</option>
            ))}
          </select>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({accounts.length})
            </button>
            <button
              onClick={() => setStatusFilter('warning_only')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'warning_only' ? 'bg-amber-100 text-amber-800 font-semibold border border-amber-200' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              ⚠️ Warnings ({stats.approachingCount + stats.limitHitCount})
            </button>
            <button
              onClick={() => setStatusFilter('limit_hit')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'limit_hit' ? 'bg-rose-100 text-rose-800 font-semibold border border-rose-200' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              🛑 Limit Hit ({stats.limitHitCount})
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === 'healthy' ? 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              🟢 Healthy ({stats.healthyCount})
            </button>
          </div>
        </div>

        {/* Sort & Layout Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:outline-hidden"
            >
              <option value="percent_used">Highest % Spent First</option>
              <option value="remaining_dollars">Lowest $ Remaining</option>
              <option value="current_spent">Highest Spend ($)</option>
              <option value="name">Account Name</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('unified_grid')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'unified_grid' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matrix Cards
            </button>
            <button
              onClick={() => setViewMode('grouped_by_bm')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'grouped_by_bm' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grouped by BM
            </button>
          </div>
        </div>
      </div>

      {/* Account Spending Limit Cards Display */}
      {viewMode === 'unified_grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {processedAccounts.map((account) => {
            const meta = getASLStatusMeta(account.amountSpent, account.accountSpendingLimit, account.alertThresholdPercent);
            const bm = businessManagers.find(b => b.id === account.bmId);
            const bmStyle = getBMColorStyle(bm?.color || 'blue');
            const isLimitHit = meta.status === 'LIMIT_HIT';
            const isWarning = meta.status === 'APPROACHING' || meta.status === 'CRITICAL';

            return (
              <div
                key={account.id}
                className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 hover:shadow-md ${
                  isLimitHit
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isWarning
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Line: BM Badge & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${bmStyle.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${bmStyle.dot}`} />
                      {account.bmName}
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                      {isLimitHit ? (
                        <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      )}
                      {meta.label}
                    </span>
                  </div>

                  {/* Account Name & ID */}
                  <div className="mb-3">
                    <h3 className="font-bold text-slate-900 text-sm truncate hover:text-sky-600 cursor-pointer transition-colors" onClick={() => onOpenEditASL(account)}>
                      {account.name}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                      <span>ID: {account.accountId}</span>
                      <span>•</span>
                      <span>{account.campaigns.length} campaigns</span>
                    </div>
                  </div>

                  {/* ASL Progress Meter */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">Spent vs. ASL Limit:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(account.amountSpent, account.currency)} / {account.accountSpendingLimit > 0 ? formatCurrency(account.accountSpendingLimit, account.currency) : 'Unlimited'}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-2 relative">
                      <div
                        className={`h-full rounded-full transition-all ${meta.progressColor} ${
                          isLimitHit ? 'animate-pulse' : ''
                        }`}
                        style={{ width: `${Math.min(100, meta.percent)}%` }}
                      />
                      {/* Threshold marker */}
                      {account.accountSpendingLimit > 0 && (
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-600/70 z-10"
                          style={{ left: `${account.alertThresholdPercent}%` }}
                          title={`Alert threshold (${account.alertThresholdPercent}%)`}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500">{meta.percent.toFixed(1)}% Used</span>
                      <span className={isLimitHit ? 'text-rose-600 font-bold' : isWarning ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {isLimitHit ? '0.00 Remaining (STOPPED)' : `${formatCurrency(meta.remaining, account.currency)} Remaining`}
                      </span>
                    </div>
                  </div>

                  {/* Meta Billing & Velocity Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
                        <Receipt className="w-3 h-3 text-slate-400" />
                        <span>Billing Threshold:</span>
                      </div>
                      <div className="text-slate-800 font-bold mt-0.5">
                        {formatCurrency(account.currentBillingBill)} / {formatCurrency(account.billingThreshold)}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
                        <TrendingUp className="w-3 h-3 text-slate-400" />
                        <span>Daily Spend (DSL):</span>
                      </div>
                      <div className="text-slate-800 font-bold mt-0.5">
                        {formatCurrency(account.todaySpend)} / {formatCurrency(account.dailySpendLimit)}
                      </div>
                    </div>
                  </div>

                  {account.notes && (
                    <p className="text-[11px] text-slate-500 italic mb-3 line-clamp-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      "{account.notes}"
                    </p>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onResetSpend(account.id)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                    Reset Spend
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickAddASL(account.id, 1000)}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 font-mono text-[11px] transition-colors"
                      title="Quickly add +$1,000 to ASL"
                    >
                      +$1k
                    </button>
                    <button
                      onClick={() => onOpenEditASL(account)}
                      className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grouped By Business Manager View */
        <div className="space-y-6">
          {businessManagers.map((bm) => {
            const bmAccounts = processedAccounts.filter(a => a.bmId === bm.id);
            if (bmAccounts.length === 0 && selectedBMFilter !== 'all' && selectedBMFilter !== bm.id) return null;
            const bmStyle = getBMColorStyle(bm.color);
            const bmTotalSpent = bmAccounts.reduce((acc, curr) => acc + curr.amountSpent, 0);
            const bmTotalASL = bmAccounts.reduce((acc, curr) => acc + curr.accountSpendingLimit, 0);

            return (
              <div key={bm.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                {/* BM Header Banner */}
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${bmStyle.badge} flex items-center justify-center font-bold text-sm`}>
                      BM
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{bm.name}</span>
                        <span className="text-[11px] font-mono text-slate-500 font-normal">
                          (ID: {bm.bmId})
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {bmAccounts.length} Ad accounts • Timezone: {bm.timezone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <div className="text-slate-500 text-[10px]">BM Total Spend</div>
                      <div className="font-bold text-slate-900">{formatCurrency(bmTotalSpent)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 text-[10px]">Total ASL Limit</div>
                      <div className="font-bold text-slate-900">{formatCurrency(bmTotalASL)}</div>
                    </div>
                  </div>
                </div>

                {/* BM Accounts Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-medium">
                      <tr>
                        <th className="px-4 py-2.5">Ad Account</th>
                        <th className="px-4 py-2.5 text-right">Current Spend</th>
                        <th className="px-4 py-2.5 text-right">Spending Limit</th>
                        <th className="px-4 py-2.5 text-center">Usage Meter</th>
                        <th className="px-4 py-2.5 text-right">Remaining</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {bmAccounts.map((acc) => {
                        const meta = getASLStatusMeta(acc.amountSpent, acc.accountSpendingLimit, acc.alertThresholdPercent);
                        return (
                          <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-sans">
                              <div className="font-bold text-slate-900 hover:text-sky-600 cursor-pointer" onClick={() => onOpenEditASL(acc)}>
                                {acc.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">{acc.accountId}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                              {formatCurrency(acc.amountSpent, acc.currency)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {formatCurrency(acc.accountSpendingLimit, acc.currency)}
                            </td>
                            <td className="px-4 py-3 text-center min-w-[140px]">
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-1">
                                <div
                                  className={`h-full rounded-full ${meta.progressColor}`}
                                  style={{ width: `${Math.min(100, meta.percent)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-500">{meta.percent.toFixed(1)}%</span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              {formatCurrency(meta.remaining, acc.currency)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 font-sans">
                                <button
                                  onClick={() => onResetSpend(acc.id)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors border border-slate-200"
                                >
                                  Reset
                                </button>
                                <button
                                  onClick={() => onOpenEditASL(acc)}
                                  className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs transition-colors"
                                >
                                  Edit ASL
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
