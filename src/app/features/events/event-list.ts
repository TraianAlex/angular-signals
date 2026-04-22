import { Component, inject, signal } from '@angular/core';
import { EventCard } from './event-card';
import { SearchBar } from './search-bar';
import { AlertifyBrowser } from '../../core/alertify-browser.service';
import { EventsService } from '../../core/event.service';

@Component({
  selector: 'app-event-list',
  imports: [EventCard, SearchBar],
  templateUrl: './event-list.html',
})
export class EventList {
  readonly eventsService = inject(EventsService);
  private readonly alertify = inject(AlertifyBrowser);

  readonly console = console;
  searchQuery = signal<string>('');

  // Initialize the Resource
  // We pass our signal directly to the service.
  // This creates a live connection: searchQuery -> URL -> HTTP Request -> events.value
  events = this.eventsService.getEventsResource(this.searchQuery);

  deleteEvent(id: string) {
    if (!confirm('Are you sure?')) return;
    this.eventsService.deleteEvent(id).subscribe({
      next: () => {
        this.alertify.success('Event deleted!');
        this.events.reload();
      },
      error: (err) => {
        this.alertify.error('Could not delete event');
      },
    });
  }
}
