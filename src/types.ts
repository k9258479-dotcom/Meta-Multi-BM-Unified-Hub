export interface BusinessManager {
  id: string;
  name: string;
  bmId: string;
  currency: string;
  timezone: string;
  color: string;
  ownerEmail?: string;
  tags?: string[];
  systemToken?: string;
  status: 'active' | 'warning' | 'restricted';
}

export interface Ad {
  id: string;
  adSetId: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  amountSpent: number;
  purchases: number;
  purchasesConversionValue: number;
  costPerPurchase: number;
  clicks: number;
  ctr: number;
  impressions: number;
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  dailyBudget?: number;
  amountSpent: number;
  purchases: number;
  purchasesConversionValue: number;
  costPerPurchase: number;
  clicks: number;
  ctr: number;
  impressions: number;
  ads?: Ad[];
}

export interface Campaign {
  id: string;
  accountId: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'LEARNING' | 'LIMITED';
  amountSpent: number;
  purchasesConversionValue: number;
  costPerPurchase: number;
  purchases: number;
  avgPurchaseConversionValue: number;
  registrationsCompleted: number;
  costPerRegistration: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  impressions: number;
  adSets?: AdSet[];
}

export interface AdAccount {
  id: string;
  bmId: string;
  bmName: string;
  name: string;
  accountId: string; // e.g. act_123456789
  currency: string;
  status: 'ACTIVE' | 'LIMIT_REACHED' | 'APPROACHING_LIMIT' | 'PAUSED' | 'DISABLED';
  amountSpent: number;
  accountSpendingLimit: number; // ASL limit in currency (0 means no ASL set)
  dailySpendLimit: number; // DSL limit (Daily spend cap)
  todaySpend: number;
  billingThreshold: number;
  currentBillingBill: number;
  alertThresholdPercent: number; // default 80% or 90%
  
  // Aggregate Metrics
  purchases: number;
  purchasesConversionValue: number;
  costPerPurchase: number;
  avgPurchaseConversionValue: number; // ROAS
  registrationsCompleted: number;
  costPerRegistration: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  impressions: number;
  reach: number;

  campaigns: Campaign[];
  lastResetDate?: string;
  notes?: string;
}

export type AlertType = 'APPROACHING_LIMIT' | 'CRITICAL_LIMIT' | 'LIMIT_REACHED' | 'BILLING_THRESHOLD' | 'DSL_APPROACHING';

export interface ASLAlert {
  id: string;
  accountId: string;
  accountName: string;
  bmId: string;
  bmName: string;
  timestamp: string;
  type: AlertType;
  severity: 'warning' | 'critical' | 'danger' | 'info';
  percentUsed: number;
  currentSpent: number;
  spendingLimit: number;
  message: string;
  read: boolean;
  actionTaken?: string;
}

export type ViewTab = 'unified_reporting' | 'spending_limits' | 'bm_manager' | 'alerts_hub' | 'ai_insights';

export interface ColumnConfig {
  id: string;
  label: string;
  category: 'performance' | 'conversions' | 'engagement' | 'spend_limit' | 'attributes';
  visible: boolean;
  sortable: boolean;
  align?: 'left' | 'right' | 'center';
  format?: 'currency' | 'number' | 'percent' | 'badge' | 'text' | 'compact_currency';
  tooltip?: string;
}

export interface DateRangeOption {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}
