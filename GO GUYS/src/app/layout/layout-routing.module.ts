import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EmployeeInfoComponent } from './pages/dashboard/employee-info/employee-info.component';

const routes: Routes = [
  // {path: '', redirectTo: 'home', pathMatch: 'full'},
  {
    path: '',
    component: LayoutComponent,
    children: [
      {path: 'employee-info', component: EmployeeInfoComponent},
      {path:'dashboard', component: DashboardComponent, loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule)},
    ]

  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }
