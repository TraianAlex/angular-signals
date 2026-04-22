import { HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventList } from './event-list';
import { EventsService } from '../../core/event.service';
import { AlertifyBrowser } from '../../core/alertify-browser.service';
import { DevFestEvent } from '../../models/event.model';

function makeEvents(count: number): DevFestEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    title: `Event ${i + 1}`,
    date: '2025-06-01T10:00:00.000Z',
    description: 'd',
    location: 'L',
    speakers: [],
    image: '/img.png',
  }));
}

describe('EventList', () => {
  let navigateSpy: ReturnType<typeof vi.fn>;
  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let eventsValue: ReturnType<typeof signal<DevFestEvent[] | undefined>>;
  let eventsHeaders: ReturnType<typeof signal<HttpHeaders | undefined>>;
  let hasValueSig: ReturnType<typeof signal<boolean>>;
  let reloadSpy: ReturnType<typeof vi.fn>;
  let deleteEventSpy: ReturnType<typeof vi.fn>;
  let alertifySuccess: ReturnType<typeof vi.fn>;
  let alertifyError: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    navigateSpy = vi.fn().mockResolvedValue(true);
    queryParamMap$ = new BehaviorSubject(convertToParamMap({}));
    eventsValue = signal(undefined);
    eventsHeaders = signal(undefined);
    hasValueSig = signal(false);
    reloadSpy = vi.fn();
    alertifySuccess = vi.fn();
    alertifyError = vi.fn();
    deleteEventSpy = vi.fn().mockReturnValue({
      subscribe: (handlers: { next?: () => void; error?: () => void }) => {
        handlers.next?.();
        return { unsubscribe: () => {} };
      },
    });

    const eventsResource = {
      value: () => eventsValue(),
      headers: () => eventsHeaders(),
      hasValue: () => hasValueSig(),
      isLoading: () => false,
      error: () => undefined,
      reload: reloadSpy,
    };

    TestBed.configureTestingModule({
      imports: [EventList],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            get snapshot() {
              return { queryParamMap: queryParamMap$.value };
            },
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
        { provide: Router, useValue: { navigate: navigateSpy } },
        {
          provide: EventsService,
          useValue: {
            getEventsResource: () => eventsResource,
            deleteEvent: deleteEventSpy,
          },
        },
        {
          provide: AlertifyBrowser,
          useValue: { success: alertifySuccess, error: alertifyError },
        },
      ],
    });
    await TestBed.compileComponents();
  });

  function setRouteQuery(params: Record<string, string>) {
    queryParamMap$.next(convertToParamMap(params));
  }

  async function mountList() {
    const fixture = TestBed.createComponent(EventList);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.flushEffects();
    return { fixture, component };
  }

  it('computes totalPages from X-Total-Count and pageSize', async () => {
    eventsValue.set(makeEvents(6));
    eventsHeaders.set(new HttpHeaders({ 'X-Total-Count': '20' }));
    hasValueSig.set(true);

    const { component } = await mountList();
    expect(component.totalPages()).toBe(4);
    expect(component.pageNumbers()).toEqual([1, 2, 3, 4]);
  });

  it('goToPage clamps to totalPages', async () => {
    eventsValue.set(makeEvents(6));
    eventsHeaders.set(new HttpHeaders({ 'X-Total-Count': '20' }));
    hasValueSig.set(true);

    const { component } = await mountList();
    component.goToPage(99);
    expect(component.currentPage()).toBe(4);
  });

  it('onSearchQueryChange resets page to 1 when not already on page 1', async () => {
    eventsValue.set(makeEvents(6));
    eventsHeaders.set(new HttpHeaders({ 'X-Total-Count': '20' }));
    hasValueSig.set(true);
    setRouteQuery({ page: '3' });

    const { component } = await mountList();
    expect(component.currentPage()).toBe(3);

    component.onSearchQueryChange('signals');
    expect(component.searchQuery()).toBe('signals');
    expect(component.currentPage()).toBe(1);
  });

  it('prevPage and nextPage move currentPage within bounds', async () => {
    eventsValue.set(makeEvents(6));
    eventsHeaders.set(new HttpHeaders({ 'X-Total-Count': '20' }));
    hasValueSig.set(true);

    const { component } = await mountList();
    component.nextPage();
    expect(component.currentPage()).toBe(2);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('deleteEvent calls service, reloads resource, and shows success when confirmed', async () => {
    eventsValue.set(makeEvents(2));
    hasValueSig.set(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { component } = await mountList();

    component.deleteEvent('1');

    expect(deleteEventSpy).toHaveBeenCalledWith('1');
    expect(reloadSpy).toHaveBeenCalled();
    expect(alertifySuccess).toHaveBeenCalledWith('Event deleted!');

    vi.restoreAllMocks();
  });

  it('deleteEvent does nothing when confirm is cancelled', async () => {
    eventsValue.set(makeEvents(1));
    hasValueSig.set(true);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const { component } = await mountList();
    component.deleteEvent('1');

    expect(deleteEventSpy).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('hasNextPage uses full page when total header is missing', async () => {
    eventsValue.set(makeEvents(6));
    eventsHeaders.set(undefined);
    hasValueSig.set(true);

    const { fixture, component } = await mountList();
    expect(component.hasNextPage()).toBe(true);

    eventsValue.set(makeEvents(3));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(component.hasNextPage()).toBe(false);
  });
});
