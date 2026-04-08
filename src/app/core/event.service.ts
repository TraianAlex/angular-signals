import { Injectable, inject, Signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DevFestEvent } from '../models/event.model';
import { API_URL } from './tokens';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private http = inject(HttpClient);
  // private apiUrl = 'http://localhost:3000/events';
  private apiUrl = `${inject(API_URL)}/events`;

  // 1. Define the Resource Factory
  // We accept a Signal<string> so the resource can react to changes automatically.
  getEventsResource(query: Signal<string>) {
    return httpResource<DevFestEvent[]>(() => {
      const q = query();
      // The function returns the URL to fetch.
      // Whenever 'q' changes, httpResource re-fetches automatically.
      return q ? `${this.apiUrl}?q=${q}` : this.apiUrl;
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
