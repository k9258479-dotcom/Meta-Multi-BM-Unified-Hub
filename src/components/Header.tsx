import React from 'react';
import { ViewTab, ASLAlert } from '../types';
import { StoredUserAccount } from '../services/firestoreService';
import { 
  BarChart3, 
  ShieldAlert, 
  Building2, 
  Bell, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Sparkles, 
  Layers, 
  Activity, 
  Target, 
  Users, 
  LogOut, 
  PlusCircle, 
  Shield, 
  User 
} from 'lucide-react';

interface HeaderProps {
  activeTab: ViewTab;
  onChangeTab: (tab: ViewTab) => void;
  alerts: ASLAlert[];
  onOpenNotifications: () => void;
  onOpenCopilot: () => void;
  onOpenBMManager: () => void;
  onOpenAddAccount: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  simulationSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  totalBMs: number;
  totalAccounts: number;
  currentUser: StoredUserAccount;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onChangeTab,
  alerts,
  onOpenNotifications,
  onOpenCopilot,
  onOpenBMManager,
  onOpenAddAccount,
  isSimulating,
  onToggleSimulation,
  simulationSpeed,
  onChangeSimSpeed,
  soundEnabled,
  onToggleSound,
  totalBMs,
  totalAccounts,
  currentUser,
  onLogout,
}) => {
  const unreadAlertsCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'danger').length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Branding & Status Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-xs">
            <span className="text-sm tracking-tighter">∞</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-sm md:text-base tracking-tight">
                Meta Multi-BM Unified Hub
              </h1>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                LIVE SYNC
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Cross-BM Reporting & Real-Time Account Spending Limit (ASL) Guard
            </p>
          </div>
        </div>

        {/* Live Simulation Engine Controls & User Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Quick Add Ad Account Button */}
          <button
            onClick={onOpenAddAccount}
            className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
            title="Add New Ad Account"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">+ Ad Account</span>
          </button>

          {/* Live Simulator Pill */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button
              onClick={onToggleSimulation}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSimulating 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title="Toggle live spend simulation to test notifications"
            >
              {isSimulating ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Spend Ticker Active</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Spend Ticker</span>
                </>
              )}
            </button>

            {isSimulating && (
              <select
                value={simulationSpeed}
                onChange={(e) => onChangeSimSpeed(Number(e.target.value))}
                className="bg-white text-slate-700 text-[11px] font-mono px-1.5 py-1 rounded ml-1 border border-slate-200 focus:outline-hidden"
              >
                <option value={1}>1x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
              </select>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Mute Alert Chimes' : 'Enable Alert Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* AI Copilot Button */}
          <button
            onClick={onOpenCopilot}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            title="ASL Velocity & Pacing Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Pacing Copilot</span>
          </button>

          {/* Alert Bell Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 transition-colors shadow-xs cursor-pointer"
            title="View Real-Time ASL Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${
                criticalCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
              }`}>
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 ml-1">
            <div className="flex items-center gap-1.5 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentUser.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'
              }`}>
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden xl:block text-left leading-tight">
                <span className="text-[11px] font-bold text-slate-800 block truncate max-w-[90px]">
                  {currentUser.displayName || currentUser.username}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block uppercase">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="px-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/70 overflow-x-auto text-xs">
        <nav className="flex space-x-1 sm:space-x-3 py-1.5">
          <button
            onClick={() => onChangeTab('unified_reporting')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'unified_reporting'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <span>Unified Meta Reporting</span>
          </button>

          <button
            onClick={() => onChangeTab('bm_compare')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'bm_compare'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4 text-indigo-600" />
            <span>Cross-BM Benchmark</span>
          </button>

          <button
            onClick={() => onChangeTab('spending_limits')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'spending_limits'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Account Spending Limits (ASL)</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {criticalCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenBMManager}
            className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Business Managers ({totalBMs})</span>
          </button>

          {/* Admin User Management Tab (for Admin role) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => onChangeTab('user_management')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'user_management'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                  : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/60'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>User Management (Admin)</span>
            </button>
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500 font-mono">
          <span>{totalBMs} BMs Linked</span>
          <span>•</span>
          <span>{totalAccounts} Ad Accounts Aggregated</span>
        </div>
      </div>
    </header>
  );
};
