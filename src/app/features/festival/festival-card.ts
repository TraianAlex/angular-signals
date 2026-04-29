import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiCard } from '../../shared/ui-card';
import { ClickLogger } from '../../shared/directives/click-logger';
import { daysUntil } from '../../shared/utils';

@Component({
  selector: 'app-festival-card',
  imports: [DatePipe, RouterLink, NgOptimizedImage, UiCard, ClickLogger],
  hostDirectives: [
    {
      directive: ClickLogger,
      inputs: ['eventName: trackingId'],
    },
  ],
  templateUrl: './festival-card.html',
})
export class FestivalCard {
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
