import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/events/event-list').then((m) => m.EventList),
  },
  {
    path: 'todos',
    loadComponent: () =>
      import('./features/todos/todo-list').then((m) => m.TodoList),
  },
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
