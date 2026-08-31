import React, { useState } from 'react';
import { BusinessManager, AdAccount } from '../types';
import { X, Building2, Plus, Trash2, Key, CheckCircle, ShieldAlert, Sparkles, Download, Upload } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface BMManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessManagers: BusinessManager[];
  accounts: AdAccount[];
  onAddBM: (newBM: Omit<BusinessManager, 'id'>) => void;
  onDeleteBM: (bmId: string) => void;
  onAddAccount: (newAcc: Omit<AdAccount, 'id' | 'campaigns'>) => void;
}

export const BMManagerModal: React.FC<BMManagerModalProps> = ({
  isOpen,
  onClose,
  businessManagers,
  accounts,
  onAddBM,
  onDeleteBM,
  onAddAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'bms' | 'add_bm' | 'add_account'>('bms');

  // New BM form state
  const [bmName, setBmName] = useState('');
  const [bmIdVal, setBmIdVal] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('GMT+8 (Asia/Manila)');
  const [color, setColor] = useState('emerald');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [systemToken, setSystemToken] = useState('');

  // New Account form state
  const [selectedBMId, setSelectedBMId] = useState(businessManagers[0]?.id || '');
  const [accName, setAccName] = useState('');
  const [accIdVal, setAccIdVal] = useState('');
  const [aslLimit, setAslLimit] = useState('5000');
  const [dslLimit, setDslLimit] = useState('1000');
  const [initialSpent, setInitialSpent] = useState('0');

  if (!isOpen) return null;

  const handleCreateBM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bmName.trim()) return;

    onAddBM({
      name: bmName.trim(),
      bmId: bmIdVal.trim() || `bm_${Date.now()}`,
      currency,
      timezone,
      color,
      ownerEmail: ownerEmail.trim(),
      systemToken: systemToken.trim(),
      status: 'active',
    });

    setBmName('');
    setBmIdVal('');
    setOwnerEmail('');
    setSystemToken('');
    setActiveTab('bms');
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    const parentBM = businessManagers.find(b => b.id === selectedBMId) || businessManagers[0];

    onAddAccount({
      bmId: parentBM.id,
      bmName: parentBM.name,
      name: accName.trim(),
      accountId: accIdVal.trim() || `act_${Date.now()}`,
      currency: parentBM.currency,
      status: 'ACTIVE',
      amountSpent: parseFloat(initialSpent) || 0,
      accountSpendingLimit: parseFloat(aslLimit) || 5000,
      dailySpendLimit: parseFloat(dslLimit) || 1000,
      todaySpend: 0,
      billingThreshold: 500,
      currentBillingBill: 0,
      alertThresholdPercent: 85,
      purchases: 0,
      purchasesConversionValue: 0,
      costPerPurchase: 0,
      avgPurchaseConversionValue: 0,
      registrationsCompleted: 0,
      costPerRegistration: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      impressions: 0,
      reach: 0,
    });

    setAccName('');
    setAccIdVal('');
    setInitialSpent('0');
    setActiveTab('bms');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Business Managers & Ad Accounts Hub</h3>
              <p className="text-xs text-slate-500">Connect unlimited Meta Business Portfolios and unify their ad assets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('bms')}
            className={`py-3 border-b-2 mr-6 transition-colors ${
              activeTab === 'bms'
                ? 'border-sky-600 text-sky-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Connected BMs ({businessManagers.length})
          </button>
          <button
            onClick={() => setActiveTab('add_bm')}
            className={`py-3 border-b-2 mr-6 flex items-center gap-1.5 transition-colors ${
              activeTab === 'add_bm'
                ? 'border-sky-600 text-sky-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Connect New BM
          </button>
          <button
            onClick={() => setActiveTab('add_account')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'add_account'
                ? 'border-sky-600 text-sky-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Link Ad Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs bg-white">
          {activeTab === 'bms' && (
            <div className="space-y-4">
              <div className="text-slate-500 text-xs">
                All ad accounts under these Business Managers will be synchronized in real-time on your master dashboard.
              </div>

              <div className="space-y-3">
                {businessManagers.map((bm) => {
                  const bmAccs = accounts.filter(a => a.bmId === bm.id);
                  const totalSpent = bmAccs.reduce((acc, curr) => acc + curr.amountSpent, 0);

                  return (
                    <div
                      key={bm.id}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-sky-600 text-sm shadow-xs">
                          BM
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{bm.name}</h4>
                          <div className="text-slate-500 text-[11px] font-mono flex items-center gap-2 mt-0.5">
                            <span>BM ID: {bm.bmId}</span>
                            <span>•</span>
                            <span>{bm.timezone}</span>
                          </div>
                          <div className="text-slate-500 text-[10px] mt-1">
                            {bmAccs.length} linked ad accounts • Current Spend: {formatCurrency(totalSpent, bm.currency)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {businessManagers.length > 1 && (
                          <button
                            onClick={() => onDeleteBM(bm.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                            title="Disconnect BM"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'add_bm' && (
            <form onSubmit={handleCreateBM} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Business Manager Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Media Agency Scale Alpha"
                    value={bmName}
                    onChange={(e) => setBmName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Meta BM ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 984712093821092"
                    value={bmIdVal}
                    onChange={(e) => setBmIdVal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PHP">PHP (₱)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Timezone</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">System User Access Token / Graph API Token (Optional)</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="EAABw..."
                    value={systemToken}
                    onChange={(e) => setSystemToken(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Optional token for automated Graph API pulling or live sync simulation.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('bms')}
                  className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Connect Business Manager
                </button>
              </div>
            </form>
          )}

          {activeTab === 'add_account' && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Parent Business Manager *</label>
                <select
                  value={selectedBMId}
                  onChange={(e) => setSelectedBMId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-sky-500"
                >
                  {businessManagers.map(bm => (
                    <option key={bm.id} value={bm.id}>{bm.name} (BM ID: {bm.bmId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Ad Account Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MF12-KDYY(+8)-0803-6"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Meta Ad Account ID</label>
                  <input
                    type="text"
                    placeholder="e.g. act_78491029384922"
                    value={accIdVal}
                    onChange={(e) => setAccIdVal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Account Spending Limit ($)</label>
                  <input
                    type="number"
                    value={aslLimit}
                    onChange={(e) => setAslLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Daily Spend Limit ($)</label>
                  <input
                    type="number"
                    value={dslLimit}
                    onChange={(e) => setDslLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Initial Spend ($)</label>
                  <input
                    type="number"
                    value={initialSpent}
                    onChange={(e) => setInitialSpent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:border-sky-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('bms')}
                  className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Link Ad Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
