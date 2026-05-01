import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { EMPTY, Observable, catchError, finalize, switchMap, tap } from 'rxjs';
import { DevFestEvent } from '../models/event.model';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { AlertifyBrowser } from './alertify-browser.service';

export interface FestivalListQuery {
  query: Signal<string>;
  page: Signal<number>;
  pageSize: Signal<number>;
}

@Injectable({
  providedIn: 'root',
})
export class FestivalService {
  private readonly http = inject(HttpClient);
  private readonly alertify = inject(AlertifyBrowser);
  private readonly apiUrl = '/api/festival/events';

  readonly updateError = signal('');
  readonly updatePending = signal(false);
  readonly updateSuccessSeq = signal(0);

  getEventsResource(input: FestivalListQuery) {
    return httpResource<DevFestEvent[]>(() => {
      const q = String(input.query() ?? '').trim();
      const page = Math.max(1, input.page() ?? 1);
      const limit = Math.max(1, input.pageSize() ?? 6);
      const params: Record<string, string | number> = {
        _page: page,
        _limit: limit,
      };
      if (q) {
        params['q'] = q;
      }
      return {
        url: this.apiUrl,
        params,
        transferCache: { includeHeaders: ['X-Total-Count'] },
      };
    });
  }

  getEventResource(id: Signal<string>) {
    return httpResource<DevFestEvent>(() => {
      const eventId = id();
      if (!eventId) return undefined;
      return `${this.apiUrl}/${eventId}`;
    });
  }

  // createEvent(event: Omit<DevFestEvent, 'id'>): Observable<DevFestEvent> {
  //   return this.http.post<DevFestEvent>(this.apiUrl, event);
  // }
  createEvent = rxMethod((source$: Observable<Omit<DevFestEvent, 'id'>>) =>
    source$.pipe(
      switchMap((event) =>
        this.http.post<DevFestEvent>(this.apiUrl, event).pipe(
          tap(() => {
            this.alertify.success('Festival event created!');
          }),
          catchError(() => {
            this.alertify.error('Failed to create festival event.');
            return EMPTY;
          }),
        ),
      ),
    ),
  );

  // updateEvent(id: string, event: Omit<DevFestEvent, 'id'>): Observable<DevFestEvent> {
  //   return this.http.put<DevFestEvent>(`${this.apiUrl}/${id}`, event);
  // }
  updateEvent = rxMethod((id$: Observable<{ id: string; event: Omit<DevFestEvent, 'id'> }>) =>
    id$.pipe(
      tap(() => {
        this.updatePending.set(true);
      }),
      switchMap(({ id, event }) =>
        this.http.put<DevFestEvent>(`${this.apiUrl}/${id}`, event).pipe(
          tap(() => {
            this.alertify.success('Festival event updated!');
            this.updateSuccessSeq.update((n) => n + 1);
          }),
          catchError(() => {
            this.alertify.error('Could not update festival event.');
            this.updateError.set('Could not update festival event.');
            return EMPTY;
          }),
          finalize(() => this.updatePending.set(false)),
        ),
      ),
    ),
  );

  // deleteEvent(id: string): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/${id}`);
  // }
  deleteEvent = rxMethod((id$: Observable<string>) =>
    id$.pipe(
      switchMap((id) =>
        this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
          tap(() => {
            this.alertify.success('Festival event deleted!');
          }),
          catchError(() => {
            this.alertify.error('Could not delete festival event.');
            return EMPTY;
          }),
        ),
      ),
    ),
  );
}
