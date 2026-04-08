import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiCard } from '../../shared/ui-card';
import { ClickLogger } from '../../shared/directives/click-logger';

@Component({
  selector: 'app-event-card',
  imports: [DatePipe, RouterLink, NgOptimizedImage, UiCard, ClickLogger],
  // COMPOSE BEHAVIOR:
  // Every time <app-event-card> is rendered, Angular will automatically
  // attach a new instance of ClickLogger to it.
  hostDirectives: [
    {
      directive: ClickLogger,
      // We expose the directive's 'eventName' input as 'trackingId'
      // so the parent can do: <app-event-card [trackingId]="..." />
      inputs: ['eventName: trackingId'],
    },
  ],
  template: `
    <app-ui-card>
      <div card-header class="relative h-48 w-full bg-gray-200">
        <img
          [ngSrc]="image()"
          width="500"
          height="200"
          priority
          class="object-cover w-full h-full max-h-full max-w-full"
          alt="Event thumbnail"
        />
      </div>
      <div class="p-6">
        <div class="flex justify-between items-center mt-4">
          <p class="text-sm text-blue-600 font-semibold mb-2">
            {{ (date() | date: 'mediumDate') || 'TBA' }}
          </p>
          @let days = daysUntil();
          @if (days !== null) {
            <div
              class="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm"
            >
              @if (days > 0) {
                In {{ days }} Days
              } @else if (days < 0) {
                Past event
              } @else {
                Happening Now!
              }
            </div>
          }
        </div>
        <h3 class="text-xl font-bold text-gray-800 my-2">{{ title() }}</h3>
        <div class="flex justify-between items-center mt-4">
          <button
            appClickLogger
            [eventName]="'Liked Event'"
            (click)="toggleFavorite()"
            [class.text-red-500]="isFavorite()"
            class="text-gray-400 hover:text-red-500 transition-colors flex gap-2 items-center"
          >
            <span>{{ isFavorite() ? '♥' : '♡' }}</span>
            Like
          </button>
          <button
            (click)="removeEvent()"
            class="text-gray-400 text-sm hover:text-gray-600 cursor-pointer"
          >
            Remove
          </button>
        </div>
      </div>
      <div card-footer class="mt-4 pt-4 border-t border-gray-100 text-right">
        <a
          [routerLink]="['/event', id()]"
          class="text-blue-600 font-medium hover:underline cursor-pointer"
        >
          View Details →
        </a>
      </div>
    </app-ui-card>
  `,
})
export class EventCard {
  readonly id = input.required<string>();
  title = input.required<string>();
  image = input.required<string>();
  date = input<string>();
  initialLike = input(false);

  delete = output<void>();

  isFavorite = linkedSignal(() => this.initialLike());

  daysUntil = computed(() => {
    const eventDate = this.date();
    if (!eventDate) return null;

    const today = new Date();
    const target = new Date(eventDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  });

  toggleFavorite() {
    this.isFavorite.update((val) => !val);
  }

  removeEvent() {
    this.delete.emit();
  }
}
