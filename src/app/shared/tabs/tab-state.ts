import { Injectable, signal } from '@angular/core';

@Injectable() // No providedIn: 'root'!
export class TabState {
  // Tracks the label of the currently active tab
  readonly activeTab = signal<string>('');

  activate(label: string) {
    this.activeTab.set(label);
  }
}
