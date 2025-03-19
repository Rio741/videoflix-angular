import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/authService';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-verify-email',
  imports: [MatIconModule, CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})

export class VerifyEmailComponent implements OnInit {
  message: string = 'Verifiziere deine E-Mail...';
  success: boolean = false; // ✅ Zustand für das Icon

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    if (token) {
      this.authService.verifyEmail(token).subscribe({
        next: (res) => {
          console.log('✅ Verifizierung erfolgreich:', res);
          this.message = "E-Mail erfolgreich bestätigt! Du kannst dich jetzt einloggen.";
          setTimeout(() => this.router.navigate(['/login']), 3000); // Automatische Weiterleitung
        },
        error: (err) => {
          console.error('❌ Verifizierung fehlgeschlagen:', err);
          this.message = "Verifizierung fehlgeschlagen. Dein Link ist möglicherweise ungültig oder abgelaufen.";
        }
      });
    } else {
      this.message = "Ungültige Verifizierungsanfrage!";
    }
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
