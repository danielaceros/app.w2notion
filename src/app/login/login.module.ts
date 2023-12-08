import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IonicModule } from '@ionic/angular';
import { LoginPageRoutingModule } from './login-routing.module';
import { LoginPage } from './login.page';
import { MaterialModule } from '../material.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgOtpInputModule } from 'ng-otp-input';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    LoginPageRoutingModule,
    MaterialModule,
    NgSelectModule,
    NgOtpInputModule,
  ],
  declarations: [LoginPage]
})
export class LoginPageModule {}
