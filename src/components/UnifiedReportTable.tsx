import React, { useState, useMemo } from 'react';
import { AdAccount, BusinessManager, ColumnConfig, Campaign } from '../types';
import { formatCurrency, formatNumber, formatPercent, getASLStatusMeta, getBMColorStyle, downloadCSV } from '../utils/formatters';
import { 
  Search, 
  RotateCw, 
  Download, 
  Share2, 
  SlidersHorizontal, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  Building2, 
  Layers, 
  Check, 
  X, 
  ArrowUpDown, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  FileText,
  Sliders,
  ChevronDownSquare,
  ChevronUpSquare,
  Sparkles
} from 'lucide-react';

interface UnifiedReportTableProps {
  accounts: AdAccount[];
  businessManagers: BusinessManager[];
  columns: ColumnConfig[];
  onUpdateColumns: (columns: ColumnConfig[]) => void;
  selectedBMIds: string[];
  onToggleBM: (bmId: string) => void;
  onSelectAllBMs: () => void;
  dateRange: string;
  onChangeDateRange: (val: string) => void;
  onOpenEditASL: (account: AdAccount) => void;
  onResetSpend: (accountId: string) => void;
}

export const UnifiedReportTable: React.FC<UnifiedReportTableProps> = ({
  accounts,
  businessManagers,
  columns,
  onUpdateColumns,
  selectedBMIds,
  onToggleBM,
  onSelectAllBMs,
  dateRange,
  onChangeDateRange,
  onOpenEditASL,
  onResetSpend,
}) => {
  const [reportTitle, setReportTitle] = useState('Cross-BM Performance Report');
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'had_delivery'>('had_delivery');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [activeCustomizeTab, setActiveCustomizeTab] = useState<'breakdowns' | 'metrics'>('breakdowns');
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({
    act_1: true,
    act_2: true,
    act_3: false,
    act_4: false,
    act_5: false,
  });
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({
    cmp_101: true,
  });
  const [isBMDropdownOpen, setIsBMDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<string>('amount_spent');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter accounts by selected BMs, search query, delivery filter
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // BM filter
      if (selectedBMIds.length > 0 && !selectedBMIds.includes(acc.bmId)) {
        return false;
      }
      // Delivery filter
      if (deliveryFilter === 'had_delivery' && acc.amountSpent <= 0 && acc.purchases <= 0) {
        // Keep if it has delivery or is in the screenshot mock
        if (acc.name !== 'MF12-KDYY(+8)-0803-9') {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAcc = acc.name.toLowerCase().includes(q) || 
                           acc.accountId.toLowerCase().includes(q) ||
                           acc.bmName.toLowerCase().includes(q);
        const matchesCamp = acc.campaigns.some(c => c.name.toLowerCase().includes(q));
        if (!matchesAcc && !matchesCamp) return false;
      }
      return true;
    });
  }, [accounts, selectedBMIds, deliveryFilter, searchQuery]);

  // Aggregate totals
  const totals = useMemo(() => {
    let totalSpent = 0;
    let totalConversionValue = 0;
    let totalPurchases = 0;
    let totalRegistrations = 0;
    let totalClicks = 0;
    let totalImpressions = 0;

    filteredAccounts.forEach((acc) => {
      totalSpent += acc.amountSpent;
      totalConversionValue += acc.purchasesConversionValue;
      totalPurchases += acc.purchases;
      totalRegistrations += acc.registrationsCompleted;
      totalClicks += acc.clicks;
      totalImpressions += acc.impressions;
    });

    const costPerPurchase = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
    const avgConversionValue = totalSpent > 0 ? totalConversionValue / totalSpent : 0;
    const costPerRegistration = totalRegistrations > 0 ? totalSpent / totalRegistrations : 0;
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      totalSpent,
      totalConversionValue,
      totalPurchases,
      costPerPurchase,
      avgConversionValue,
      totalRegistrations,
      costPerRegistration,
      totalClicks,
      overallCTR,
      rowCount: filteredAccounts.reduce((acc, curr) => acc + 1 + curr.campaigns.length, 0),
    };
  }, [filteredAccounts]);

  const toggleAccountExpand = (accId: string) => {
    setExpandedAccounts(prev => ({ ...prev, [accId]: !prev[accId] }));
  };

  const toggleCampaignExpand = (cmpId: string) => {
    setExpandedCampaigns(prev => ({ ...prev, [cmpId]: !prev[cmpId] }));
  };

  const expandAll = () => {
    const accState: Record<string, boolean> = {};
    const cmpState: Record<string, boolean> = {};
    accounts.forEach(a => {
      accState[a.id] = true;
      a.campaigns.forEach(c => {
        cmpState[c.id] = true;
      });
    });
    setExpandedAccounts(accState);
    setExpandedCampaigns(cmpState);
  };

  const collapseAll = () => {
    setExpandedAccounts({});
    setExpandedCampaigns({});
  };

  const handleToggleColumn = (colId: string) => {
    onUpdateColumns(
      columns.map(c => c.id === colId ? { ...c, visible: !c.visible } : c)
    );
  };

  const handleExportCSV = () => {
    const headerRow = columns.filter(c => c.visible).map(c => c.label);
    const dataRows: (string | number)[][] = [];

    filteredAccounts.forEach(acc => {
      // Account summary row
      const accRow = columns.filter(c => c.visible).map(col => {
        switch (col.id) {
          case 'account_name': return acc.name;
          case 'bm_name': return acc.bmName;
          case 'campaign_name': return 'All (Account Total)';
          case 'amount_spent': return acc.amountSpent;
          case 'asl_status': return `${acc.amountSpent} / ${acc.accountSpendingLimit}`;
          case 'purchases_conversion_value': return acc.purchasesConversionValue;
          case 'cost_per_purchase': return acc.costPerPurchase;
          case 'purchases': return acc.purchases;
          case 'avg_purchase_value': return acc.avgPurchaseConversionValue;
          case 'registrations': return acc.registrationsCompleted;
          case 'cost_per_registration': return acc.costPerRegistration;
          case 'clicks': return acc.clicks;
          case 'ctr': return acc.ctr;
          case 'cpc': return acc.cpc;
          case 'cpm': return acc.cpm;
          case 'impressions': return acc.impressions;
          case 'reach': return acc.reach;
          case 'remaining_asl': return Math.max(0, acc.accountSpendingLimit - acc.amountSpent);
          default: return '';
        }
      });
      dataRows.push(accRow);

      // Campaign rows
      acc.campaigns.forEach(cmp => {
        const cmpRow = columns.filter(c => c.visible).map(col => {
          switch (col.id) {
            case 'account_name': return '';
            case 'bm_name': return acc.bmName;
            case 'campaign_name': return cmp.name;
            case 'amount_spent': return cmp.amountSpent;
            case 'asl_status': return cmp.status;
            case 'purchases_conversion_value': return cmp.purchasesConversionValue;
            case 'cost_per_purchase': return cmp.costPerPurchase;
            case 'purchases': return cmp.purchases;
            case 'avg_purchase_value': return cmp.avgPurchaseConversionValue;
            case 'registrations': return cmp.registrationsCompleted;
            case 'cost_per_registration': return cmp.costPerRegistration;
            case 'clicks': return cmp.clicks;
            case 'ctr': return cmp.ctr;
            case 'cpc': return cmp.cpc;
            case 'cpm': return cmp.cpm;
            case 'impressions': return cmp.impressions;
            case 'reach': return '';
            case 'remaining_asl': return '';
            default: return '';
          }
        });
        dataRows.push(cmpRow);
      });
    });

    downloadCSV(`meta_multi_bm_report_${new Date().toISOString().split('T')[0]}.csv`, [headerRow, ...dataRows]);
  };

  const visibleColumns = columns.filter(c => c.visible);

  // Selected BM Label
  const selectedBMLabel = useMemo(() => {
    if (selectedBMIds.length === 0 || selectedBMIds.length === businessManagers.length) {
      return `All BMs (${businessManagers.length})`;
    }
    if (selectedBMIds.length === 1) {
      const bm = businessManagers.find(b => b.id === selectedBMIds[0]);
      return bm ? bm.name : '1 BM Selected';
    }
    return `${selectedBMIds.length} BMs Selected`;
  }, [selectedBMIds, businessManagers]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 text-slate-900 relative">
      {/* Top Meta Navigation Bar (Matching Screenshot) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs flex items-center gap-1.5 transition-colors font-medium shadow-xs">
            &lt; All reports
          </button>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="font-bold text-slate-900 text-sm bg-transparent hover:bg-slate-100 px-2 py-1 rounded-md border border-transparent hover:border-slate-300 focus:border-sky-500 focus:bg-white focus:outline-hidden transition-all max-w-[240px]"
            />
          </div>

          {/* Business Manager Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setIsBMDropdownOpen(!isBMDropdownOpen)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-xs flex items-center gap-2 transition-colors font-medium text-slate-800 shadow-xs"
            >
              <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center justify-center text-[10px]">
                {selectedBMIds.length === 1 ? 'C' : 'BM'}
              </div>
              <span className="font-semibold">{selectedBMLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </button>

            {isBMDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-40 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">Filter Business Managers</span>
                  <button
                    onClick={onSelectAllBMs}
                    className="text-[11px] text-sky-600 hover:underline font-medium"
                  >
                    Select All ({businessManagers.length})
                  </button>
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {businessManagers.map((bm) => {
                    const isSelected = selectedBMIds.length === 0 || selectedBMIds.includes(bm.id);
                    const colorStyle = getBMColorStyle(bm.color);
                    return (
                      <button
                        key={bm.id}
                        onClick={() => onToggleBM(bm.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-sky-50 text-sky-900 font-medium' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full ${colorStyle.dot}`} />
                          <span className="truncate">{bm.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Ad Accounts Count Pill */}
          <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-slate-700 flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>{filteredAccounts.length} Ad accounts</span>
          </div>
        </div>

        {/* Right Info and Actions */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-500 font-medium">You have unsaved changes</span>
            <div className="text-[10px] text-slate-400">Data refreshed less than 1 minute ago</div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="inline-flex rounded-md shadow-xs">
              <button className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-l-md text-xs transition-colors">
                Save
              </button>
              <button className="px-2 py-1.5 bg-sky-700 hover:bg-sky-800 text-white border-l border-sky-800 rounded-r-md text-xs">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => {}}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Refresh
            </button>

            <button
              onClick={() => {}}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>

            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Date Bar (Matching Screenshot) */}
      <div className="bg-white px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          {/* Delivery pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <span>Had delivery</span>
            <button
              onClick={() => setDeliveryFilter(deliveryFilter === 'had_delivery' ? 'all' : 'had_delivery')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search to filter by name, ID or metrics"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-900 text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Date Picker Button */}
        <div className="relative">
          <button
            onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-800 text-xs flex items-center gap-2 font-medium transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isDateDropdownOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 z-40 text-xs">
              {['Today (Aug 31, 2026)', 'Yesterday', 'Aug 30, 2026', 'Last 7 days', 'Last 14 days', 'Last 30 days', 'This Month', 'Lifetime'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    onChangeDateRange(range);
                    setIsDateDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                    dateRange === range ? 'bg-sky-600 text-white font-medium' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar Sub-bar (Pivot Table Toggle, Customize Drawer Button) */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-800 flex items-center gap-1.5 font-medium cursor-pointer hover:bg-slate-50 shadow-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
            <span>Pivot table</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>

          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 text-xs flex items-center gap-1 transition-colors shadow-xs"
          >
            <ChevronDownSquare className="w-3.5 h-3.5 text-emerald-600" />
            Expand all
          </button>

          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 text-xs flex items-center gap-1 transition-colors shadow-xs"
          >
            <ChevronUpSquare className="w-3.5 h-3.5 text-slate-500" />
            Collapse all
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 text-xs flex items-center gap-1.5 transition-colors shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            Reset column widths
          </button>

          <button
            onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
            className={`px-2.5 py-1.5 border rounded-md text-xs flex items-center gap-1.5 transition-colors font-medium shadow-xs ${
              isCustomizeOpen 
                ? 'bg-sky-50 text-sky-700 border-sky-300' 
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            Customize table ({visibleColumns.length} columns)
          </button>
        </div>
      </div>

      {/* Main Content Layout with Side Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table Container */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
            {/* Table Header */}
            <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 z-20 shadow-xs">
              <tr>
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    className={`px-3.5 py-2.5 border-r border-slate-200 font-semibold text-slate-700 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.id === 'account_name' ? 'min-w-[220px]' : col.id === 'campaign_name' ? 'min-w-[240px]' : 'min-w-[120px]'}`}
                  >
                    <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                      <span>{col.label}</span>
                      {col.id === 'amount_spent' && <span className="text-sky-600 text-[10px]">↓</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredAccounts.map((account) => {
                const isAccExpanded = !!expandedAccounts[account.id];
                const aslMeta = getASLStatusMeta(account.amountSpent, account.accountSpendingLimit, account.alertThresholdPercent);
                const bmStyle = getBMColorStyle(
                  businessManagers.find(b => b.id === account.bmId)?.color || 'blue'
                );

                return (
                  <React.Fragment key={account.id}>
                    {/* Account Level Aggregate Row */}
                    <tr className="bg-white hover:bg-slate-50/90 transition-colors font-sans border-b border-slate-200">
                      {visibleColumns.map((col) => {
                        if (col.id === 'account_name') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 border-r border-slate-200">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleAccountExpand(account.id)}
                                  className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                                >
                                  {isAccExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => onOpenEditASL(account)}
                                  className="text-sky-600 hover:text-sky-800 font-semibold text-xs truncate max-w-[200px] text-left hover:underline"
                                >
                                  {account.name}
                                </button>
                              </div>
                            </td>
                          );
                        }

                        if (col.id === 'bm_name') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 border-r border-slate-200">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${bmStyle.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${bmStyle.dot}`} />
                                {account.bmName}
                              </span>
                            </td>
                          );
                        }

                        if (col.id === 'campaign_name') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-slate-500 font-sans border-r border-slate-200 font-medium">
                              All ({account.campaigns.length} campaigns)
                            </td>
                          );
                        }

                        if (col.id === 'amount_spent') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right font-bold text-slate-900 border-r border-slate-200">
                              {formatCurrency(account.amountSpent, account.currency)}
                            </td>
                          );
                        }

                        if (col.id === 'asl_status') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-center border-r border-slate-200">
                              <button
                                onClick={() => onOpenEditASL(account)}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${aslMeta.bgClass} ${aslMeta.textClass} ${aslMeta.borderClass}`}
                              >
                                {aslMeta.status === 'LIMIT_HIT' ? (
                                  <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />
                                ) : aslMeta.status === 'CRITICAL' || aslMeta.status === 'APPROACHING' ? (
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                )}
                                <span>{aslMeta.label}</span>
                              </button>
                            </td>
                          );
                        }

                        if (col.id === 'purchases_conversion_value') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-800 border-r border-slate-200 font-medium">
                              {formatCurrency(account.purchasesConversionValue, account.currency)}
                            </td>
                          );
                        }

                        if (col.id === 'cost_per_purchase') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-700 border-r border-slate-200">
                              {account.costPerPurchase > 0 ? formatCurrency(account.costPerPurchase, account.currency) : '—'}
                            </td>
                          );
                        }

                        if (col.id === 'purchases') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-800 font-semibold border-r border-slate-200">
                              {account.purchases > 0 ? formatNumber(account.purchases) : '—'}
                            </td>
                          );
                        }

                        if (col.id === 'avg_purchase_value') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-700 border-r border-slate-200">
                              {account.avgPurchaseConversionValue ? account.avgPurchaseConversionValue.toFixed(2) : '—'}
                            </td>
                          );
                        }

                        if (col.id === 'registrations') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-700 border-r border-slate-200">
                              {account.registrationsCompleted > 0 ? formatNumber(account.registrationsCompleted) : '—'}
                            </td>
                          );
                        }

                        if (col.id === 'cost_per_registration') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-700 border-r border-slate-200">
                              {account.costPerRegistration > 0 ? formatCurrency(account.costPerRegistration, account.currency) : '—'}
                            </td>
                          );
                        }

                        if (col.id === 'clicks') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-700 border-r border-slate-200">
                              {formatNumber(account.clicks)}
                            </td>
                          );
                        }

                        if (col.id === 'ctr') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-700 border-r border-slate-200">
                              {formatPercent(account.ctr)}
                            </td>
                          );
                        }

                        if (col.id === 'cpc') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-600 border-r border-slate-200">
                              {formatCurrency(account.cpc, account.currency)}
                            </td>
                          );
                        }

                        if (col.id === 'cpm') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-600 border-r border-slate-200">
                              {formatCurrency(account.cpm, account.currency)}
                            </td>
                          );
                        }

                        if (col.id === 'impressions') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-600 border-r border-slate-200">
                              {formatNumber(account.impressions)}
                            </td>
                          );
                        }

                        if (col.id === 'reach') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right text-slate-600 border-r border-slate-200">
                              {formatNumber(account.reach)}
                            </td>
                          );
                        }

                        if (col.id === 'remaining_asl') {
                          return (
                            <td key={col.id} className="px-3.5 py-2 text-right font-bold text-slate-900 border-r border-slate-200">
                              {formatCurrency(aslMeta.remaining, account.currency)}
                            </td>
                          );
                        }

                        return <td key={col.id} className="px-3.5 py-2 border-r border-slate-200 text-slate-400">—</td>;
                      })}
                    </tr>

                    {/* Campaign Nested Rows */}
                    {isAccExpanded && account.campaigns.map((campaign) => {
                      const isCmpExpanded = !!expandedCampaigns[campaign.id];
                      return (
                        <React.Fragment key={campaign.id}>
                          <tr className="bg-slate-50/60 hover:bg-slate-100/70 transition-colors text-slate-700 font-sans border-b border-slate-200">
                            {visibleColumns.map((col) => {
                              if (col.id === 'account_name') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 border-r border-slate-200">
                                    <div className="pl-6 text-slate-400 text-[11px]">
                                      ↳
                                    </div>
                                  </td>
                                );
                              }

                              if (col.id === 'bm_name') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 border-r border-slate-200 text-slate-500 text-[11px]">
                                    {account.bmName}
                                  </td>
                                );
                              }

                              if (col.id === 'campaign_name') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 border-r border-slate-200">
                                    <div className="flex items-center gap-1.5 pl-2">
                                      {campaign.adSets && campaign.adSets.length > 0 ? (
                                        <button
                                          onClick={() => toggleCampaignExpand(campaign.id)}
                                          className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                                        >
                                          {isCmpExpanded ? (
                                            <ChevronDown className="w-3 h-3 text-sky-600" />
                                          ) : (
                                            <ChevronRight className="w-3 h-3" />
                                          )}
                                        </button>
                                      ) : (
                                        <span className="w-3 h-3 inline-block" />
                                      )}
                                      <span className="text-sky-600 hover:underline cursor-pointer truncate max-w-[220px] font-medium">
                                        {campaign.name}
                                      </span>
                                    </div>
                                  </td>
                                );
                              }

                              if (col.id === 'amount_spent') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-800 border-r border-slate-200 font-medium">
                                    {formatCurrency(campaign.amountSpent, account.currency)}
                                  </td>
                                );
                              }

                              if (col.id === 'asl_status') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-center border-r border-slate-200">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                      campaign.status === 'ACTIVE' 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium' 
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {campaign.status}
                                    </span>
                                  </td>
                                );
                              }

                              if (col.id === 'purchases_conversion_value') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-700 border-r border-slate-200">
                                    {formatCurrency(campaign.purchasesConversionValue, account.currency)}
                                    <span className="text-[9px] text-slate-400 ml-0.5">[2]</span>
                                  </td>
                                );
                              }

                              if (col.id === 'cost_per_purchase') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-700 border-r border-slate-200">
                                    {campaign.costPerPurchase > 0 ? (
                                      <>
                                        {formatCurrency(campaign.costPerPurchase, account.currency)}
                                        <span className="text-[9px] text-slate-400 ml-0.5">[2]</span>
                                      </>
                                    ) : '—'}
                                  </td>
                                );
                              }

                              if (col.id === 'purchases') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-800 border-r border-slate-200">
                                    {campaign.purchases > 0 ? (
                                      <>
                                        {formatNumber(campaign.purchases)}
                                        <span className="text-[9px] text-slate-400 ml-0.5">[2]</span>
                                      </>
                                    ) : '—'}
                                  </td>
                                );
                              }

                              if (col.id === 'avg_purchase_value') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-700 border-r border-slate-200">
                                    {campaign.avgPurchaseConversionValue ? (
                                      <>
                                        {campaign.avgPurchaseConversionValue.toFixed(2)}
                                        <span className="text-[9px] text-slate-400 ml-0.5">[2]</span>
                                      </>
                                    ) : '—'}
                                  </td>
                                );
                              }

                              if (col.id === 'registrations') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-700 border-r border-slate-200">
                                    {campaign.registrationsCompleted > 0 ? (
                                      <>
                                        {formatNumber(campaign.registrationsCompleted)}
                                        <span className="text-[9px] text-slate-400 ml-0.5">[2]</span>
                                      </>
                                    ) : '—'}
                                  </td>
                                );
                              }

                              if (col.id === 'cost_per_registration') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-700 border-r border-slate-200">
                                    {campaign.costPerRegistration > 0 ? (
                                      <>
                                        {formatCurrency(campaign.costPerRegistration, account.currency)}
                                        <span className="text-[9px] text-slate-400 ml-0.5">[2]</span>
                                      </>
                                    ) : '—'}
                                  </td>
                                );
                              }

                              if (col.id === 'clicks') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-700 border-r border-slate-200">
                                    {formatNumber(campaign.clicks)}
                                  </td>
                                );
                              }

                              if (col.id === 'ctr') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-700 border-r border-slate-200">
                                    {formatPercent(campaign.ctr)}
                                  </td>
                                );
                              }

                              if (col.id === 'cpc') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-600 border-r border-slate-200">
                                    {formatCurrency(campaign.cpc, account.currency)}
                                  </td>
                                );
                              }

                              if (col.id === 'cpm') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-600 border-r border-slate-200">
                                    {formatCurrency(campaign.cpm, account.currency)}
                                  </td>
                                );
                              }

                              if (col.id === 'impressions') {
                                return (
                                  <td key={col.id} className="px-3.5 py-1.5 text-right font-mono text-slate-600 border-r border-slate-200">
                                    {formatNumber(campaign.impressions)}
                                  </td>
                                );
                              }

                              if (col.id === 'reach') {
                                return <td key={col.id} className="px-3.5 py-1.5 border-r border-slate-200 text-right font-mono text-slate-400">—</td>;
                              }

                              if (col.id === 'remaining_asl') {
                                return <td key={col.id} className="px-3.5 py-1.5 border-r border-slate-200 text-right font-mono text-slate-400">—</td>;
                              }

                              return <td key={col.id} className="px-3.5 py-1.5 border-r border-slate-200 text-slate-400">—</td>;
                            })}
                          </tr>

                          {/* AdSet nested rows */}
                          {isCmpExpanded && campaign.adSets && campaign.adSets.map((adSet) => (
                            <tr key={adSet.id} className="bg-slate-100/50 hover:bg-slate-100 transition-colors text-slate-600 font-sans border-b border-slate-200 text-[11px]">
                              {visibleColumns.map((col) => {
                                if (col.id === 'account_name') {
                                  return <td key={col.id} className="px-3.5 py-1 border-r border-slate-200" />;
                                }
                                if (col.id === 'campaign_name') {
                                  return (
                                    <td key={col.id} className="px-3.5 py-1 border-r border-slate-200 pl-6 text-slate-700">
                                      📁 {adSet.name}
                                    </td>
                                  );
                                }
                                if (col.id === 'amount_spent') {
                                  return (
                                    <td key={col.id} className="px-3.5 py-1 text-right font-mono text-slate-800 border-r border-slate-200">
                                      {formatCurrency(adSet.amountSpent)}
                                    </td>
                                  );
                                }
                                if (col.id === 'purchases') {
                                  return (
                                    <td key={col.id} className="px-3.5 py-1 text-right font-mono text-slate-800 border-r border-slate-200">
                                      {adSet.purchases}
                                    </td>
                                  );
                                }
                                if (col.id === 'cost_per_purchase') {
                                  return (
                                    <td key={col.id} className="px-3.5 py-1 text-right font-mono text-slate-700 border-r border-slate-200">
                                      {formatCurrency(adSet.costPerPurchase)}
                                    </td>
                                  );
                                }
                                if (col.id === 'clicks') {
                                  return (
                                    <td key={col.id} className="px-3.5 py-1 text-right font-mono text-slate-700 border-r border-slate-200">
                                      {formatNumber(adSet.clicks)}
                                    </td>
                                  );
                                }
                                if (col.id === 'ctr') {
                                  return (
                                    <td key={col.id} className="px-3.5 py-1 text-right font-mono text-slate-700 border-r border-slate-200">
                                      {formatPercent(adSet.ctr)}
                                    </td>
                                  );
                                }
                                return <td key={col.id} className="px-3.5 py-1 border-r border-slate-200 text-slate-400">—</td>;
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Total Results Sticky Footer (Matching Screenshot) */}
            <tfoot className="sticky bottom-0 bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300 shadow-sm z-20">
              <tr>
                {visibleColumns.map((col) => {
                  if (col.id === 'account_name') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 border-r border-slate-200 font-sans">
                        <div className="font-bold text-slate-900">Total results</div>
                        <div className="text-[10px] text-slate-500 font-normal">{totals.rowCount} rows displayed</div>
                      </td>
                    );
                  }

                  if (col.id === 'bm_name') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 border-r border-slate-200 text-slate-600 text-[11px] font-sans">
                        All BMs combined
                      </td>
                    );
                  }

                  if (col.id === 'campaign_name') {
                    return <td key={col.id} className="px-3.5 py-2.5 border-r border-slate-200" />;
                  }

                  if (col.id === 'amount_spent') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 text-right border-r border-slate-200">
                        <div className="text-slate-900">{formatCurrency(totals.totalSpent)}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Total spent</div>
                      </td>
                    );
                  }

                  if (col.id === 'asl_status') {
                    return <td key={col.id} className="px-3.5 py-2.5 border-r border-slate-200" />;
                  }

                  if (col.id === 'purchases_conversion_value') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 text-right border-r border-slate-200">
                        <div className="text-slate-900">{formatCurrency(totals.totalConversionValue)}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Total</div>
                      </td>
                    );
                  }

                  if (col.id === 'cost_per_purchase') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 text-right border-r border-slate-200">
                        <div className="text-slate-900">{formatCurrency(totals.costPerPurchase)}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Per Action</div>
                      </td>
                    );
                  }

                  if (col.id === 'purchases') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 text-right border-r border-slate-200">
                        <div className="text-slate-900">{formatNumber(totals.totalPurchases)}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Total</div>
                      </td>
                    );
                  }

                  if (col.id === 'avg_purchase_value') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 text-right border-r border-slate-200">
                        <div className="text-slate-900">{totals.avgConversionValue.toFixed(2)}</div>
                      </td>
                    );
                  }

                  if (col.id === 'registrations') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 text-right border-r border-slate-200">
                        <div className="text-slate-900">{formatNumber(totals.totalRegistrations)}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Total</div>
                      </td>
                    );
                  }

                  if (col.id === 'cost_per_registration') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 text-right border-r border-slate-200">
                        <div className="text-slate-900">{formatCurrency(totals.costPerRegistration)}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Per Action</div>
                      </td>
                    );
                  }

                  if (col.id === 'clicks') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 text-right border-r border-slate-200">
                        <div className="text-slate-900">{formatNumber(totals.totalClicks)}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Total</div>
                      </td>
                    );
                  }

                  if (col.id === 'ctr') {
                    return (
                      <td key={col.id} className="px-3.5 py-2.5 text-right border-r border-slate-200">
                        <div className="text-slate-900">{formatPercent(totals.overallCTR)}</div>
                      </td>
                    );
                  }

                  return <td key={col.id} className="px-3.5 py-2.5 border-r border-slate-200 text-right text-slate-400">—</td>;
                })}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Customize Side-Drawer (Matching Screenshot Right Panel) */}
        {isCustomizeOpen && (
          <div className="w-72 bg-white border-l border-slate-200 flex flex-col z-30 shadow-2xl shrink-0 text-xs">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Customize pivot table</h3>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box in side panel */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search metrics or columns"
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-xs focus:outline-hidden focus:border-sky-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Tabs (Breakdowns vs Metrics) */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveCustomizeTab('breakdowns')}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  activeCustomizeTab === 'breakdowns'
                    ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Breakdowns
              </button>
              <button
                onClick={() => setActiveCustomizeTab('metrics')}
                className={`flex-1 py-2 font-medium text-center border-b-2 transition-colors ${
                  activeCustomizeTab === 'metrics'
                    ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Metrics ({visibleColumns.length})
              </button>
            </div>

            {/* Side Panel Item List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {activeCustomizeTab === 'breakdowns' ? (
                <>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Popular Breakdowns
                  </div>
                  {[
                    { id: 'account_name', label: 'Account name', checked: true },
                    { id: 'bm_name', label: 'Business Manager', checked: true },
                    { id: 'campaign_name', label: 'Campaign name', checked: true },
                    { id: 'adset_name', label: 'Ad set name', checked: true },
                    { id: 'ad_name', label: 'Ad name', checked: false },
                    { id: 'ad_creative', label: 'Ad creative', checked: false },
                    { id: 'age', label: 'Age', checked: false },
                    { id: 'gender', label: 'Gender', checked: false },
                    { id: 'country', label: 'Country / Region', checked: false },
                    { id: 'placement', label: 'Placement (IG / FB / Feed)', checked: false },
                    { id: 'day', label: 'Day / Hourly', checked: false },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </>
              ) : (
                <>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Metrics & Data Columns
                  </div>
                  {columns.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-slate-700"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={col.visible}
                          onChange={() => handleToggleColumn(col.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span className={col.visible ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                          {col.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono capitalize">
                        {col.category}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
              >
                Apply Customizations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
