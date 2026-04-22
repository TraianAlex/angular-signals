import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

type AlertifyStatic = typeof import('alertifyjs');

function asAlertify(mod: unknown): AlertifyStatic {
  const m = mod as { default?: AlertifyStatic };
  return (m.default ?? mod) as AlertifyStatic;
}

@Injectable({ providedIn: 'root' })
export class AlertifyBrowser {
  private readonly platformId = inject(PLATFORM_ID);
  private ready: Promise<AlertifyStatic | null> | null = null;

  private ensureLoaded(): Promise<AlertifyStatic | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve(null);
    }
    if (!this.ready) {
      this.ready = import('alertifyjs').then((mod) => {
        const alertify = asAlertify(mod);
        alertify.set('notifier', 'position', 'top-right');
        alertify.set('notifier', 'delay', 3);
        return alertify;
      });
    }
    return this.ready;
  }

  success(message: string): void {
    void this.ensureLoaded().then((a) => a?.success(message));
  }

  error(message: string): void {
    void this.ensureLoaded().then((a) => a?.error(message));
  }
}
