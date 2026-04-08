import { TestBed } from '@angular/core/testing';
import { EventDetails } from './event-details';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DeferBlockState } from '@angular/core/testing';

import { API_URL } from '../../core/tokens';

describe('EventDetails', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [EventDetails],
      providers: [
        { provide: API_URL, useValue: 'http://localhost:3000' },
        provideRouter([]),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EventDetails);
    const httpMock = TestBed.inject(HttpTestingController);

    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();

    return { fixture, httpMock };
  }

  it('renders map only when deferred block completes', async () => {
    const { fixture, httpMock } = await setup();

    // 1. Handle CartStore initialization (it loads tickets)
    const ticketsReq = httpMock.expectOne('http://localhost:3000/tickets');
    ticketsReq.flush([]);

    // 2. Handle EventDetails data fetching
    const req = httpMock.expectOne('http://localhost:3000/events/1');
    req.flush({
      id: '1',
      title: 'Test Event',
      date: new Date().toISOString(),
      location: 'Test Location',
      description: 'Test Description',
      speakers: [],
      image: 'test.jpg',
    });

    console.log('EventDetails data fetched');

    fixture.detectChanges(); // Trigger CD after data flush
    await fixture.whenStable(); // Wait for signals/effects

    console.log('before defer blocks');

    // 1. Get all defer blocks
    const deferBlocks = await fixture.getDeferBlocks();
    const mapBlock = deferBlocks[0];

    // Switch to Venue tab to render the defer block placeholder
    const tabs = fixture.nativeElement.querySelectorAll('button');
    // Helper to find tab by text content (trimming whitespace)
    const venueTab = Array.from(tabs).find(
      (t: any) => t.textContent.trim() === 'Venue',
    ) as HTMLElement;

    if (!venueTab) {
      // Debug info
      const labels = Array.from(tabs).map((t: any) => t.textContent.trim());
      throw new Error(`Venue tab not found. Available tabs: ${labels.join(', ')}`);
    }

    console.log('venue tab found and clicking');

    venueTab.click();
    fixture.detectChanges(); // Trigger CD after click
    await fixture.whenStable();

    console.log('placeholder state verified');

    // 2. Verify Placeholder State
    expect(fixture.nativeElement.textContent).toContain('Loading Map...');
    expect(fixture.nativeElement.textContent).not.toContain('Heavy Map Loaded');

    // 3. Force Render (Simulate Viewport Entry)
    await mapBlock.render(DeferBlockState.Complete);

    console.log('defer block rendered');

    // 4. Verify Final State
    // Note: The actual content is an image with src="/images/venue-map.png"
    // The placeholder text "Heavy Map Loaded" from the instructions might be different from actual implementation
    // Let's check for the image presence or the absence of "Loading Map..."
    expect(fixture.nativeElement.textContent).not.toContain('Loading Map...');
    const img = fixture.nativeElement.querySelector('img[src="/images/venue-map.png"]');
    expect(img).toBeTruthy();
  });
});
