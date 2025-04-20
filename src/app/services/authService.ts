import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://videoflix.rio-stenger.de/api/auth/';

  constructor(private http: HttpClient) {}

  signup(user: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}registration/`, user);
  }

  login(user: { email: string; password: string }, rememberMe: boolean): Observable<any> {
    return new Observable(observer => {
      this.http.post(`${this.apiUrl}login/`, user).subscribe({
        next: (response: any) => {
          this.storeToken(response.token, rememberMe);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}verify-email/${token}`);
  }

  resendConfirmationEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}resend-confirmation-email/`, { email });
  }

  sendPasswordResetEmail(emailData: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}password-reset/`, emailData);
  }

  resetPassword(data: { token: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}password-reset-confirm/`, data);
  }

  private storeToken(token: string, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
  }
}
