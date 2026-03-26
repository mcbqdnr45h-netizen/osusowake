import { useState, useEffect } from 'react';

export interface AppSettings {
  catchphrase: string;
  sub_catchphrase: string;
  maintenance_mode: string;
  maintenance_title: string;
  maintenance_message: string;
  auto_approve_stripe_verified: string;
}

const DEFAULTS: AppSettings = {
  catchphrase:                  'あなたの街のおすそわけ',
  sub_catchphrase:              'おいしいものを、もっとみんなへ。',
  maintenance_mode:             'false',
  maintenance_title:            'ただいまメンテナンス中です',
  maintenance_message:          'より良いサービスのために、現在システムメンテナンスを行っています。\nしばらくお待ちください🙏',
  auto_approve_stripe_verified: 'false',
};

let _cached: AppSettings | null = null;
let _listeners: Array<(s: AppSettings) => void> = [];

function notifyAll(s: AppSettings) {
  _listeners.forEach(fn => fn(s));
}

export async function fetchAppSettings(): Promise<AppSettings> {
  const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
  try {
    const res = await fetch(`${BASE_URL}/api/settings`);
    if (!res.ok) return DEFAULTS;
    const data = await res.json();
    const settings: AppSettings = { ...DEFAULTS, ...data };
    _cached = settings;
    notifyAll(settings);
    return settings;
  } catch {
    return DEFAULTS;
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(_cached ?? DEFAULTS);

  useEffect(() => {
    _listeners.push(setSettings);
    if (!_cached) {
      fetchAppSettings().then(setSettings);
    }
    return () => {
      _listeners = _listeners.filter(fn => fn !== setSettings);
    };
  }, []);

  const isMaintenanceMode = settings.maintenance_mode === 'true';

  return { settings, isMaintenanceMode };
}
