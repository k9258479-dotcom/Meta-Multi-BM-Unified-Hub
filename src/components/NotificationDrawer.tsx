import React from 'react';
import { ASLAlert, AdAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  X, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  RotateCcw, 
  Sliders,
  Send
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: ASLAlert[];
  accounts: AdAccount[];
  onMarkAllRead: () => void;
  onClearAlerts: () => void;
  onResetSpend: (accountId: string) => void;
  onOpenEditASL: (account: AdAccount) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  telegramWebhook: string;
  onUpdateTelegramWebhook: (url: string) => void;
  onTestWebhook: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  accounts,
  onMarkAllRead,
  onClearAlerts,
  onResetSpend,
  onOpenEditASL,
  soundEnabled,
  onToggleSound,
  telegramWebhook,
  onUpdateTelegramWebhook,
  onTestWebhook,
}) => {
  if (!isOpen) return null;

  const unreadCount = alerts.filter(a => !a.read).length;

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
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  Live ASL Alerts & Webhooks
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[11px] font-bold bg-rose-600 text-white rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">Real-time alerts across all Business Managers</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Bar */}
          <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1 text-slate-600 hover:text-sky-600 disabled:opacity-40 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
              <button
                onClick={onClearAlerts}
                disabled={alerts.length === 0}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            <button
              onClick={onToggleSound}
              className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                soundEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {soundEnabled ? '🔔 Audio On' : '🔕 Audio Muted'}
            </button>
          </div>

          {/* Alert Stream List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CheckCheck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-slate-700 text-sm">No spending limit alerts</p>
                <p className="text-xs text-slate-500 mt-1">All ad accounts are currently healthy within their budget thresholds.</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const targetAccount = accounts.find(a => a.id === alert.accountId);
                const isLimitHit = alert.type === 'LIMIT_REACHED';
                const isCritical = alert.severity === 'critical' || alert.severity === 'danger';

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      isLimitHit
                        ? 'bg-rose-50/80 border-rose-200 shadow-xs'
                        : isCritical
                        ? 'bg-amber-50/80 border-amber-200 shadow-xs'
                        : 'bg-slate-50 border-slate-200 shadow-xs'
                    } ${!alert.read ? 'ring-1 ring-amber-400' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {isLimitHit ? (
                          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : isCritical ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-sky-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                          {alert.accountName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {alert.timestamp}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">
                        BM: {alert.bmName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                        isLimitHit ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {alert.percentUsed.toFixed(1)}% of ASL
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed mb-3">
                      {alert.message}
                    </p>

                    {/* Spend meter in alert */}
                    <div className="mb-3 bg-white p-2 rounded border border-slate-200">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                        <span>Spent: {formatCurrency(alert.currentSpent)}</span>
                        <span>Limit: {formatCurrency(alert.spendingLimit)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLimitHit ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, alert.percentUsed)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      {targetAccount && (
                        <>
                          <button
                            onClick={() => onResetSpend(alert.accountId)}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors border border-slate-200 shadow-xs"
                          >
                            <RotateCcw className="w-3 h-3 text-sky-600" />
                            Reset Spend
                          </button>
                          <button
                            onClick={() => onOpenEditASL(targetAccount)}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors border border-slate-200 shadow-xs"
                          >
                            <Sliders className="w-3 h-3 text-amber-600" />
                            Increase Limit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Webhook & Notification Dispatcher Settings */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs">
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
              <span>External Alert Pipeline (Telegram / Webhook)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                Active
              </span>
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://api.telegram.org/bot... or Webhook URL"
                  value={telegramWebhook}
                  onChange={(e) => onUpdateTelegramWebhook(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-mono placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
                />
                <button
                  onClick={onTestWebhook}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium text-xs flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  Test
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Pushes instant JSON alerts to Telegram, WhatsApp bot, or Discord webhook when any ad account crosses threshold.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
