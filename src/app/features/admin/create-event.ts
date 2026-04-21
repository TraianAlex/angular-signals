import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EventsService } from '../../core/event.service';
import { DevFestEvent } from '../../models/event.model';
import { FormField, debounce, disabled, form, minLength, required } from '@angular/forms/signals';

interface CreateEventForm extends Omit<DevFestEvent, 'id'> {}

@Component({
  selector: 'app-create-event',
  imports: [FormField],
  templateUrl: './create-event.html',
})
export class CreateEvent {
  private readonly eventService = inject(EventsService);
  private readonly router = inject(Router);

  // 2. The Source of Truth
  // This writable signal holds the data.
  // We initialize it with empty/default values.
  readonly eventData = signal<CreateEventForm>({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16), // Default to now
    location: '',
    speakers: [],
    image: '/images/event4.png',
  });

  // 3. Create Form & Validation Schema
  readonly form = form(this.eventData, (root) => {
    required(root.title, { message: 'Title is required' });
    // A. Debounce: Wait 1000ms after typing stops before updating the model
    debounce(root.description, 1000);
    // B. Conditional Disable: Disable description if Title is empty
    // valueOf() lets us look up the current value of other fields
    disabled(root.description, ({ valueOf }) => !valueOf(root.title));
    // C. Validation
    required(root.description, { message: 'Description is required' });
    minLength(root.description, 10, { message: 'Description must be at least 10 chars' });
    // Other Rules
    required(root.date, { message: 'Date is required' });
    required(root.location, { message: 'Location is required' });
  });

  addSpeaker() {
    // Update the source signal. The form automatically detects the new item.
    this.eventData.update((current) => ({
      ...current,
      speakers: [...current.speakers, ''],
    }));
  }

  removeSpeaker(index: number) {
    this.eventData.update((current) => ({
      ...current,
      speakers: current.speakers.filter((_, i) => i !== index),
    }));
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();
    // 1. Check form-level validity signal
    if (this.form().invalid()) return;
    // 2. Read the Source Signal directly
    const payload = this.eventData();
    // 3. Send to service
    this.eventService.createEvent(payload).subscribe({
      next: () => {
        alert('Event Created!');
        this.router.navigate(['/']);
      },
      error: (err) => console.error(err),
    });
  }
}
