import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu.page').then((m) => m.MenuPage),
  },
  {
    path: 'hotdog',
    loadComponent: () =>
      import('./pages/hotdog.page').then((m) => m.HotdogPage),
  },
  {
    path: 'demo',
    loadComponent: () => import('./pages/meet.page').then((m) => m.MeetPage),
  },
  {
    path: '',
    redirectTo: 'menu',
    pathMatch: 'full',
  },
];
