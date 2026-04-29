import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

type TodoPayload = Omit<TodoItem, 'id'>;

const todosStore: TodoItem[] = [
  { id: 1, title: 'Prepare SSR demo', completed: true },
  { id: 2, title: 'Build todos CRUD API', completed: true },
  { id: 3, title: 'Create Angular todo list', completed: true },
  { id: 4, title: 'Add details page for one todo', completed: false },
  { id: 5, title: 'Implement todo update flow', completed: false },
  { id: 6, title: 'Implement todo delete from list', completed: false },
];

let nextTodoId = Math.max(...todosStore.map((t) => t.id), 0) + 1;

app.use(express.json());

app.get('/api/todos', (_req, res) => {
  res.json(todosStore);
});

app.get('/api/todos/:id', (req, res) => {
  const id = Number.parseInt(req.params['id'] ?? '', 10);
  const todo = todosStore.find((item) => item.id === id);
  if (!todo) {
    res.status(404).json({ message: 'Todo not found' });
    return;
  }
  res.json(todo);
});

app.post('/api/todos', (req, res) => {
  const payload = req.body as Partial<TodoPayload>;
  if (typeof payload.title !== 'string' || payload.title.trim() === '') {
    res.status(400).json({ message: 'Title is required' });
    return;
  }

  const todo: TodoItem = {
    id: nextTodoId++,
    title: payload.title.trim(),
    completed: Boolean(payload.completed),
  };

  todosStore.unshift(todo);
  res.status(201).json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const id = Number.parseInt(req.params['id'] ?? '', 10);
  const index = todosStore.findIndex((item) => item.id === id);
  if (index < 0) {
    res.status(404).json({ message: 'Todo not found' });
    return;
  }

  const payload = req.body as Partial<TodoPayload>;
  if (typeof payload.title !== 'string' || payload.title.trim() === '') {
    res.status(400).json({ message: 'Title is required' });
    return;
  }

  const updated: TodoItem = {
    id,
    title: payload.title.trim(),
    completed: Boolean(payload.completed),
  };

  todosStore[index] = updated;
  res.json(updated);
});

app.delete('/api/todos/:id', (req, res) => {
  const id = Number.parseInt(req.params['id'] ?? '', 10);
  const index = todosStore.findIndex((item) => item.id === id);
  if (index < 0) {
    res.status(404).json({ message: 'Todo not found' });
    return;
  }

  todosStore.splice(index, 1);
  res.status(204).send();
});


/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
