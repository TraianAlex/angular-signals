import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiCard } from '../../shared/ui-card';
import { ClickLogger } from '../../shared/directives/click-logger';
import { daysUntil } from '../../shared/utils';

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
  templateUrl: './event-card.html',
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
    return daysUntil(this.date);
  });

  toggleFavorite() {
    this.isFavorite.update((val) => !val);
  }

  removeEvent() {
    this.delete.emit();
  }
}
