import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

interface FestivalEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
  speakers: string[];
  image: string;
}

type FestivalEventPayload = Omit<FestivalEvent, 'id'>;

interface AppDatabase {
  events: FestivalEvent[];
  tickets: Array<{ id: number; eventId: string }>;
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
const dbPath = join(process.cwd(), 'db.json');

app.use(express.json());

async function readDatabase(): Promise<AppDatabase> {
  const file = await readFile(dbPath, 'utf8');
  return JSON.parse(file) as AppDatabase;
}

async function writeDatabase(db: AppDatabase): Promise<void> {
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
}

async function listTickets(_req: express.Request, res: express.Response): Promise<void> {
  try {
    const db = await readDatabase();
    res.json(db.tickets);
  } catch {
    res.status(500).json({ message: 'Could not load tickets' });
  }
}

async function createTicket(req: express.Request, res: express.Response): Promise<void> {
  try {
    const payload = req.body as Partial<{ eventId: string }>;
    const eventId = String(payload.eventId ?? '').trim();
    if (!eventId) {
      res.status(400).json({ message: 'eventId is required' });
      return;
    }

    const db = await readDatabase();
    const eventExists = db.events.some((event) => event.id === eventId);
    if (!eventExists) {
      res.status(404).json({ message: 'Festival event not found' });
      return;
    }

    const nextId = Math.max(...db.tickets.map((ticket) => ticket.id), 0) + 1;
    const created = {
      id: nextId,
      eventId,
    };
    db.tickets.push(created);
    await writeDatabase(db);
    res.status(201).json(created);
  } catch {
    res.status(500).json({ message: 'Could not create ticket' });
  }
}

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

app.get('/api/festival/events', async (req, res) => {
  try {
    const db = await readDatabase();
    const q = String(req.query['q'] ?? '').trim().toLowerCase();
    const page = Math.max(1, Number.parseInt(String(req.query['_page'] ?? '1'), 10) || 1);
    const limit = Math.max(1, Number.parseInt(String(req.query['_limit'] ?? '6'), 10) || 6);

    const filtered = q
      ? db.events.filter((event) => {
          const haystack = `${event.title} ${event.description} ${event.location} ${event.speakers.join(' ')}`;
          return haystack.toLowerCase().includes(q);
        })
      : db.events;

    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);
    res.setHeader('X-Total-Count', String(filtered.length));
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
    res.json(paged);
  } catch {
    res.status(500).json({ message: 'Could not load festival events' });
  }
});

app.get('/api/festival/events/:id', async (req, res) => {
  try {
    const db = await readDatabase();
    const event = db.events.find((item) => item.id === req.params['id']);
    if (!event) {
      res.status(404).json({ message: 'Festival event not found' });
      return;
    }
    res.json(event);
  } catch {
    res.status(500).json({ message: 'Could not load festival event' });
  }
});

app.post('/api/festival/events', async (req, res) => {
  try {
    const payload = req.body as Partial<FestivalEventPayload>;
    if (typeof payload.title !== 'string' || payload.title.trim() === '') {
      res.status(400).json({ message: 'Title is required' });
      return;
    }
    if (
      typeof payload.description !== 'string' ||
      typeof payload.date !== 'string' ||
      typeof payload.location !== 'string' ||
      typeof payload.image !== 'string' ||
      !Array.isArray(payload.speakers)
    ) {
      res.status(400).json({ message: 'Invalid payload' });
      return;
    }

    const db = await readDatabase();
    const nextId = String(Math.max(...db.events.map((event) => Number.parseInt(event.id, 10) || 0), 0) + 1);
    const created: FestivalEvent = {
      id: nextId,
      title: payload.title.trim(),
      description: payload.description,
      date: payload.date,
      location: payload.location,
      image: payload.image,
      speakers: payload.speakers.map((speaker) => String(speaker)),
    };

    db.events.push(created);
    await writeDatabase(db);
    res.status(201).json(created);
  } catch {
    res.status(500).json({ message: 'Could not create festival event' });
  }
});

app.put('/api/festival/events/:id', async (req, res) => {
  try {
    const payload = req.body as Partial<FestivalEventPayload>;
    if (typeof payload.title !== 'string' || payload.title.trim() === '') {
      res.status(400).json({ message: 'Title is required' });
      return;
    }
    if (
      typeof payload.description !== 'string' ||
      typeof payload.date !== 'string' ||
      typeof payload.location !== 'string' ||
      typeof payload.image !== 'string' ||
      !Array.isArray(payload.speakers)
    ) {
      res.status(400).json({ message: 'Invalid payload' });
      return;
    }

    const db = await readDatabase();
    const index = db.events.findIndex((event) => event.id === req.params['id']);
    if (index < 0) {
      res.status(404).json({ message: 'Festival event not found' });
      return;
    }

    const updated: FestivalEvent = {
      id: req.params['id']!,
      title: payload.title.trim(),
      description: payload.description,
      date: payload.date,
      location: payload.location,
      image: payload.image,
      speakers: payload.speakers.map((speaker) => String(speaker)),
    };

    db.events[index] = updated;
    await writeDatabase(db);
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Could not update festival event' });
  }
});

app.delete('/api/festival/events/:id', async (req, res) => {
  try {
    const db = await readDatabase();
    const index = db.events.findIndex((event) => event.id === req.params['id']);
    if (index < 0) {
      res.status(404).json({ message: 'Festival event not found' });
      return;
    }
    db.events.splice(index, 1);
    await writeDatabase(db);
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Could not delete festival event' });
  }
});

app.get('/tickets', listTickets);
app.post('/tickets', createTicket);
app.get('/api/tickets', listTickets);
app.post('/api/tickets', createTicket);


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
