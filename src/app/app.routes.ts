import { Routes } from '@angular/router';
import { EventList } from './features/events/event-list';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: EventList },
  {
    path: 'event/:id',
    loadComponent: () => import('./features/events/event-details').then((m) => m.EventDetails),
  },
  {
    path: 'admin/create',
    loadComponent: () => import('./features/admin/create-event').then((m) => m.CreateEvent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
