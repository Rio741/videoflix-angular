import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  imports: [MatIconModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})

export class PrivacyPolicyComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
