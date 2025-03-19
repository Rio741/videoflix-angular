import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';

@Component({
  selector: 'app-legal-notice',
  imports: [MatIconModule],
  templateUrl: './legal-notice.component.html',
  styleUrl: './legal-notice.component.scss'
})

export class LegalNoticeComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
