import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return router.createUrlTree(['/']);
  }
  // Simulation: Check if user is "admin"
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (isAdmin) {
    return true;
  } else {
    alert('Restricted Area! (Simulating 403)');
    return router.createUrlTree(['/']);
  }
};
