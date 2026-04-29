import { Component, effect, input, output, signal } from '@angular/core';
import { FormField, debounce, disabled, form, minLength, required } from '@angular/forms/signals';
import { DevFestEvent } from '../../models/event.model';

export type FestivalEventFormValue = Omit<DevFestEvent, 'id'>;

@Component({
  selector: 'app-festival-event-form',
  imports: [FormField],
  templateUrl: './festival-event-form.html',
})
export class FestivalEventForm {
  readonly initialValue = input.required<FestivalEventFormValue>();
  readonly submitLabel = input('Save');
  readonly pending = input(false);
  readonly submitEvent = output<FestivalEventFormValue>();

  readonly eventData = signal<FestivalEventFormValue>({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    location: '',
    speakers: [],
    image: '/images/event4.png',
  });
  readonly form = form(this.eventData, (root) => {
    required(root.title, { message: 'Title is required' });
    debounce(root.description, 1000);
    disabled(root.description, ({ valueOf }) => !valueOf(root.title));
    required(root.description, { message: 'Description is required' });
    minLength(root.description, 10, { message: 'Description must be at least 10 chars' });
    required(root.date, { message: 'Date is required' });
    required(root.location, { message: 'Location is required' });
    required(root.image, { message: 'Image is required' });
  });

  constructor() {
    effect(() => {
      const next = this.initialValue();
      this.eventData.set({
        ...next,
        speakers: [...next.speakers],
      });
    });
  }

  addSpeaker() {
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
    if (this.form().invalid() || this.pending()) return;
    this.submitEvent.emit({
      ...this.eventData(),
      speakers: this.eventData()
        .speakers.map((speaker) => speaker.trim())
        .filter((speaker) => speaker.length > 0),
    });
  }
}
