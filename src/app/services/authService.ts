import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api/auth/';

  constructor(private http: HttpClient) {}

  signup(user: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}registration/`, user);
  }

  login(user: { email: string; password: string }, rememberMe: boolean): Observable<any> {
    return new Observable(observer => {
      this.http.post(`${this.apiUrl}login/`, user).subscribe({
        next: (response: any) => {
          console.log('Login erfolgreich:', response);
          this.storeToken(response.token, rememberMe);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Login fehlgeschlagen:', error);
          observer.error(error);
        }
      });
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    console.log('Logout erfolgreich, Token entfernt.');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  private storeToken(token: string, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}verify-email/${token}`);
  }  
 
  sendPasswordResetEmail(emailData: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}password-reset/`, emailData);
  }

  resetPassword(data: { token: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}password-reset-confirm/`, data);
  }
}
