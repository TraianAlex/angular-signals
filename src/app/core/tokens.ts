import { InjectionToken, inject } from '@angular/core';

// 1. The Base URL Token
// This allows us to switch environments (dev/prod) easily.
export const API_URL = new InjectionToken<string>('API_URL');

// 2. The Derived Token (Factory Pattern)
// This token automatically injects API_URL and appends '/tickets'.
// You never have to manually concatenate strings in your services.
export const TICKETS_URL = new InjectionToken<string>('TICKETS_URL', {
  providedIn: 'root',
  factory: () => {
    const api = inject(API_URL);
    return `${api}/tickets`;
  },
});
