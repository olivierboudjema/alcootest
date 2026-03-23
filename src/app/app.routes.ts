import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AddDrinkComponent } from './components/add-drink/add-drink.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
    },
    {
        path: 'add-drink',
        component: AddDrinkComponent,
    },
    {
        path: '**',
        redirectTo: '',
    },
];
