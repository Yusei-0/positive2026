import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'setup-profile',
    loadComponent: () =>
      import('./pages/setup-profile/setup-profile.page').then(
        (m) => m.SetupProfilePage
      ),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [AuthGuard],
  },
];
