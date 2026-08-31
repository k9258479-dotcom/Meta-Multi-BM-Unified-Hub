export function formatCurrency(value: number | undefined | null, currency: string = 'USD'): string {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  
  const symbol = currency === 'PHP' ? '₱' : currency === 'EUR' ? '€' : '$';
  return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCompactCurrency(value: number | undefined | null, currency: string = 'USD'): string {
  if (value === undefined || value === null || isNaN(value)) return '$0';
  const symbol = currency === 'PHP' ? '₱' : currency === 'EUR' ? '€' : '$';
  
  if (Math.abs(value) >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(1)}k`;
  }
  return `${symbol}${value.toFixed(0)}`;
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  return `${value.toFixed(2)}%`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toLocaleString('en-US');
}

export interface ASLStatusMeta {
  status: 'NORMAL' | 'APPROACHING' | 'CRITICAL' | 'LIMIT_HIT';
  label: string;
  percent: number;
  remaining: number;
  bgClass: string;
  textClass: string;
  borderClass: string;
  progressColor: string;
}

export function getASLStatusMeta(amountSpent: number, spendingLimit: number, alertThreshold: number = 85): ASLStatusMeta {
  if (!spendingLimit || spendingLimit <= 0) {
    return {
      status: 'NORMAL',
      label: 'No ASL Set',
      percent: 0,
      remaining: Infinity,
      bgClass: 'bg-slate-100',
      textClass: 'text-slate-600',
      borderClass: 'border-slate-200',
      progressColor: 'bg-slate-400'
    };
  }

  const percent = Math.min(100, Math.max(0, (amountSpent / spendingLimit) * 100));
  const remaining = Math.max(0, spendingLimit - amountSpent);

  if (amountSpent >= spendingLimit || percent >= 99.5) {
    return {
      status: 'LIMIT_HIT',
      label: 'Limit Reached (100%)',
      percent,
      remaining: 0,
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-700',
      borderClass: 'border-rose-200',
      progressColor: 'bg-rose-500'
    };
  }

  if (percent >= 90) {
    return {
      status: 'CRITICAL',
      label: `Critical (${percent.toFixed(1)}%)`,
      percent,
      remaining,
      bgClass: 'bg-orange-50',
      textClass: 'text-orange-700',
      borderClass: 'border-orange-200',
      progressColor: 'bg-orange-500'
    };
  }

  if (percent >= alertThreshold) {
    return {
      status: 'APPROACHING',
      label: `Near Limit (${percent.toFixed(1)}%)`,
      percent,
      remaining,
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200',
      progressColor: 'bg-amber-500'
    };
  }

  return {
    status: 'NORMAL',
    label: `Healthy (${percent.toFixed(1)}%)`,
    percent,
    remaining,
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    progressColor: 'bg-emerald-500'
  };
}

export function getBMColorStyle(color: string) {
  switch (color) {
    case 'emerald':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        accent: '#10b981'
      };
    case 'blue':
      return {
        badge: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
        accent: '#0284c7'
      };
    case 'indigo':
      return {
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
        accent: '#6366f1'
      };
    case 'amber':
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        accent: '#f59e0b'
      };
    case 'rose':
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        accent: '#f43f5e'
      };
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
        accent: '#64748b'
      };
  }
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row.map(val => {
      let result = val === null || val === undefined ? '' : String(val);
      if (result.includes(',') || result.includes('"') || result.includes('\n')) {
        result = `"${result.replace(/"/g, '""')}"`;
      }
      return result;
    }).join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processRow).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
