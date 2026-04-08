import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';

// Initialize the Angular testing environment
try {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch (e) {
  // Ignore if already initialized
}

// Global setup for all tests
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(), // Enable zoneless mode for all tests
    ],
  });
});
