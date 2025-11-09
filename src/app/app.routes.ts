import { Routes } from '@angular/router';
import { JsonForm } from './features/json-form/json-form';

export const routes: Routes = [
  { path: 'json-form', component: JsonForm },
  { path: '', redirectTo: 'json-form', pathMatch: 'full' },
];
