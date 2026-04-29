import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/events/event-list').then((m) => m.EventList),
  },
  {
    path: 'festival',
    loadComponent: () => import('./features/festival/festival-list').then((m) => m.FestivalList),
  },
  {
    path: 'festival/event/:id',
    loadComponent: () =>
      import('./features/festival/festival-details').then((m) => m.FestivalDetails),
  },
  {
    path: 'festival/admin/create',
    loadComponent: () =>
      import('./features/festival/create-festival').then((m) => m.CreateFestival),
    // canActivate: [authGuard],
  },
  {
    path: 'todos',
    loadComponent: () => import('./features/todos/todo-list').then((m) => m.TodoList),
  },
  {
    path: 'todos/:id',
    loadComponent: () => import('./features/todos/todo-details').then((m) => m.TodoDetails),
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
