import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  {
    path: 'festival',
    renderMode: RenderMode.Client,
  },
  {
    path: 'festival/event/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'festival/admin/create',
    renderMode: RenderMode.Client,
  },
  {
    path: 'todos',
    renderMode: RenderMode.Client,
  },
  {
    path: 'todos/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'event/:id',
    // renderMode: RenderMode.Server,
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [{ id: '1' }, { id: '2' }];
    },
  },
  {
    path: 'admin/create',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
