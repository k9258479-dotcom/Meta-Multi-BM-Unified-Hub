import React, { useState, useEffect, useRef } from 'react';
import { 
  BusinessManager, 
  AdAccount, 
  ASLAlert, 
  ColumnConfig, 
  ViewTab 
} from './types';
import { 
  INITIAL_BUSINESS_MANAGERS, 
  INITIAL_AD_ACCOUNTS, 
  INITIAL_ALERTS, 
  DEFAULT_COLUMNS 
} from './data/mockData';
import { getASLStatusMeta, formatCurrency } from './utils/formatters';
import { soundManager } from './utils/audio';
import { Header } from './components/Header';
import { UnifiedReportTable } from './components/UnifiedReportTable';
import { SpendingLimitsPage } from './components/SpendingLimitsPage';
import { NotificationDrawer } from './components/NotificationDrawer';
import { EditASLModal } from './components/EditASLModal';
import { BMManagerModal } from './components/BMManagerModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { AlertTriangle, AlertOctagon, X, RotateCcw } from 'lucide-react';

export default function App() {
  // Persistence state initialization
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>(() => {
    const saved = localStorage.getItem('meta_hub_bms');
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_MANAGERS;
  });

  const [accounts, setAccounts] = useState<AdAccount[]>(() => {
    const saved = localStorage.getItem('meta_hub_accounts');
    return saved ? JSON.parse(saved) : INITIAL_AD_ACCOUNTS;
  });

  const [alerts, setAlerts] = useState<ASLAlert[]>(() => {
    const saved = localStorage.getItem('meta_hub_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem('meta_hub_columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<ViewTab>('unified_reporting');
  const [selectedBMIds, setSelectedBMIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('Aug 30, 2026');
  
  // Modals & Drawers
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isBMManagerOpen, setIsBMManagerOpen] = useState(false);
  const [selectedEditAccount, setSelectedEditAccount] = useState<AdAccount | null>(null);

  // Settings & Simulation
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [telegramWebhook, setTelegramWebhook] = useState(() => {
    return localStorage.getItem('meta_hub_webhook') || '';
  });
  const [activeToast, setActiveToast] = useState<{ id: string; message: string; type: 'warning' | 'danger' | 'info'; accountId?: string } | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('meta_hub_bms', JSON.stringify(businessManagers));
  }, [businessManagers]);

  useEffect(() => {
    localStorage.setItem('meta_hub_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('meta_hub_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('meta_hub_columns', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem('meta_hub_webhook', telegramWebhook);
  }, [telegramWebhook]);

  // Live Spend Simulator & ASL Trigger Engine
  const lastAlertedThresholdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!isSimulating) return;

    const intervalTime = Math.max(1000, 3000 / simulationSpeed);

    const interval = setInterval(() => {
      setAccounts((prevAccounts) => {
        return prevAccounts.map((acc) => {
          // If already limit reached or disabled, don't tick spend
          if (acc.status === 'LIMIT_REACHED' || acc.status === 'DISABLED' || acc.accountSpendingLimit <= 0) {
            return acc;
          }

          // Generate slight realistic incremental spend
          const spendDelta = +(Math.random() * (2.4 * simulationSpeed) + 0.5).toFixed(2);
          const newSpent = +(acc.amountSpent + spendDelta).toFixed(2);
          const newToday = +(acc.todaySpend + spendDelta).toFixed(2);
          const newBill = +(acc.currentBillingBill + spendDelta).toFixed(2);
          const percentUsed = (newSpent / acc.accountSpendingLimit) * 100;

          let newStatus = acc.status;

          // Check if limit hit
          if (newSpent >= acc.accountSpendingLimit) {
            newStatus = 'LIMIT_REACHED';

            // Trigger alert if not alerted recently
            const alertKey = `${acc.id}_100`;
            if (!lastAlertedThresholdRef.current[alertKey]) {
              lastAlertedThresholdRef.current[alertKey] = Date.now();
              const newAlert: ASLAlert = {
                id: `alert_${Date.now()}`,
                accountId: acc.id,
                accountName: acc.name,
                bmId: acc.bmId,
                bmName: acc.bmName,
                timestamp: 'Just now',
                type: 'LIMIT_REACHED',
                severity: 'danger',
                percentUsed: 100,
                currentSpent: newSpent,
                spendingLimit: acc.accountSpendingLimit,
                message: `CRITICAL: ${acc.name} (BM: ${acc.bmName}) hit 100% Account Spending Limit (${formatCurrency(newSpent)} / ${formatCurrency(acc.accountSpendingLimit)}). Ads delivery halted.`,
                read: false,
              };

              setAlerts(prev => [newAlert, ...prev]);
              if (soundEnabled) soundManager.playCriticalAlarm();
              setActiveToast({
                id: `toast_${Date.now()}`,
                message: `🛑 ${acc.name} reached 100% Account Spending Limit! Ads paused.`,
                type: 'danger',
                accountId: acc.id,
              });
            }
          } else if (percentUsed >= acc.alertThresholdPercent) {
            newStatus = 'APPROACHING_LIMIT';

            const alertKey = `${acc.id}_${Math.floor(percentUsed)}`;
            if (!lastAlertedThresholdRef.current[alertKey]) {
              lastAlertedThresholdRef.current[alertKey] = Date.now();
              const newAlert: ASLAlert = {
                id: `alert_${Date.now()}`,
                accountId: acc.id,
                accountName: acc.name,
                bmId: acc.bmId,
                bmName: acc.bmName,
                timestamp: 'Just now',
                type: 'APPROACHING_LIMIT',
                severity: percentUsed >= 95 ? 'critical' : 'warning',
                percentUsed: +percentUsed.toFixed(1),
                currentSpent: newSpent,
                spendingLimit: acc.accountSpendingLimit,
                message: `WARNING: ${acc.name} is at ${percentUsed.toFixed(1)}% of ASL (${formatCurrency(newSpent)} / ${formatCurrency(acc.accountSpendingLimit)}). ${formatCurrency(acc.accountSpendingLimit - newSpent)} remaining.`,
                read: false,
              };

              setAlerts(prev => [newAlert, ...prev]);
              if (soundEnabled) soundManager.playWarningBeep();
              setActiveToast({
                id: `toast_${Date.now()}`,
                message: `⚠️ ${acc.name} (BM: ${acc.bmName}) is at ${percentUsed.toFixed(1)}% of spending limit!`,
                type: 'warning',
                accountId: acc.id,
              });
            }
          }

          // Random incremental conversions & clicks
          const gotPurchase = Math.random() < 0.25;
          const purchaseValDelta = gotPurchase ? +(Math.random() * 45 + 15).toFixed(2) : 0;

          return {
            ...acc,
            amountSpent: newSpent,
            todaySpend: newToday,
            currentBillingBill: newBill,
            status: newStatus,
            purchases: acc.purchases + (gotPurchase ? 1 : 0),
            purchasesConversionValue: +(acc.purchasesConversionValue + purchaseValDelta).toFixed(2),
            clicks: acc.clicks + Math.floor(Math.random() * 3 + 1),
            impressions: acc.impressions + Math.floor(Math.random() * 60 + 20),
          };
        });
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, soundEnabled]);

  // Handler: Toggle single BM filter
  const handleToggleBM = (bmId: string) => {
    setSelectedBMIds((prev) => {
      if (prev.includes(bmId)) {
        return prev.filter(id => id !== bmId);
      } else {
        return [...prev, bmId];
      }
    });
  };

  // Handler: Select All BMs
  const handleSelectAllBMs = () => {
    setSelectedBMIds([]);
  };

  // Handler: Reset Spend Amount for an account
  const handleResetSpend = (accountId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          amountSpent: 0.00,
          currentBillingBill: 0.00,
          status: 'ACTIVE',
          lastResetDate: new Date().toISOString(),
        };
      }
      return acc;
    }));

    // Add info alert
    const target = accounts.find(a => a.id === accountId);
    if (target) {
      const resetAlert: ASLAlert = {
        id: `alert_${Date.now()}`,
        accountId: target.id,
        accountName: target.name,
        bmId: target.bmId,
        bmName: target.bmName,
        timestamp: 'Just now',
        type: 'APPROACHING_LIMIT',
        severity: 'info',
        percentUsed: 0,
        currentSpent: 0,
        spendingLimit: target.accountSpendingLimit,
        message: `SUCCESS: Spent counter for ${target.name} was successfully reset to $0.00. Account is active.`,
        read: false,
      };
      setAlerts(prev => [resetAlert, ...prev]);
    }

    if (soundEnabled) soundManager.playSuccessChime();
    setActiveToast({
      id: `toast_${Date.now()}`,
      message: `✅ Spent counter reset to $0.00 for account.`,
      type: 'info'
    });
  };

  // Handler: Quick add ASL
  const handleQuickAddASL = (accountId: string, amount: number) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        const newLimit = acc.accountSpendingLimit + amount;
        return {
          ...acc,
          accountSpendingLimit: newLimit,
          status: acc.amountSpent < newLimit ? 'ACTIVE' : acc.status,
        };
      }
      return acc;
    }));

    if (soundEnabled) soundManager.playSuccessChime();
  };

  // Handler: Save ASL & DSL & Threshold
  const handleSaveASL = (accountId: string, newASL: number, newDSL: number, alertThreshold: number) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        const isLimitMet = newASL > 0 && acc.amountSpent >= newASL;
        return {
          ...acc,
          accountSpendingLimit: newASL,
          dailySpendLimit: newDSL,
          alertThresholdPercent: alertThreshold,
          status: isLimitMet ? 'LIMIT_REACHED' : acc.status === 'LIMIT_REACHED' ? 'ACTIVE' : acc.status,
        };
      }
      return acc;
    }));

    if (soundEnabled) soundManager.playSuccessChime();
  };

  // Handler: Add New BM
  const handleAddBM = (newBM: Omit<BusinessManager, 'id'>) => {
    const id = `bm_${Date.now()}`;
    const fullBM: BusinessManager = { ...newBM, id };
    setBusinessManagers(prev => [...prev, fullBM]);
    if (soundEnabled) soundManager.playSuccessChime();
  };

  // Handler: Delete BM
  const handleDeleteBM = (bmId: string) => {
    setBusinessManagers(prev => prev.filter(b => b.id !== bmId));
    setAccounts(prev => prev.filter(a => a.bmId !== bmId));
  };

  // Handler: Add New Account
  const handleAddAccount = (newAcc: Omit<AdAccount, 'id' | 'campaigns'>) => {
    const id = `act_${Date.now()}`;
    const fullAcc: AdAccount = {
      ...newAcc,
      id,
      campaigns: [
        {
          id: `cmp_${Date.now()}_1`,
          accountId: id,
          name: `${newAcc.name} - Campaign Winner #1`,
          status: 'ACTIVE',
          amountSpent: newAcc.amountSpent,
          purchasesConversionValue: 0,
          costPerPurchase: 0,
          purchases: 0,
          avgPurchaseConversionValue: 0,
          registrationsCompleted: 0,
          costPerRegistration: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          impressions: 0,
        }
      ]
    };
    setAccounts(prev => [...prev, fullAcc]);
    if (soundEnabled) soundManager.playSuccessChime();
  };

  // Handler: Test Webhook
  const handleTestWebhook = () => {
    if (soundEnabled) soundManager.playSuccessChime();
    setActiveToast({
      id: `toast_${Date.now()}`,
      message: `🚀 Test alert payload successfully dispatched to webhook / Telegram endpoint!`,
      type: 'info'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Alert Notification Banner */}
      {activeToast && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border flex items-center justify-between gap-3 text-xs max-w-md animate-in slide-in-from-bottom-5 ${
          activeToast.type === 'danger'
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : activeToast.type === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-sky-50 border-sky-300 text-sky-900'
        }`}>
          <div className="flex items-center gap-2">
            {activeToast.type === 'danger' ? (
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span className="font-semibold">{activeToast.message}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {activeToast.accountId && (
              <button
                onClick={() => {
                  handleResetSpend(activeToast.accountId!);
                  setActiveToast(null);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors shadow-xs"
              >
                Reset ASL
              </button>
            )}
            <button
              onClick={() => setActiveToast(null)}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header Navigation */}
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        alerts={alerts}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenBMManager={() => setIsBMManagerOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        simulationSpeed={simulationSpeed}
        onChangeSimSpeed={setSimulationSpeed}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        totalBMs={businessManagers.length}
        totalAccounts={accounts.length}
      />

      {/* Main App Body */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'unified_reporting' ? (
          <UnifiedReportTable
            accounts={accounts}
            businessManagers={businessManagers}
            columns={columns}
            onUpdateColumns={setColumns}
            selectedBMIds={selectedBMIds}
            onToggleBM={handleToggleBM}
            onSelectAllBMs={handleSelectAllBMs}
            dateRange={dateRange}
            onChangeDateRange={setDateRange}
            onOpenEditASL={(acc) => setSelectedEditAccount(acc)}
            onResetSpend={handleResetSpend}
          />
        ) : (
          <SpendingLimitsPage
            accounts={accounts}
            businessManagers={businessManagers}
            onOpenEditASL={(acc) => setSelectedEditAccount(acc)}
            onResetSpend={handleResetSpend}
            onQuickAddASL={handleQuickAddASL}
            onOpenBMManager={() => setIsBMManagerOpen(true)}
          />
        )}
      </main>

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        alerts={alerts}
        accounts={accounts}
        onMarkAllRead={() => setAlerts(prev => prev.map(a => ({ ...a, read: true })))}
        onClearAlerts={() => setAlerts([])}
        onResetSpend={handleResetSpend}
        onOpenEditASL={(acc) => {
          setSelectedEditAccount(acc);
          setIsNotificationOpen(false);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        telegramWebhook={telegramWebhook}
        onUpdateTelegramWebhook={setTelegramWebhook}
        onTestWebhook={handleTestWebhook}
      />

      {/* Edit ASL & Reset Spend Modal */}
      <EditASLModal
        isOpen={!!selectedEditAccount}
        onClose={() => setSelectedEditAccount(null)}
        account={selectedEditAccount}
        onSave={handleSaveASL}
        onResetSpend={handleResetSpend}
      />

      {/* Multi-BM Manager Modal */}
      <BMManagerModal
        isOpen={isBMManagerOpen}
        onClose={() => setIsBMManagerOpen(false)}
        businessManagers={businessManagers}
        accounts={accounts}
        onAddBM={handleAddBM}
        onDeleteBM={handleDeleteBM}
        onAddAccount={handleAddAccount}
      />

      {/* AI Burn Rate Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        accounts={accounts}
        businessManagers={businessManagers}
        onOpenEditASL={(acc) => {
          setSelectedEditAccount(acc);
          setIsCopilotOpen(false);
        }}
        onResetSpend={handleResetSpend}
      />
    </div>
  );
}
