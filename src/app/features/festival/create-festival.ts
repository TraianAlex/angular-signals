import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FestivalService } from '../../core/festival.service';
import { DevFestEvent } from '../../models/event.model';
import { FestivalEventForm, FestivalEventFormValue } from './festival-event-form';

interface CreateFestivalForm extends Omit<DevFestEvent, 'id'> {}

@Component({
  selector: 'app-create-festival',
  imports: [FestivalEventForm, RouterLink],
  templateUrl: './create-festival.html',
})
export class CreateFestival {
  private readonly festivalService = inject(FestivalService);
  private readonly router = inject(Router);

  readonly initialFormValue = signal<CreateFestivalForm>({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    location: '',
    speakers: [],
    image: '/images/event4.png',
  });

  // onSubmit(eventData: FestivalEventFormValue) {
  //   this.festivalService.createEvent(eventData).subscribe({
  //     next: () => {
  //       this.alertify.success('Festival event created!');
  //       void this.router.navigate(['/festival']);
  //     },
  //     error: () => {
  //       this.alertify.error('Failed to create festival event');
  //     },
  //   });
  // }
  onSubmit(eventData: FestivalEventFormValue) {
    this.festivalService.createEvent(eventData);
    void this.router.navigate(['/festival']);
  }
}
