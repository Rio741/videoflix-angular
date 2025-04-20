import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/authService';

@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule, MatCardModule, MatInputModule, MatFormFieldModule,
    FormsModule, MatCheckboxModule, MatButtonModule, MatIconModule,
    ReactiveFormsModule, RouterModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  loginForm: FormGroup;
  emailSent = false;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  isFormValid(): boolean {
    return this.loginForm.valid;
  }

  sendEmail() {
    if (this.loginForm.valid) {
      const emailData = this.loginForm.value;
      this.authService.sendPasswordResetEmail(emailData).subscribe({
        next: () => {
          this.emailSent = true;
          this.errorMessage = null;
        },
        error: (err) => {
          if (err.status === 0) {
            this.errorMessage = "🔌 Verbindungsfehler! Bitte überprüfe deine Internetverbindung.";
          } else if (err.status === 400) {
            this.errorMessage = "⚠️ Diese E-Mail existiert nicht im System.";
          } else if (err.status === 500) {
            this.errorMessage = "🚨 Serverfehler! Bitte versuche es später erneut.";
          } else {
            this.errorMessage = "Fehler beim Versenden der E-Mail. Bitte versuche es erneut.";
          }
        },
      });
    }
  }

  resendEmail() {
    this.sendEmail();
  }

  get email() {
    return this.loginForm.get('email');
  }
}
