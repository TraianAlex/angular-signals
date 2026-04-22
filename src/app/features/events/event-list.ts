import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { EventCard } from './event-card';
import { SearchBar } from './search-bar';
import { AlertifyBrowser } from '../../core/alertify-browser.service';
import { EventsService } from '../../core/event.service';

@Component({
  selector: 'app-event-list',
  imports: [EventCard, SearchBar],
  templateUrl: './event-list.html',
})
export class EventList {
  readonly eventsService = inject(EventsService);
  private readonly alertify = inject(AlertifyBrowser);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly searchQuery = signal('');
  readonly searchQueryText = computed(() => this.searchQuery());
  readonly currentPage = signal(1);
  readonly pageSize = signal(6);

  private readonly queryParams = toSignal(
    this.route.queryParamMap.pipe(
      map((m) => ({
        page: this.parsePageParam(m.get('page')),
        q: m.get('q') ?? '',
      })),
    ),
    {
      initialValue: {
        page: this.parsePageParam(this.route.snapshot.queryParamMap.get('page')),
        q: this.route.snapshot.queryParamMap.get('q') ?? '',
      },
    },
  );

  readonly events = this.eventsService.getEventsResource({
    query: this.searchQueryText,
    page: this.currentPage,
    pageSize: this.pageSize,
  });

  readonly totalCountFromHeader = computed((): number | null => {
    const headers = this.events.headers();
    if (!headers) return null;
    const raw = headers.get('X-Total-Count') ?? headers.get('x-total-count');
    if (raw == null || raw === '') return null;
    const n = Number.parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  });

  readonly pageItems = computed(() => this.events.value() ?? []);

  readonly hasPrevPage = computed(() => this.currentPage() > 1);

  readonly hasNextPage = computed(() => {
    const total = this.totalCountFromHeader();
    const page = this.currentPage();
    const size = this.pageSize();
    const items = this.pageItems();
    if (total != null && total > 0) {
      return page * size < total;
    }
    return items.length === size;
  });

  readonly showPagination = computed(
    () =>
      this.events.hasValue() &&
      this.pageItems().length > 0 &&
      (this.hasPrevPage() || this.hasNextPage()),
  );

  readonly totalPages = computed(() => {
    const total = this.totalCountFromHeader();
    const size = this.pageSize();
    if (total != null && total > 0) {
      return Math.max(1, Math.ceil(total / size));
    }
    const page = this.currentPage();
    return Math.max(page, this.hasNextPage() ? page + 1 : page);
  });

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  constructor() {
    // URL → state (only `queryParams` is reactive; avoid reading page/search in the outer effect).
    effect(() => {
      const { page, q } = this.queryParams();
      untracked(() => {
        if (this.currentPage() === page && this.searchQuery() === q) {
          return;
        }
        this.currentPage.set(page);
        this.searchQuery.set(q);
      });
    });

    // state → URL (`queryParams` read in untracked so router updates do not re-trigger incorrectly).
    effect(() => {
      const page = this.currentPage();
      const q = this.searchQuery();
      const { page: urlPage, q: urlQ } = untracked(() => this.queryParams());
      if (page === urlPage && q === urlQ) {
        return;
      }
      const qp: Record<string, string | number> = {};
      if (page > 1) {
        qp['page'] = page;
      }
      if (q) {
        qp['q'] = q;
      }
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: qp,
        replaceUrl: true,
      });
    });

    effect(() => {
      const max = this.totalPages();
      const page = this.currentPage();
      if (page > max) {
        untracked(() => this.currentPage.set(max));
      }
    });
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    if (this.currentPage() !== 1) {
      this.currentPage.set(1);
    }
  }

  private parsePageParam(raw: string | null): number {
    const n = Number.parseInt(raw ?? '1', 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }

  goToPage(page: number): void {
    const max = this.totalPages();
    this.currentPage.set(Math.min(Math.max(1, page), max));
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  deleteEvent(id: string) {
    if (!confirm('Are you sure?')) return;
    this.eventsService.deleteEvent(id).subscribe({
      next: () => {
        this.alertify.success('Event deleted!');
        this.events.reload();
      },
      error: () => {
        this.alertify.error('Could not delete event');
      },
    });
  }
}
