import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { LoginComponent } from './login/login.component';
import { FormComponent } from './form/form.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {EncryptService} from '../services/encryption.service';
import {AuthService} from '../services/auth.service';
import {IndexedDbService} from '../services/indexed-db.service';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    FormComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('/service.worker.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:30000',
    }),
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [EncryptService, AuthService, IndexedDbService],
  bootstrap: [AppComponent]
})
export class AppModule { }
