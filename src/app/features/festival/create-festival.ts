import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, debounce, disabled, form, minLength, required } from '@angular/forms/signals';
import { AlertifyBrowser } from '../../core/alertify-browser.service';
import { FestivalService } from '../../core/festival.service';
import { DevFestEvent } from '../../models/event.model';

interface CreateFestivalForm extends Omit<DevFestEvent, 'id'> {}

@Component({
  selector: 'app-create-festival',
  imports: [FormField, RouterLink],
  templateUrl: './create-festival.html',
})
export class CreateFestival {
  private readonly festivalService = inject(FestivalService);
  private readonly router = inject(Router);
  private readonly alertify = inject(AlertifyBrowser);

  readonly eventData = signal<CreateFestivalForm>({
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
  });

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
    if (this.form().invalid()) return;
    this.festivalService.createEvent(this.eventData()).subscribe({
      next: () => {
        this.alertify.success('Festival event created!');
        void this.router.navigate(['/festival']);
      },
      error: () => {
        this.alertify.error('Failed to create festival event');
      },
    });
  }
}
