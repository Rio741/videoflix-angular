import { Routes } from '@angular/router';
import { LandingPageComponent } from './platform/landing-page/landing-page.component';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { SignupComponent } from './auth/signup/signup.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { LegalNoticeComponent } from './legal-pages/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './legal-pages/privacy-policy/privacy-policy.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { DashboardComponent } from './platform/dashboard/dashboard.component';

export const routes: Routes = [
    { path: '', component: LandingPageComponent },
    { path: 'login', component: LoginComponent },
    { path: 'forgetPassword', component: ForgotPasswordComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'reset-password/:token', component: ResetPasswordComponent },
    { path: 'privacyPolicy', component: PrivacyPolicyComponent },
    { path: 'legalNotice', component: LegalNoticeComponent },
    { path: 'home', component: DashboardComponent },
    { path: 'verify-email/:token', component: VerifyEmailComponent }, 
];

