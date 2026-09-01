import React, { useState, useMemo } from 'react';
import { AdAccount, BusinessManager } from '../types';
import { formatCurrency, formatNumber, formatPercent, getBMColorStyle, downloadCSV } from '../utils/formatters';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  Eye, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpDown, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  BarChart2, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';

interface BMPerformanceCompareProps {
  accounts: AdAccount[];
  businessManagers: BusinessManager[];
  onOpenEditASL: (account: AdAccount) => void;
  onResetSpend: (accountId: string) => void;
}

export const BMPerformanceCompare: React.FC<BMPerformanceCompareProps> = ({
  accounts,
  businessManagers,
  onOpenEditASL,
  onResetSpend,
}) => {
  const [selectedBMId, setSelectedBMId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'spend' | 'purchases' | 'roas' | 'cpa' | 'reach' | 'clicks'>('spend');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewGrouping, setViewGrouping] = useState<'bm_cards' | 'comparative_table'>('bm_cards');
  const [searchFilter, setSearchFilter] = useState('');

  // Calculate per-BM performance statistics
  const bmPerformanceStats = useMemo(() => {
    return businessManagers.map((bm) => {
      const bmAccounts = accounts.filter((a) => a.bmId === bm.id);
      
      const totalSpend = bmAccounts.reduce((sum, a) => sum + a.amountSpent, 0);
      const totalASL = bmAccounts.reduce((sum, a) => sum + a.accountSpendingLimit, 0);
      const totalPurchases = bmAccounts.reduce((sum, a) => sum + a.purchases, 0);
      const totalConversionValue = bmAccounts.reduce((sum, a) => sum + a.purchasesConversionValue, 0);
      const totalRegistrations = bmAccounts.reduce((sum, a) => sum + a.registrationsCompleted, 0);
      const totalClicks = bmAccounts.reduce((sum, a) => sum + a.clicks, 0);
      const totalImpressions = bmAccounts.reduce((sum, a) => sum + a.impressions, 0);
      const totalReach = bmAccounts.reduce((sum, a) => sum + a.reach, 0);

      const avgCPA = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
      const roas = totalSpend > 0 ? totalConversionValue / totalSpend : 0;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
      const costPerReg = totalRegistrations > 0 ? totalSpend / totalRegistrations : 0;

      // Count accounts in warning or limit
      const warningCount = bmAccounts.filter(a => a.status === 'APPROACHING_LIMIT' || a.status === 'LIMIT_REACHED').length;

      return {
        bm,
        accountCount: bmAccounts.length,
        accounts: bmAccounts,
        totalSpend,
        totalASL,
        totalPurchases,
        totalConversionValue,
        totalRegistrations,
        totalClicks,
        totalImpressions,
        totalReach,
        avgCPA,
        roas,
        ctr,
        cpc,
        cpm,
        costPerReg,
        warningCount,
      };
    });
  }, [businessManagers, accounts]);

  // Overall Global Aggregates
  const globalSummary = useMemo(() => {
    let spend = 0;
    let value = 0;
    let purchases = 0;
    let registrations = 0;
    let clicks = 0;
    let impressions = 0;
    let reach = 0;

    accounts.forEach((a) => {
      spend += a.amountSpent;
      value += a.purchasesConversionValue;
      purchases += a.purchases;
      registrations += a.registrationsCompleted;
      clicks += a.clicks;
      impressions += a.impressions;
      reach += a.reach;
    });

    const roas = spend > 0 ? value / spend : 0;
    const cpa = purchases > 0 ? spend / purchases : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return { spend, value, purchases, registrations, clicks, impressions, reach, roas, cpa, ctr };
  }, [accounts]);

  // Sorted and filtered BM stats
  const sortedBMStats = useMemo(() => {
    let list = bmPerformanceStats;
    if (selectedBMId !== 'all') {
      list = list.filter(item => item.bm.id === selectedBMId);
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(item => item.bm.name.toLowerCase().includes(q) || item.bm.bmId.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'spend') { valA = a.totalSpend; valB = b.totalSpend; }
      else if (sortBy === 'purchases') { valA = a.totalPurchases; valB = b.totalPurchases; }
      else if (sortBy === 'roas') { valA = a.roas; valB = b.roas; }
      else if (sortBy === 'cpa') { valA = a.avgCPA; valB = b.avgCPA; }
      else if (sortBy === 'reach') { valA = a.totalReach; valB = b.totalReach; }
      else if (sortBy === 'clicks') { valA = a.totalClicks; valB = b.totalClicks; }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [bmPerformanceStats, selectedBMId, searchFilter, sortBy, sortAsc]);

  // Handle CSV Export of Comparative Data
  const handleExportCSV = () => {
    const headers = [
      'Business Manager',
      'BM ID',
      'Accounts Count',
      'Total Spend ($)',
      'Total Revenue ($)',
      'ROAS',
      'Total Purchases',
      'Average CPA ($)',
      'Registrations',
      'Cost per Reg ($)',
      'Reach',
      'Impressions',
      'Clicks',
      'CTR (%)',
      'CPC ($)',
      'CPM ($)'
    ];

    const rows = sortedBMStats.map(item => [
      item.bm.name,
      item.bm.bmId,
      item.accountCount,
      item.totalSpend.toFixed(2),
      item.totalConversionValue.toFixed(2),
      item.roas.toFixed(2),
      item.totalPurchases,
      item.avgCPA.toFixed(2),
      item.totalRegistrations,
      item.costPerReg.toFixed(2),
      item.totalReach,
      item.totalImpressions,
      item.totalClicks,
      item.ctr.toFixed(2),
      item.cpc.toFixed(2),
      item.cpm.toFixed(2)
    ]);

    downloadCSV(`bm_comparative_performance_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-800 p-4 lg:p-6 space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-xs border border-sky-200 flex items-center gap-1 font-semibold">
                <Target className="w-3.5 h-3.5" />
                Cross-BM Performance Analyzer
              </span>
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">
                Comparative BM Performance & KPI Benchmark
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Compare advertising efficiency, return on ad spend (ROAS), CPA, reach, and conversions across all your Meta Business Managers side-by-side to identify top-performing portfolios and optimize budget allocation.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              Export Benchmark CSV
            </button>
          </div>
        </div>

        {/* Global Summary KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-200">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
              <span>Total Ad Spend</span>
              <DollarSign className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              {formatCurrency(globalSummary.spend)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across {businessManagers.length} BMs</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
              <span>Total Revenue</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
              {formatCurrency(globalSummary.value)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              <span className="font-semibold text-emerald-700">{globalSummary.roas.toFixed(2)}x</span> Avg ROAS
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
              <span>Conversions (Purchases)</span>
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              {formatNumber(globalSummary.purchases)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Avg CPA: <span className="font-semibold text-slate-700">{formatCurrency(globalSummary.cpa)}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
              <span>Total Reach</span>
              <Users className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              {formatNumber(globalSummary.reach)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Unique Meta audience</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
              <span>Total Clicks</span>
              <MousePointerClick className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              {formatNumber(globalSummary.clicks)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Avg CTR: <span className="font-semibold text-slate-700">{formatPercent(globalSummary.ctr)}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
              <span>Impressions</span>
              <Eye className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              {formatNumber(globalSummary.impressions)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Ad deliveries logged</div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search box */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search Business Manager name or ID..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
            />
          </div>

          {/* BM Filter Select */}
          <select
            value={selectedBMId}
            onChange={(e) => setSelectedBMId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-sky-500"
          >
            <option value="all">Compare All Business Managers ({businessManagers.length})</option>
            {businessManagers.map(bm => (
              <option key={bm.id} value={bm.id}>{bm.name}</option>
            ))}
          </select>
        </div>

        {/* Sort & Layout Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Rank by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:outline-hidden font-medium"
            >
              <option value="spend">Highest Ad Spend</option>
              <option value="purchases">Highest Purchases / Conversions</option>
              <option value="roas">Highest ROAS (Return)</option>
              <option value="cpa">Lowest Cost Per Purchase (CPA)</option>
              <option value="reach">Highest Reach</option>
              <option value="clicks">Highest Clicks</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewGrouping('bm_cards')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewGrouping === 'bm_cards' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BM Scorecards
            </button>
            <button
              onClick={() => setViewGrouping('comparative_table')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewGrouping === 'comparative_table' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matrix Table
            </button>
          </div>
        </div>
      </div>

      {/* Visual Comparative Benchmark Bars */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-sky-600" />
            Cross-BM Spend Share & ROAS Benchmark Breakdown
          </span>
          <span className="text-[11px] font-normal text-slate-500">Live share across active BMs</span>
        </h3>

        {/* Spend distribution horizontal stacked bar */}
        <div className="space-y-3">
          <div>
            <div className="text-[11px] text-slate-500 mb-1 flex justify-between">
              <span>Spend Share Allocation:</span>
              <span className="font-mono">{formatCurrency(globalSummary.spend)} Total</span>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
              {bmPerformanceStats.map((item) => {
                const percent = globalSummary.spend > 0 ? (item.totalSpend / globalSummary.spend) * 100 : 0;
                const bmStyle = getBMColorStyle(item.bm.color);
                if (percent <= 0) return null;
                return (
                  <div
                    key={item.bm.id}
                    className={`h-full ${bmStyle.dot.replace('bg-', 'bg-')} transition-all hover:opacity-80`}
                    style={{ width: `${percent}%` }}
                    title={`${item.bm.name}: ${percent.toFixed(1)}% (${formatCurrency(item.totalSpend)})`}
                  />
                );
              })}
            </div>
          </div>

          {/* Quick Legend Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {bmPerformanceStats.map((item) => {
              const percent = globalSummary.spend > 0 ? (item.totalSpend / globalSummary.spend) * 100 : 0;
              const bmStyle = getBMColorStyle(item.bm.color);
              return (
                <div key={item.bm.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${bmStyle.dot}`} />
                  <span className="font-semibold text-slate-800">{item.bm.name}</span>
                  <span className="font-mono text-slate-500">({percent.toFixed(1)}% • ROAS: {item.roas.toFixed(2)}x)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main View: BM Scorecards OR Detailed Comparative Table */}
      {sortedBMStats.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Business Managers to Benchmark</h3>
            <p className="text-xs text-slate-500">
              Connect or create Business Managers in your account to compare spend efficiency, ROAS, CPA, and conversions.
            </p>
          </div>
        </div>
      ) : viewGrouping === 'bm_cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedBMStats.map((item, idx) => {
            const bmStyle = getBMColorStyle(item.bm.color);
            const isTopRoas = idx === 0 && sortBy === 'roas';
            const isTopSpend = idx === 0 && sortBy === 'spend';

            return (
              <div
                key={item.bm.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg ${bmStyle.badge} flex items-center justify-center font-bold text-sm shadow-2xs`}>
                        BM
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {item.bm.name}
                          {item.warningCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                              {item.warningCount} limit alerts
                            </span>
                          )}
                        </h3>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: {item.bm.bmId} • {item.accountCount} Accounts
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* High Level KPI Matrix */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-sky-600" />
                          <span>Total BM Spend:</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {formatCurrency(item.totalSpend, item.bm.currency)}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>Total Revenue (ROAS):</span>
                        </div>
                        <div className="text-sm font-bold text-emerald-600 mt-0.5">
                          {formatCurrency(item.totalConversionValue, item.bm.currency)}
                          <span className="text-[10px] text-slate-500 font-normal ml-1">({item.roas.toFixed(2)}x)</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Performance Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1">
                      <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-sans block">Purchases</span>
                        <span className="font-bold text-slate-800">{formatNumber(item.totalPurchases)}</span>
                      </div>
                      <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-sans block">Avg CPA</span>
                        <span className="font-bold text-slate-800">{item.avgCPA > 0 ? formatCurrency(item.avgCPA, item.bm.currency) : '—'}</span>
                      </div>
                      <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-sans block">CTR</span>
                        <span className="font-bold text-slate-800">{formatPercent(item.ctr)}</span>
                      </div>
                      <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-sans block">Reach</span>
                        <span className="font-bold text-slate-800">{formatNumber(item.totalReach)}</span>
                      </div>
                      <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-sans block">Clicks</span>
                        <span className="font-bold text-slate-800">{formatNumber(item.totalClicks)}</span>
                      </div>
                      <div className="bg-slate-50/70 p-2 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-sans block">Avg CPC</span>
                        <span className="font-bold text-slate-800">{item.cpc > 0 ? formatCurrency(item.cpc, item.bm.currency) : '—'}</span>
                      </div>
                    </div>

                    {/* Ad Accounts in this BM */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Ad Accounts Breakdown ({item.accounts.length})</span>
                        <span className="text-[10px] text-slate-400 font-normal">ASL Usage</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {item.accounts.map((acc) => {
                          const percent = acc.accountSpendingLimit > 0 ? (acc.amountSpent / acc.accountSpendingLimit) * 100 : 0;
                          return (
                            <div key={acc.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                              <div className="truncate max-w-[150px]">
                                <span className="font-medium text-slate-900 truncate block">{acc.name}</span>
                                <span className="text-[10px] font-mono text-slate-400">{formatCurrency(acc.amountSpent)} spent</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                <span className={`font-bold ${percent >= 100 ? 'text-rose-600' : percent >= 80 ? 'text-amber-600' : 'text-slate-700'}`}>
                                  {percent.toFixed(0)}%
                                </span>
                                <button
                                  onClick={() => onOpenEditASL(acc)}
                                  className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50"
                                >
                                  ASL
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Timezone: {item.bm.timezone}
                  </span>
                  <button
                    onClick={() => {
                      // Switch to single BM filter
                      setSelectedBMId(item.bm.id);
                    }}
                    className="text-sky-600 hover:underline font-semibold text-xs flex items-center gap-1"
                  >
                    Focus BM <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Comparative Matrix Table */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">Business Manager</th>
                  <th className="px-3.5 py-3 text-center">Accounts</th>
                  <th className="px-3.5 py-3 text-right">Total Ad Spend</th>
                  <th className="px-3.5 py-3 text-right">Revenue (Conv. Value)</th>
                  <th className="px-3.5 py-3 text-right">ROAS</th>
                  <th className="px-3.5 py-3 text-right">Purchases</th>
                  <th className="px-3.5 py-3 text-right">Avg CPA</th>
                  <th className="px-3.5 py-3 text-right">Registrations</th>
                  <th className="px-3.5 py-3 text-right">Cost / Reg</th>
                  <th className="px-3.5 py-3 text-right">Reach</th>
                  <th className="px-3.5 py-3 text-right">Impressions</th>
                  <th className="px-3.5 py-3 text-right">Clicks</th>
                  <th className="px-3.5 py-3 text-right">CTR</th>
                  <th className="px-3.5 py-3 text-right">Avg CPC</th>
                  <th className="px-3.5 py-3 text-right">Avg CPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {sortedBMStats.map((item) => {
                  const bmStyle = getBMColorStyle(item.bm.color);
                  return (
                    <tr key={item.bm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${bmStyle.dot}`} />
                          <div>
                            <span className="font-bold text-slate-900">{item.bm.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">ID: {item.bm.bmId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-center font-bold text-slate-700">
                        {item.accountCount}
                      </td>
                      <td className="px-3.5 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(item.totalSpend, item.bm.currency)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-bold text-emerald-600">
                        {formatCurrency(item.totalConversionValue, item.bm.currency)}
                      </td>
                      <td className="px-3.5 py-3 text-right font-bold text-indigo-600">
                        {item.roas.toFixed(2)}x
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-800 font-semibold">
                        {formatNumber(item.totalPurchases)}
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-800">
                        {item.avgCPA > 0 ? formatCurrency(item.avgCPA, item.bm.currency) : '—'}
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-700">
                        {formatNumber(item.totalRegistrations)}
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-700">
                        {item.costPerReg > 0 ? formatCurrency(item.costPerReg, item.bm.currency) : '—'}
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-700">
                        {formatNumber(item.totalReach)}
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-700">
                        {formatNumber(item.totalImpressions)}
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-700">
                        {formatNumber(item.totalClicks)}
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-700">
                        {formatPercent(item.ctr)}
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-600">
                        {item.cpc > 0 ? formatCurrency(item.cpc, item.bm.currency) : '—'}
                      </td>
                      <td className="px-3.5 py-3 text-right text-slate-600">
                        {item.cpm > 0 ? formatCurrency(item.cpm, item.bm.currency) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
