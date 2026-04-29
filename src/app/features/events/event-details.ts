import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventsService } from '../../core/event.service';
import { TabGroup } from '../../shared/tabs/tab-group';
import { Tab } from '../../shared/tabs/tab';
import { catchError, delay, EMPTY, exhaustMap, Subject, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartStore } from '../../core/cart.store';

@Component({
  selector: 'app-event-details',
  imports: [CommonModule, RouterLink, DatePipe, NgOptimizedImage, TabGroup, Tab],
  templateUrl: './event-details.html',
})
export class EventDetails {
  // readonly cartService = inject(CartService);
  readonly cartStore = inject(CartStore);
  readonly eventService = inject(EventsService);
  // activatedRoute = inject(ActivatedRoute);
  // readonly id = toSignal(this.activatedRoute.paramMap)()?.get('id');
  // readonly bookStore = inject(BookStore);
  readonly id = input.required<string>();

  readonly eventResource = this.eventService.getEventResource(this.id);

  addToCart() {
    // this.cartService.addTicket(this.id());
    // this.buyBtnClick$.next();
    this.cartStore.addToCart({ eventId: this.id() });
  }

  private buyBtnClick$ = new Subject<void>();

  constructor() {
    // this.bookStore.books();
    // this.bookStore.freeBooks();
    // this.bookStore.totalBooks();
    // this.bookStore.myFeature();
    // this.bookStore.plus();
    // this.bookStore.addBook({ id: '1', title: 'Book 1', price: 10 });

    this.buyBtnClick$
      .pipe(
        exhaustMap(() => {
          // console.log('🔄 Transaction Started...');
          // this.cartService.addTicket(this.id());
          console.log('🔄 Trying to buy...');
          // Simulate an API Error
          return throwError(() => new Error('Credit Card Declined')).pipe(
            delay(500),
            catchError((err) => {
              console.warn('⚠️ Handled Error:', err.message);
              // Return a safe value (Observable) to keep the outer stream going
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(), // Auto-unsubscribe
      )
      .subscribe({
        next: (res) => console.log('✅', res),
        error: (err) => console.error('☠️ Stream Died:', err),
      });
  }
}
