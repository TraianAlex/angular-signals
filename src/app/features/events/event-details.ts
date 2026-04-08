import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventsService } from '../../core/event.service';
import { TabGroup } from '../../shared/tabs/tab-group';
import { Tab } from '../../shared/tabs/tab';
import { catchError, delay, EMPTY, exhaustMap, Subject, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BookStore } from '../../core/todo.store';
import { CartStore } from '../../core/cart.store';

@Component({
  selector: 'app-event-details',
  imports: [CommonModule, RouterLink, DatePipe, NgOptimizedImage, TabGroup, Tab],
  template: `
    <div class="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto min-h-[600px]">
      <a routerLink="/" class="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Events
      </a>
      @if (eventResource.isLoading()) {
        <div class="animate-pulse h-64 bg-gray-100 rounded-lg"></div>
      }
      @if (eventResource.error()) {
        <div class="text-red-600 p-4 bg-red-50 rounded">Event not found.</div>
      }
      @if (eventResource.hasValue()) {
        @let event = eventResource.value()!;
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="md:col-span-2 space-y-4">
            <h1 class="text-3xl font-bold mb-4">{{ event.title }}</h1>
            <p class="text-gray-500 text-lg">
              {{ event.date | date: 'fullDate' }} • {{ event.location }}
            </p>
            <app-tab-group>
              <app-tab label="Overview">
                <p class="text-gray-700 leading-relaxed text-lg">{{ event.description }}</p>
              </app-tab>
              <app-tab label="Venue">
                <p class="mb-4 text-gray-600">Location: {{ event.location }}</p>
                <!--
@defer (hydrate on viewport)
SSR Behavior: The SERVER renders the @placeholder content (or the main content if compatible).
Hydration Behavior: The browser downloads the JS for this block ONLY when it enters the viewport.
-->
                @defer (hydrate on viewport) {
                  <div class="h-140 bg-gray-200 rounded mb-4 overflow-hidden relative">
                    <img
                      [ngSrc]="'/images/venue-map.png'"
                      width="500"
                      height="600"
                      class="w-full h-full object-cover"
                    />
                  </div>
                } @placeholder {
                  <!-- Rendered instantly on Server, visible immediately -->
                  <div class="h-64 bg-gray-100 flex items-center justify-center">
                    Loading Map...
                  </div>
                }
              </app-tab>
              <app-tab label="Speakers">
                @if (event.speakers.length > 0) {
                  <ul class="space-y-3">
                    @for (speaker of event.speakers; track speaker) {
                      <li class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div
                          class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold"
                        >
                          {{ speaker.charAt(0) }}
                        </div>
                        <span class="text-gray-700 font-medium">{{ speaker }}</span>
                      </li>
                    }
                  </ul>
                } @else {
                  <div class="p-4 bg-yellow-50 text-yellow-800 rounded">
                    Speaker list coming soon.
                  </div>
                }
              </app-tab>
            </app-tab-group>
          </div>
          <div class="bg-gray-50 p-6 rounded-xl h-fit border border-gray-100">
            <div class="h-48 bg-gray-200 rounded mb-4 overflow-hidden">
              <img
                [ngSrc]="event.image"
                width="200"
                height="200"
                priority
                class="w-full h-full object-cover"
                alt="Event image"
              />
            </div>
            <!-- 
  hydrate on interaction:
  The button is visible (SSR), but the Angular Code to handle the click (addToCart)
  is not downloaded until the user hovers/clicks.
  withIncrementalHydration() ensures that incremental hydration is enabled and event replay comes as part of it. If they click FAST, the click is recorded and replayed once the code downloads.
-->
            @defer (hydrate on interaction) {
              <button
                (click)="addToCart()"
                [disabled]="cartStore.isPending()"
                class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-wait"
              >
                @if (cartStore.isPending()) {
                  Syncing...
                } @else {
                  Buy Ticket
                }
              </button>
            } @placeholder {
              <button class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold opacity-90">
                Buy Ticket
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class EventDetails {
  // readonly cartService = inject(CartService);
  // Replace service with Store
  readonly cartStore = inject(CartStore);
  readonly eventService = inject(EventsService);
  // activatedRoute = inject(ActivatedRoute);
  // readonly id = toSignal(this.activatedRoute.paramMap)()?.get('id');
  readonly bookStore = inject(BookStore);
  readonly id = input.required<string>();

  readonly eventResource = this.eventService.getEventResource(this.id);

  addToCart() {
    // this.cartService.addTicket(this.id());
    // this.buyBtnClick$.next();
    // Call the store method
    this.cartStore.addToCart({ eventId: this.id() });
  }

  private buyBtnClick$ = new Subject<void>();

  constructor() {
    this.bookStore.books();
    this.bookStore.freeBooks();
    this.bookStore.totalBooks();
    this.bookStore.myFeature();
    this.bookStore.plus();
    this.bookStore.addBook({ id: '1', title: 'Book 1', price: 10 });

    // 2. Setup the Pipeline
    this.buyBtnClick$
      .pipe(
        exhaustMap(() => {
          // console.log('🔄 Transaction Started...');
          // Simulate a 2-second backend request
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
