import { Injectable, Signal, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DevFestEvent } from '../models/event.model';

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
  private readonly apiUrl = '/api/festival/events';

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

  createEvent(event: Omit<DevFestEvent, 'id'>): Observable<DevFestEvent> {
    return this.http.post<DevFestEvent>(this.apiUrl, event);
  }

  updateEvent(id: string, event: Omit<DevFestEvent, 'id'>): Observable<DevFestEvent> {
    return this.http.put<DevFestEvent>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
