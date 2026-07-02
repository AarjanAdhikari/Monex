import { useState, useEffect } from 'react';

export type AppSettings = {
  defaultBaseCurrency: string;
  rememberLastUsed: boolean;
  offlineMode: boolean;
  saveHistory: boolean;
  rateAlerts: boolean;
  theme: 'light' | 'dark';
  haptics: boolean;
};

const defaultSettings: AppSettings = {
  defaultBaseCurrency: 'USD',
  rememberLastUsed: true,
  offlineMode: false,
  saveHistory: true,
  rateAlerts: false,
  theme: 'light',
  haptics: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('monex_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings({ ...defaultSettings, ...parsed });
        if (parsed.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch {}
    setLoaded(true);

    const handleOnline = () => {
      setSettings(prev => {
        const next = { ...prev, offlineMode: false };
        try { localStorage.setItem('monex_settings', JSON.stringify(next)); } catch {}
        return next;
      });
    };
    const handleOffline = () => {
      setSettings(prev => {
        const next = { ...prev, offlineMode: true };
        try { localStorage.setItem('monex_settings', JSON.stringify(next)); } catch {}
        return next;
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
       handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('monex_settings', JSON.stringify(next));
      } catch {}
      
      // Handle theme change globally
      if (key === 'theme') {
        if (value === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  };

  return { settings, updateSetting, loaded };
}
