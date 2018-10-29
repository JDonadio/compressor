import { Routes, RouterModule } from '@angular/router';

// PAGES
import { HomeComponent } from 'src/pages/home/home.component';

export const routes = [
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: HomeComponent },
];

