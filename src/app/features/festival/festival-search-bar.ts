import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-festival-search-bar',
  imports: [FormsModule],
  templateUrl: './festival-search-bar.html',
})
export class FestivalSearchBar {
  query = model<string>('');
}
