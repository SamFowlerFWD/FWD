import { useEffect, useState } from 'react';
import { api } from './api';
import { Button, Notice, useAction } from './ui';

// Turns notifications on or off for the device Sam is using. Each phone or
// computer is switched on separately (server/portal/push.ts sends them).

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const installed = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
const isApplePhone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const keyBytes = (key: string) => Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!supported()) return null;
  const registration = await navigator.serviceWorker.getRegistration('/portal');
  return registration ? registration.pushManager.getSubscription() : null;
}

// Used when signing out too, so a signed-out device stops getting them.
export async function pushOff(): Promise<void> {
  try {
    const sub = await currentSubscription();
    if (!sub) return;
    await api('/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => {});
    await sub.unsubscribe();
  } catch {
    // nothing to turn off
  }
}

// The number on the app icon (where the phone supports it).
export function setBadge(count: number) {
  const nav = navigator as { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  if (count > 0) nav.setAppBadge?.(count).catch(() => {});
  else nav.clearAppBadge?.().catch(() => {});
}

export default function PushSwitch() {
  // undefined = still checking
  const [on, setOn] = useState<boolean | undefined>(undefined);
  const [tested, setTested] = useState(false);
  const { busy, error, run, setError } = useAction();

  useEffect(() => {
    currentSubscription().then((sub) => setOn(!!sub)).catch(() => setOn(false));
  }, []);

  if (!supported()) {
    return (
      <p className="text-sm text-slate-600">
        {isApplePhone() && !installed()
          ? 'To get notifications on this iPhone: tap the Share button, choose "Add to Home Screen", then open FWD from your home screen and turn them on there.'
          : 'This browser cannot show notifications.'}
      </p>
    );
  }
  if (on === undefined) return null;

  const turnOn = () =>
    run(async () => {
      if ((await Notification.requestPermission()) !== 'granted') {
        setError('Notifications are blocked for this site. Allow them in your phone or browser settings, then try again.');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const { key } = await api<{ key: string }>('/push/key');
      const sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
      await api('/push/subscribe', { method: 'POST', body: sub.toJSON() });
      setOn(true);
    });
  const turnOff = () => run(async () => { await pushOff(); setOn(false); setTested(false); });
  const test = () => run(async () => { await api('/push/test', { method: 'POST', body: {} }); setTested(true); });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {on ? (
          <>
            <span className="text-slate-700">Notifications are <strong>on</strong> for this device.</span>
            <Button variant="link" disabled={busy} onClick={test}>Send a test</Button>
            <Button variant="link" disabled={busy} onClick={turnOff}>Turn off</Button>
          </>
        ) : (
          <>
            <span className="text-slate-700">Get these on this device as they happen.</span>
            <Button variant="secondary" disabled={busy} onClick={turnOn}>{busy ? 'Turning on...' : 'Turn on notifications'}</Button>
          </>
        )}
      </div>
      {tested && !error && <Notice tone="success">Sent. It should appear in a few seconds.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
