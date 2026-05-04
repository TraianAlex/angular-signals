import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
  withHooks,
} from '@ngrx/signals';
import { HttpClient } from '@angular/common/http';
import { TICKETS_URL } from './tokens';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, tap, switchMap, exhaustMap, catchError } from 'rxjs';
import {
  withRequestStatus,
  setPending,
  setFulfilled,
  setError,
} from './store-features/request-status.feature';

// Helper interface for API response
interface TicketEntry {
  id: string | number;
  eventId: string;
}

type CartState = {
  ticketIds: string[];
};

export const CartStore = signalStore(
  { providedIn: 'root' },
  // 1. Initial State
  withState<CartState>({ ticketIds: [] }),
  // 2. Add Custom Feature (Gives us isPending, error, etc.)
  withRequestStatus(),
  // 3. Computed Selectors
  withComputed(({ ticketIds }) => ({
    count: () => ticketIds().length,
  })),
  withMethods((store) => {
    const http = inject(HttpClient);
    const ticketsUrl = inject(TICKETS_URL);
    const expressTicketsUrl = '/api/tickets';

    const getTicketsWithFallback = () =>
      http.get<TicketEntry[]>(ticketsUrl).pipe(catchError(() => http.get<TicketEntry[]>(expressTicketsUrl)));

    const addTicketWithFallback = (eventId: string) =>
      http
        .post<TicketEntry>(ticketsUrl, { eventId })
        .pipe(catchError(() => http.post<TicketEntry>(expressTicketsUrl, { eventId })));

    return {
      // METHOD 1: Load Tickets (Read)
      // Strategy: switchMap (If called again, cancel previous load)
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap(() =>
            getTicketsWithFallback().pipe(
              tapResponse({
                next: (tickets) =>
                  patchState(store, { ticketIds: tickets.map((t) => t.eventId) }, setFulfilled()),
                error: (err: any) => patchState(store, setError(err.message)),
              }),
            ),
          ),
        ),
      ),
      // METHOD 2: Checkout (Write)
      // Strategy: exhaustMap (Ignore clicks while one is processing)
      addToCart: rxMethod<{ eventId: string }>(
        pipe(
          exhaustMap(({ eventId }) => {
            patchState(
              store,
              (state) => ({ ticketIds: [...state.ticketIds, eventId] }),
              setPending(),
            );
            return addTicketWithFallback(eventId).pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled());
                  console.log('Transaction Confirmed');
                },
                error: (err: { message: string }) => {
                  console.error('Transaction Failed - Rolling Back');
                  // CRITICAL: ROLLBACK LOGIC
                  // We optimistically added the ID. Now we must remove ONE instance of it.
                  patchState(
                    store,
                    (state) => {
                      const index = state.ticketIds.lastIndexOf(eventId);
                      if (index === -1) return state;

                      const newIds = [...state.ticketIds];
                      newIds.splice(index, 1);
                      return { ticketIds: newIds };
                    },
                    setError(err.message),
                  );
                },
              }),
            );
          }),
        ),
      ),
    };
  }),
  // LIFECYCLE HOOKS
  withHooks({
    onInit(store) {
      // Automatically load data when the store is first injected
      store.load();
    },
  }),
);
