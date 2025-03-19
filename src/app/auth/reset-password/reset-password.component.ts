import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/authService';

export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmedPassword = control.get('confirmedPassword')?.value;
    return password === confirmedPassword ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule, MatCardModule, MatInputModule, MatFormFieldModule, FormsModule, MatButtonModule,
    MatIconModule, ReactiveFormsModule, RouterModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})

export class ResetPasswordComponent implements OnInit {
  hidePassword = signal(true);
  hideConfirmedPassword = signal(true);
  resetForm: FormGroup;
  token: string = ''; // ✅ Speichert Token aus URL
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmedPassword: ['', [Validators.required, Validators.minLength(6)]]
      },
      { validators: passwordMatchValidator() }
    );
  }

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    console.log("🔍 Token aus URL:", this.token); // ✅ Debugging
}


  clickEvent(field: 'password' | 'confirmedPassword', event: MouseEvent) {
    if (field === 'password') {
      this.hidePassword.set(!this.hidePassword());
    } else {
      this.hideConfirmedPassword.set(!this.hideConfirmedPassword());
    }
    event.stopPropagation();
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirmedPassword() {
    return this.resetForm.get('confirmedPassword');
  }

  get passwordMismatch() {
    return this.resetForm.hasError('passwordMismatch');
  }

  isFormValid(): boolean {
    return this.resetForm.valid;
  }

  onSubmit() {
    if (this.resetForm.valid) {
        const data = {
            token: this.token, // ✅ Token aus URL
            password: this.resetForm.value.password
        };

        console.log("📡 Sende Anfrage an Backend mit:", data); // ✅ Debugging

        this.authService.resetPassword(data).subscribe({
            next: () => {
                this.successMessage = "✅ Passwort erfolgreich zurückgesetzt! Du wirst weitergeleitet...";
                setTimeout(() => this.router.navigate(['/login']), 3000);
            },
            error: (err) => {
                this.errorMessage = "❌ Fehler beim Zurücksetzen des Passworts. Bitte versuche es erneut.";
                console.error("Fehler beim Zurücksetzen des Passworts:", err);
            }
        });
    }
}

}
