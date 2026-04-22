import { Injectable, inject, Signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DevFestEvent } from '../models/event.model';
import { API_URL } from './tokens';

export interface EventsListQuery {
  query: Signal<string>;
  page: Signal<number>;
  pageSize: Signal<number>;
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private http = inject(HttpClient);
  private apiUrl = `${inject(API_URL)}/events`;

  /**
   * Paginated events (json-server: `_page`, `_limit`, `X-Total-Count` header).
   */
  getEventsResource(input: EventsListQuery) {
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

  // Factory for a single event resource
  // We accept a Signal<string> to allow reactive chaining
  getEventResource(id: Signal<string>) {
    return httpResource<DevFestEvent>(() => {
      const eventId = id();
      // If no ID (or routing transition), don't fetch yet
      if (!eventId) return undefined;

      return `${this.apiUrl}/${eventId}`;
    });
  }

  createEvent(event: Omit<DevFestEvent, 'id'>): Observable<DevFestEvent> {
    return this.http
      .post<DevFestEvent>(this.apiUrl, event)
      .pipe(tap((event) => console.log('Event created:', event)));
  }

  // We return an Observable (classic pattern) for the component to subscribe to.
  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
