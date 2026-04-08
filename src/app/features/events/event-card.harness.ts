import { ComponentHarness } from '@angular/cdk/testing';

export class EventCardHarness extends ComponentHarness {
  static hostSelector = 'app-event-card';

  // Locators
  protected getTitleElement = this.locatorFor('h3');
  protected getLikeButton = this.locatorFor('button');

  async getTitleText(): Promise<string> {
    const title = await this.getTitleElement();
    return title.text();
  }

  async clickLike(): Promise<void> {
    const btn = await this.getLikeButton();
    return btn.click();
  }

  async getLikeButtonText(): Promise<string> {
    const btn = await this.getLikeButton();
    return btn.text();
  }
}
