import React from 'react';
import { ViewTab, ASLAlert } from '../types';
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
  Activity
} from 'lucide-react';

interface HeaderProps {
  activeTab: ViewTab;
  onChangeTab: (tab: ViewTab) => void;
  alerts: ASLAlert[];
  onOpenNotifications: () => void;
  onOpenCopilot: () => void;
  onOpenBMManager: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  simulationSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  totalBMs: number;
  totalAccounts: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onChangeTab,
  alerts,
  onOpenNotifications,
  onOpenCopilot,
  onOpenBMManager,
  isSimulating,
  onToggleSimulation,
  simulationSpeed,
  onChangeSimSpeed,
  soundEnabled,
  onToggleSound,
  totalBMs,
  totalAccounts,
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

        {/* Live Simulation Engine Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Live Simulator Pill */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button
              onClick={onToggleSimulation}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isSimulating 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title="Toggle live spend simulation to test notifications"
            >
              {isSimulating ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Live Spend Ticker Active</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Start Spend Ticker</span>
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
                <option value={5}>5x speed</option>
                <option value={10}>10x speed</option>
              </select>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-colors ${
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
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
            title="ASL Velocity & Pacing Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Pacing Copilot</span>
          </button>

          {/* Alert Bell Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 transition-colors shadow-xs"
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
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="px-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/70 overflow-x-auto text-xs">
        <nav className="flex space-x-1 sm:space-x-4 py-1.5">
          <button
            onClick={() => onChangeTab('unified_reporting')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'unified_reporting'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <span>Unified Meta Reporting (Pivot View)</span>
          </button>

          <button
            onClick={() => onChangeTab('spending_limits')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'spending_limits'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Account Spending Limits (ASL Tracker)</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {criticalCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenBMManager}
            className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Business Managers ({totalBMs})</span>
          </button>
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
