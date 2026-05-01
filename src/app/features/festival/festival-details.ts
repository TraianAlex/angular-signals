import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, delay, EMPTY, exhaustMap, Subject, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartStore } from '../../core/cart.store';
import { FestivalService } from '../../core/festival.service';
import { DevFestEvent } from '../../models/event.model';
import { TabGroup } from '../../shared/tabs/tab-group';
import { Tab } from '../../shared/tabs/tab';
import { FestivalEventForm, FestivalEventFormValue } from './festival-event-form';
import { AlertifyBrowser } from '../../core/alertify-browser.service';

@Component({
  selector: 'app-festival-details',
  imports: [CommonModule, RouterLink, DatePipe, NgOptimizedImage, TabGroup, Tab, FestivalEventForm],
  templateUrl: './festival-details.html',
})
export class FestivalDetails {
  readonly cartStore = inject(CartStore);
  readonly festivalService = inject(FestivalService);
  readonly router = inject(Router);
  readonly alertify = inject(AlertifyBrowser);

  readonly id = input.required<string>();

  readonly eventResource = this.festivalService.getEventResource(this.id);
  readonly saveMessage = signal('');
  private lastHandledUpdateSuccessSeq = 0;


  private buyBtnClick$ = new Subject<void>();

  readonly editInitialValue = computed<FestivalEventFormValue>(() => {
    const event = this.eventResource.value();
    return this.toFormValue(event);
  });

  addToCart() {
    this.cartStore.addToCart({ eventId: this.id() });
  }

  // saveEvent(eventData: FestivalEventFormValue) {
  //   const event = this.eventResource.value();
  //   if (!event) return;

  //   this.isSaving.set(true);
  //   this.saveError.set('');
  //   this.saveMessage.set('');
  //   this.festivalService
  //     .updateEvent(event.id, eventData)
  //     .subscribe({
  //       next: () => {
  //         this.isSaving.set(false);
  //         this.saveMessage.set('Festival event updated.');
  //         this.eventResource.reload();
  //       },
  //       error: () => {
  //         this.isSaving.set(false);
  //         this.saveError.set('Could not update festival event.');
  //       },
  //     });
  // }

  saveEvent(eventData: FestivalEventFormValue) {
    this.saveMessage.set('');
    this.festivalService.updateEvent({ id: this.id(), event: eventData });
  }

  private toFormValue(event: DevFestEvent | undefined): FestivalEventFormValue {
    if (!event) {
      return {
        title: '',
        description: '',
        date: new Date().toISOString().slice(0, 16),
        location: '',
        speakers: [],
        image: '/images/event4.png',
      };
    }
    return {
      title: event.title,
      date: event.date.slice(0, 16),
      location: event.location,
      description: event.description,
      image: event.image,
      speakers: [...event.speakers],
    };
  }

  constructor() {
    this.lastHandledUpdateSuccessSeq = this.festivalService.updateSuccessSeq();
    effect(() => {
      const seq = this.festivalService.updateSuccessSeq();
      if (seq <= this.lastHandledUpdateSuccessSeq) {
        return;
      }
      untracked(() => {
        this.lastHandledUpdateSuccessSeq = seq;
        this.saveMessage.set('Festival event updated.');
        this.eventResource.reload();
      });
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
