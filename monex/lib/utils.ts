import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, isLargeNumber?: boolean): string {
  if (!num && num !== 0) return '0';
  
  if (isLargeNumber && num >= 1_000_000) {
     if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2).replace(/\.00$/, '') + 'B';
     return (num / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
  }

  const maxFractions = num < 0.1 ? 5 : 3;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractions,
  }).format(num);
}

export function vibrate() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      const stored = localStorage.getItem('monex_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.haptics === false) return;
      }
      navigator.vibrate(10);
    } catch(e) {}
  }
}

