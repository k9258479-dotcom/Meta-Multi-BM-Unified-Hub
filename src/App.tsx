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
import { BMPerformanceCompare } from './components/BMPerformanceCompare';
import { NotificationDrawer } from './components/NotificationDrawer';
import { EditASLModal } from './components/EditASLModal';
import { BMManagerModal } from './components/BMManagerModal';
import { AddAdAccountModal } from './components/AddAdAccountModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { AuthScreen } from './components/AuthScreen';
import { UserManagementView } from './components/UserManagementView';
import { 
  StoredUserAccount, 
  subscribeUserBusinessManagers, 
  subscribeUserAdAccounts, 
  subscribeUserAlerts,
  saveUserBusinessManager,
  deleteUserBusinessManager,
  saveUserAdAccount,
  updateUserAdAccountASL,
  deleteUserAdAccount,
  saveUserAlert,
  markUserAlertRead,
  clearAllUserAlerts,
  initializeMasterAdminIfNeeded
} from './services/firestoreService';
import { AlertTriangle, AlertOctagon, X, RotateCcw } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<StoredUserAccount | null>(() => {
    const saved = localStorage.getItem('meta_hub_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // User-scoped data state
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>([]);
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [alerts, setAlerts] = useState<ASLAlert[]>([]);
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
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [selectedEditAccount, setSelectedEditAccount] = useState<AdAccount | null>(null);

  // Settings & Simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [telegramWebhook, setTelegramWebhook] = useState(() => {
    return localStorage.getItem('meta_hub_webhook') || '';
  });
  const [activeToast, setActiveToast] = useState<{ id: string; message: string; type: 'warning' | 'danger' | 'info'; accountId?: string } | null>(null);

  // Ensure default master admin exists in Firestore on boot
  useEffect(() => {
    initializeMasterAdminIfNeeded();
  }, []);

  // Save current user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('meta_hub_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('meta_hub_current_user');
    }
  }, [currentUser]);

  // Subscribe to real-time user-scoped Firestore data
  useEffect(() => {
    if (!currentUser) return;

    const unsubBMs = subscribeUserBusinessManagers(currentUser.userId, (bms) => {
      setBusinessManagers(bms);
    });

    const unsubAccounts = subscribeUserAdAccounts(currentUser.userId, (accs) => {
      setAccounts(accs);
    });

    const unsubAlerts = subscribeUserAlerts(currentUser.userId, (alrts) => {
      setAlerts(alrts);
    });

    return () => {
      unsubBMs();
      unsubAccounts();
      unsubAlerts();
    };
  }, [currentUser?.userId]);

  // Save column preferences
  useEffect(() => {
    localStorage.setItem('meta_hub_columns', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem('meta_hub_webhook', telegramWebhook);
  }, [telegramWebhook]);

  // Live Spend Simulator & ASL Trigger Engine (user-scoped)
  const lastAlertedThresholdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!isSimulating || !currentUser || accounts.length === 0) return;

    const intervalTime = Math.max(1000, 3000 / simulationSpeed);

    const interval = setInterval(() => {
      setAccounts((prevAccounts) => {
        return prevAccounts.map((acc) => {
          if (acc.status === 'LIMIT_REACHED' || acc.status === 'DISABLED' || acc.accountSpendingLimit <= 0) {
            return acc;
          }

          const spendDelta = +(Math.random() * (2.4 * simulationSpeed) + 0.5).toFixed(2);
          const newSpent = +(acc.amountSpent + spendDelta).toFixed(2);
          const newToday = +(acc.todaySpend + spendDelta).toFixed(2);
          const newBill = +(acc.currentBillingBill + spendDelta).toFixed(2);
          const percentUsed = (newSpent / acc.accountSpendingLimit) * 100;

          let newStatus = acc.status;

          if (newSpent >= acc.accountSpendingLimit) {
            newStatus = 'LIMIT_REACHED';

            const alertKey = `${acc.id}_100`;
            if (!lastAlertedThresholdRef.current[alertKey]) {
              lastAlertedThresholdRef.current[alertKey] = Date.now();
              const newAlert: ASLAlert = {
                id: `alert_${Date.now()}`,
                userId: currentUser.userId,
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

              saveUserAlert(currentUser.userId, newAlert);
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
                userId: currentUser.userId,
                accountId: acc.id,
                accountName: acc.name,
                bmId: acc.bmId,
                bmName: acc.bmName,
                timestamp: 'Just now',
                type: 'APPROACHING_LIMIT',
                severity: 'warning',
                percentUsed: Math.round(percentUsed),
                currentSpent: newSpent,
                spendingLimit: acc.accountSpendingLimit,
                message: `WARNING: ${acc.name} is at ${Math.round(percentUsed)}% of its Spending Limit (${formatCurrency(newSpent)} / ${formatCurrency(acc.accountSpendingLimit)}).`,
                read: false,
              };

              saveUserAlert(currentUser.userId, newAlert);
              if (soundEnabled) soundManager.playWarningBeep();
            }
          }

          // Persist update in memory
          return {
            ...acc,
            amountSpent: newSpent,
            todaySpend: newToday,
            currentBillingBill: newBill,
            status: newStatus,
          };
        });
      }, intervalTime);
    });

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, soundEnabled, currentUser, accounts.length]);

  // Auth Handlers
  const handleLoginSuccess = (user: StoredUserAccount) => {
    setCurrentUser(user);
    setActiveTab('unified_reporting');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setBusinessManagers([]);
    setAccounts([]);
    setAlerts([]);
    localStorage.removeItem('meta_hub_current_user');
  };

  // Seed sample starter data into current user's workspace
  const handleLoadStarterTemplate = async () => {
    if (!currentUser) return;
    if (businessManagers.length > 0 || accounts.length > 0) {
      if (!confirm('Load starter template? This will add demo Business Managers and Ad Accounts to your account.')) {
        return;
      }
    }

    try {
      for (const bm of INITIAL_BUSINESS_MANAGERS) {
        await saveUserBusinessManager(currentUser.userId, { ...bm, userId: currentUser.userId });
      }
      for (const acc of INITIAL_AD_ACCOUNTS) {
        await saveUserAdAccount(currentUser.userId, { ...acc, userId: currentUser.userId });
      }
      for (const alert of INITIAL_ALERTS) {
        await saveUserAlert(currentUser.userId, { ...alert, userId: currentUser.userId });
      }
      setActiveToast({
        id: `toast_${Date.now()}`,
        message: '✅ Starter template loaded into your user workspace!',
        type: 'info',
      });
    } catch (err: any) {
      alert('Failed to load starter template: ' + err.message);
    }
  };

  // Handler: Add BM
  const handleAddBM = async (newBM: Omit<BusinessManager, 'id'>) => {
    if (!currentUser) return;
    const docId = `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullBM: BusinessManager = {
      ...newBM,
      id: docId,
      userId: currentUser.userId,
    };
    await saveUserBusinessManager(currentUser.userId, fullBM);
  };

  // Handler: Delete BM
  const handleDeleteBM = async (bmId: string) => {
    if (!currentUser) return;
    await deleteUserBusinessManager(currentUser.userId, bmId);
  };

  // Handler: Add Account
  const handleAddAccount = async (newAcc: Omit<AdAccount, 'id' | 'campaigns'>) => {
    if (!currentUser) return;
    const docId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullAccount: AdAccount = {
      ...newAcc,
      id: docId,
      userId: currentUser.userId,
      campaigns: [],
    };
    await saveUserAdAccount(currentUser.userId, fullAccount);
  };

  // Handler: Save ASL Changes
  const handleSaveASL = async (accountId: string, updates: Partial<AdAccount>) => {
    if (!currentUser) return;
    await updateUserAdAccountASL(currentUser.userId, accountId, updates);
    setSelectedEditAccount(null);
  };

  // Handler: Reset Account Spend to $0 (Meta ASL Reset action)
  const handleResetSpend = async (accountId: string) => {
    if (!currentUser) return;
    await updateUserAdAccountASL(currentUser.userId, accountId, {
      amountSpent: 0,
      todaySpend: 0,
      currentBillingBill: 0,
      status: 'ACTIVE',
    });

    if (soundEnabled) soundManager.playSuccessChime();

    setActiveToast({
      id: `toast_${Date.now()}`,
      message: '✅ ASL Reset successful. Delivery resumed at $0.00 spend.',
      type: 'info',
    });
  };

  // Handler: Quick add to ASL limit
  const handleQuickAddASL = async (accountId: string, amountToAdd: number) => {
    if (!currentUser) return;
    const target = accounts.find(a => a.id === accountId);
    if (!target) return;
    const newLimit = target.accountSpendingLimit + amountToAdd;
    await updateUserAdAccountASL(currentUser.userId, accountId, {
      accountSpendingLimit: newLimit,
      status: target.amountSpent >= newLimit ? 'LIMIT_REACHED' : 'ACTIVE',
    });
  };

  // Handler: Toggle BM Selection
  const handleToggleBM = (bmId: string) => {
    setSelectedBMIds(prev => 
      prev.includes(bmId) ? prev.filter(id => id !== bmId) : [...prev, bmId]
    );
  };

  const handleSelectAllBMs = () => {
    if (selectedBMIds.length === businessManagers.length) {
      setSelectedBMIds([]);
    } else {
      setSelectedBMIds(businessManagers.map(b => b.id));
    }
  };

  // Webhook Tester
  const handleTestWebhook = () => {
    if (!telegramWebhook.trim()) {
      alert('Please enter a valid webhook URL first.');
      return;
    }
    setActiveToast({
      id: `toast_${Date.now()}`,
      message: '🔔 Test alert payload dispatched to Webhook successfully.',
      type: 'info'
    });
  };

  // If user is not authenticated, display login screen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

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
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors shadow-xs cursor-pointer"
              >
                Reset ASL
              </button>
            )}
            <button
              onClick={() => setActiveToast(null)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
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
        onOpenAddAccount={() => setIsAddAccountOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        simulationSpeed={simulationSpeed}
        onChangeSimSpeed={setSimulationSpeed}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        totalBMs={businessManagers.length}
        totalAccounts={accounts.length}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main App Body */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'user_management' && currentUser.role === 'admin' ? (
          <UserManagementView currentUser={currentUser} />
        ) : activeTab === 'unified_reporting' ? (
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
            onOpenBMManager={() => setIsBMManagerOpen(true)}
            onOpenAddAccount={() => setIsAddAccountOpen(true)}
            onLoadDemoTemplate={handleLoadStarterTemplate}
          />
        ) : activeTab === 'bm_compare' ? (
          <BMPerformanceCompare
            accounts={accounts}
            businessManagers={businessManagers}
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
        onMarkAllRead={async () => {
          for (const a of alerts) {
            await markUserAlertRead(currentUser.userId, a.id);
          }
        }}
        onClearAlerts={async () => {
          await clearAllUserAlerts(currentUser.userId);
        }}
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

      {/* Add Ad Account Modal */}
      <AddAdAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        businessManagers={businessManagers}
        onSaveAccount={async (acc) => {
          await saveUserAdAccount(currentUser.userId, acc);
        }}
        onOpenAddBM={() => {
          setIsAddAccountOpen(false);
          setIsBMManagerOpen(true);
        }}
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
