import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TICKETS_URL } from './tokens';

// Shape of data from json-server
interface TicketEntry {
  id: string; // database ID
  eventId: string; // our actual event ID
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  // Inject the token we defined in Step 1
  private readonly ticketsUrl = inject(TICKETS_URL);
  // 1. State: Just a list of Event IDs
  private readonly ticketIds = signal<string[]>([]);
  // 2. Computed: Total count
  readonly count = computed(() => this.ticketIds().length);

  constructor() {
    this.loadTickets();
  }

  // 3. Initial Load
  private loadTickets() {
    this.http.get<TicketEntry[]>(this.ticketsUrl).subscribe({
      next: (data) => {
        // Extract just the event IDs for our local state
        const ids = data.map((t) => t.eventId);
        this.ticketIds.set(ids);
      },
      error: (err) => console.error('Failed to load cart', err),
    });
  }

  // 4. Action: Optimistic Add
  addTicket(eventId: string) {
    // A. Snapshot current state (for rollback)
    const previousIds = this.ticketIds();
    // B. Optimistically update UI
    // We just append the ID to the list
    this.ticketIds.update((ids) => [...ids, eventId]);
    // C. Persist to Backend
    // We POST the eventId. json-server will generate a unique 'id' for the record.
    this.http.post(this.ticketsUrl, { eventId }).subscribe({
      next: () => console.log('Ticket synced to backend'),
      error: (err) => {
        console.error('Sync failed, reverting state', err);
        // D. Revert on Error
        this.ticketIds.set(previousIds);
        alert('Failed to add ticket to cart.');
      },
    });
  }
}
