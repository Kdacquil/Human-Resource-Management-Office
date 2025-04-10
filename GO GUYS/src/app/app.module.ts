import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { RouterModule } from '@angular/router';
import { environment } from '../environments/environment';
import { EmployeesService } from './services/employees.service';
import { EvaluationService } from './services/evaluation.service';
import { OffboardService } from './services/offboard.service';
import { ReactiveFormsModule } from '@angular/forms';
import { EmailService } from './services/email.service'; // ✅ Import Email Service
import { HttpClientModule } from '@angular/common/http'; // ✅ Import this



@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,




  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    RouterModule,
    HttpClientModule,
  ],
  providers: [EmployeesService, OffboardService, EvaluationService, EmailService],
  bootstrap: [AppComponent, ReactiveFormsModule]
})
export class AppModule { }
