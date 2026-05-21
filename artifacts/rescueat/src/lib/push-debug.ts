/**
 * 通知デバッグ用ログキャプチャ
 *
 * `[push]` で始まる console.log/warn/error をメモリに保持し、
 * Settings 画面の「通知デバッグ」セクションが読み取って表示する。
 *
 * iOS 実機 (Capacitor / Release ビルド) では Safari Web Inspector が
 * 使えないことが多いので、アプリ内で原因切り分けできるようにする。
 */

export interface PushLogEntry {
  ts: number;
  level: 'log' | 'warn' | 'error';
  message: string;
}

const MAX_LOGS = 100;
const buffer: PushLogEntry[] = [];
const listeners = new Set<() => void>();

function push(level: PushLogEntry['level'], args: unknown[]) {
  try {
    const message = args
      .map(a => {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.message;
        try { return JSON.stringify(a); } catch { return String(a); }
      })
      .join(' ');
    if (!message.startsWith('[push]')) return;
    buffer.push({ ts: Date.now(), level, message });
    if (buffer.length > MAX_LOGS) buffer.shift();
    listeners.forEach(fn => { try { fn(); } catch { /* ignore */ } });
  } catch { /* ignore */ }
}

let installed = false;
export function installPushDebugCapture() {
  if (installed) return;
  installed = true;
  const origLog   = console.log;
  const origWarn  = console.warn;
  const origError = console.error;
  console.log   = (...args: unknown[]) => { push('log',   args); origLog  (...args as []); };
  console.warn  = (...args: unknown[]) => { push('warn',  args); origWarn (...args as []); };
  console.error = (...args: unknown[]) => { push('error', args); origError(...args as []); };
}

export function getPushLogs(): PushLogEntry[] {
  return buffer.slice();
}

export function subscribePushLogs(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function clearPushLogs() {
  buffer.length = 0;
  listeners.forEach(fn => { try { fn(); } catch { /* ignore */ } });
}
