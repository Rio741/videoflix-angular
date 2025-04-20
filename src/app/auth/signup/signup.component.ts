import { Component, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  selector: 'app-signup',
  imports: [MatCardModule, MatInputModule, MatFormFieldModule, FormsModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, ReactiveFormsModule, RouterModule, MatError, CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})

export class SignupComponent {
  hidePassword = signal(true);
  hideConfirmedPassword = signal(true);
  emailSent = false;
  errorMessage: string | null = null;
  isSubmitting = false;
  statusMessage: string | null = null;

  signupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.signupForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmedPassword: ['', [Validators.required, Validators.minLength(6)]]
      },
      { validators: passwordMatchValidator() }
    );

    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.signupForm.patchValue({ email: params['email'] });
      }
    });
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get confirmedPassword() {
    return this.signupForm.get('confirmedPassword');
  }

  get passwordMismatch() {
    return this.signupForm.hasError('passwordMismatch');
  }

  isFormValid(): boolean {
    return this.signupForm.valid;
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const credentials = this.signupForm.value;
      this.isSubmitting = true;

      this.authService.signup(credentials).subscribe({
        next: () => {
          this.emailSent = true;
          this.isSubmitting = false;
        },
        error: () => {
          this.errorMessage = "Registrierung fehlgeschlagen. Bitte überprüfe deine Eingaben.";
          this.isSubmitting = false;
        }
      });
    }
  }

  resendEmail() {
    if (this.email?.value) {
      this.isSubmitting = true;

      this.authService.resendConfirmationEmail(this.email.value).subscribe({
        next: () => {
          this.statusMessage = "✅ Bestätigungs-E-Mail wurde erneut gesendet.";
          this.isSubmitting = false;

          setTimeout(() => {
            this.statusMessage = null;
          }, 3000);
        },
        error: () => {
          this.statusMessage = "❌ Fehler beim erneuten Senden der E-Mail.";
          this.isSubmitting = false;

          setTimeout(() => {
            this.statusMessage = null;
          }, 3000);
        }
      });
    }
  }

  clickEvent(field: 'password' | 'confirmedPassword', event: MouseEvent) {
    if (field === 'password') {
      this.hidePassword.set(!this.hidePassword());
    } else {
      this.hideConfirmedPassword.set(!this.hideConfirmedPassword());
    }
    event.stopPropagation();
  }
}
