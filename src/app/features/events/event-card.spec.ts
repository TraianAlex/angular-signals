import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { EventCard } from './event-card';
import { provideRouter } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventCardHarness } from './event-card.harness';

// Patch PointerEvent and MouseEvent to avoid JSDOM error with Angular CDK
// JSDOM throws "member view is not of type Window" if view is not strictly window
if (typeof window !== 'undefined') {
  const patchEvent = (EventClass: any) => {
    const Original = EventClass;
    return class extends Original {
      constructor(type: string, eventInitDict: any = {}) {
        if (eventInitDict && eventInitDict.view) {
          // @ts-ignore
          eventInitDict.view = null;
        }
        super(type, eventInitDict);
      }
    };
  };

  if (window.PointerEvent) {
    (window as any).PointerEvent = patchEvent(window.PointerEvent);
  }
  if (window.MouseEvent) {
    (window as any).MouseEvent = patchEvent(window.MouseEvent);
  }
}

describe('EventCard', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [EventCard],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EventCard);
    const component = fixture.componentInstance;

    // Set Default Required Inputs
    fixture.componentRef.setInput('title', 'Test Event');
    fixture.componentRef.setInput('image', 'img.jpg');
    fixture.componentRef.setInput('id', '1');

    return { fixture, component };
  }

  it('toggles favorite state on click', async () => {
    const { fixture, component } = await setup();

    // Assert Initial State
    expect(component.isFavorite()).toBe(false);

    // Act
    await fixture.whenStable(); // Wait for initial render

    // Find the button that contains "Like"
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const heartButton = Array.from(buttons).find((btn: any) =>
      btn.textContent.includes('Like'),
    ) as HTMLElement;

    if (!heartButton) throw new Error('Like button not found');

    heartButton.click();
    await fixture.whenStable(); // Wait for click update

    expect(heartButton.textContent).toContain('♥');
  });

  it('calculates computed daysUntil correctly', async () => {
    const { fixture, component } = await setup();

    // Set a date 5 days in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    fixture.componentRef.setInput('date', futureDate.toISOString());

    // Note: Computed signals are lazy and synchronous, so reading them
    // triggers recalculation. No flushEffects() needed!

    expect(component.daysUntil()).toBe(5);
  });

  it('toggles favorite using Harness interaction', async () => {
    const { fixture } = await setup();

    // 1. Create Harness Loader from fixture
    // Since the fixture IS the component, we use harnessForFixture
    const card = await TestbedHarnessEnvironment.harnessForFixture(fixture, EventCardHarness);

    // 2. Interact via high-level API
    expect(await card.getLikeButtonText()).toContain('♡');

    await card.clickLike();

    expect(await card.getLikeButtonText()).toContain('♥');
  });
});
