import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, DownloadSimple } from '@phosphor-icons/react';

const DISMISS_KEY = 'q2c_install_dismissed_at';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore
      window.navigator.standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    if (iOS) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-primary/30 bg-card p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <img src="/logo.png" alt="Quiz2cash" className="h-10 w-10 rounded-lg" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Install Quiz2cash</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-1">
              Tap Share, then "Add to Home Screen" for the fastest experience.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Add to your home screen for a faster, app-like experience.
            </p>
          )}
          {!isIOS && (
            <Button size="sm" className="mt-2" onClick={install}>
              <DownloadSimple size={14} className="mr-1" /> Install
            </Button>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
