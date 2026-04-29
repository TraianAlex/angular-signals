import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, delay, EMPTY, exhaustMap, Subject, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartStore } from '../../core/cart.store';
import { FestivalService } from '../../core/festival.service';
import { TabGroup } from '../../shared/tabs/tab-group';
import { Tab } from '../../shared/tabs/tab';

@Component({
  selector: 'app-festival-details',
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, NgOptimizedImage, TabGroup, Tab],
  templateUrl: './festival-details.html',
})
export class FestivalDetails {
  readonly cartStore = inject(CartStore);
  readonly festivalService = inject(FestivalService);
  readonly id = input.required<string>();

  readonly eventResource = this.festivalService.getEventResource(this.id);
  readonly editTitle = signal('');
  readonly editDate = signal('');
  readonly editLocation = signal('');
  readonly editDescription = signal('');
  readonly editImage = signal('');
  readonly editSpeakersRaw = signal('');
  readonly saveMessage = signal('');
  readonly saveError = signal('');
  readonly isSaving = signal(false);
  private buyBtnClick$ = new Subject<void>();

  addToCart() {
    this.cartStore.addToCart({ eventId: this.id() });
  }

  saveEvent() {
    const event = this.eventResource.value();
    if (!event) return;

    const title = this.editTitle().trim();
    const date = this.editDate().trim();
    const location = this.editLocation().trim();
    const description = this.editDescription().trim();
    const image = this.editImage().trim();
    const speakers = this.editSpeakersRaw()
      .split(',')
      .map((speaker) => speaker.trim())
      .filter((speaker) => speaker.length > 0);

    if (!title || !date || !location || !description || !image) {
      this.saveError.set('All fields are required.');
      this.saveMessage.set('');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');
    this.saveMessage.set('');
    this.festivalService
      .updateEvent(event.id, { title, date, location, description, image, speakers })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saveMessage.set('Festival event updated.');
          this.eventResource.reload();
        },
        error: () => {
          this.isSaving.set(false);
          this.saveError.set('Could not update festival event.');
        },
      });
  }

  constructor() {
    effect(() => {
      const event = this.eventResource.value();
      if (!event) return;
      this.editTitle.set(event.title);
      this.editDate.set(event.date.slice(0, 16));
      this.editLocation.set(event.location);
      this.editDescription.set(event.description);
      this.editImage.set(event.image);
      this.editSpeakersRaw.set(event.speakers.join(', '));
    });

    this.buyBtnClick$
      .pipe(
        exhaustMap(() => {
          return throwError(() => new Error('Credit Card Declined')).pipe(
            delay(500),
            catchError(() => EMPTY),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
