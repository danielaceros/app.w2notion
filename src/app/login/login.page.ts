import { Component, Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Auth, RecaptchaVerifier, GoogleAuthProvider, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPhoneNumber, signInWithPopup } from "@angular/fire/auth";
import { 
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormBuilder, 
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { countries } from 'src/app/countries.module'
import { countryCodeEmoji, emojiCountryCode } from 'country-code-emoji';
import { Errors } from "src/app/errors.page"
import { ViewChildren, ElementRef } from '@angular/core';
import { otpConfig } from 'src/config/otp.config'
import { delay } from 'rxjs';

type Country = {
  nombre: string;
  name: string;
  nom: string;
  iso2: string;
  iso3: string;
  phone_code: string;
};

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})

export class LoginPage implements OnInit {
  email: string = "";
  password: string = "";
  auth = getAuth();
  myForm:FormGroup;
  captcha: RecaptchaVerifier;
  code: string;
  selectedCountry: string = ""; 
  phoneNumber: string = '';
  countries: Country[] = countries
  results: any;
  data: any;
  isCharging: boolean = false;
  otpConfig: any = otpConfig;
  isModalOpen: boolean = false;
  otp: string = "";
  isOTP6: boolean = false;
  countryCodeEmoji: string;
  isButtonDisabled: boolean = false;
  countdown: number = 60;
  constructor(public http: HttpClient, public formBuilder: FormBuilder, private alertController: AlertController, private router: Router) {
    this.myForm = this.formBuilder.group({
      phone: ['', Validators.compose([Validators.pattern('^[0-9]*$'),  Validators.required])],
    })
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.router.navigate(['/home'])
        
      } else {
      }
    })
  }
  async onOtpChange(event: any) {
    this.otp = event;
  }
  async checkOTP(){
    return this.otp.length
  }
  async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
  async getOTP(){
    return new Promise<void>((resolve, reject) => {
      const checkOtpInterval = setInterval(() => {
        if (this.isOtpInputComplete()) {
          clearInterval(checkOtpInterval);
          resolve();
        }
      }, 100); // Intervalo de comprobación cada 100 ms
    });
  }
  isOtpInputComplete(): boolean {
    if(this.otp.length > 5){
      return true;
    }
    else{
      return false;
    }
  }
  customSearchFn(term: string, item: any) {
    term = term.toLocaleLowerCase();
    return item.phone_code.toLocaleLowerCase().indexOf(term) > -1 || item.nombre.toLocaleLowerCase().indexOf(term) > -1;
   }
  getcountryemoji(code: string){
    this.countryCodeEmoji = countryCodeEmoji(code);
    return this.countryCodeEmoji;
  }
  ngOnInit() {
    
  }
  async onSubmit() {
    this.isCharging = true;
    const telefonoCompleto = `+${this.selectedCountry} ${this.phoneNumber}`;
    console.log(this.selectedCountry)
    this.loginUserWithPhone(telefonoCompleto)
  }
  async presentAlertCodeVerification(number:string) {
    const alert = await this.alertController.create({
      header: 'Code Verification',
      message: "A code was sent to " + number,
      inputs: [{
        type: "text",
        name: "code",
        placeholder: "Code"
      }],
      buttons: [{
        text: "Ok",
        handler: (alertData) => {
          this.code = alertData.code;
        }
      }],
    });
    await alert.present();
    await alert.onDidDismiss();
  }
  async resendOTP(phonenumber: string){
    const captcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {'size': 'invisible'})
    const user = await signInWithPhoneNumber(this.auth, phonenumber, captcha)
    .then(async (confirmationResult) => {
      this.isModalOpen = true;
      this.getOTP().then( () => {
        this.isModalOpen = false;
        confirmationResult.confirm(this.otp).then( (result) => {
          this.isCharging = false;
          const user = result.user;
        }).catch((error) => {
          this.isModalOpen = false;
          this.isCharging = false;
          new Errors(this.alertController).showErrors(error.code);
        });
      })
    }).catch((error) => {
      this.isModalOpen = false;
      this.isCharging = false;
      new Errors(this.alertController).showErrors(error.code);
      
    });
  }
  async OTPRefreshButton() {
    this.isButtonDisabled = true;
    setTimeout(() => {
      this.isButtonDisabled = false;
      this.countdown = 60; // Reiniciar el contador
    }, 60000); // 60 segundos
    this.startCountdown();
  }
  private startCountdown() {
    const interval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(interval);
      }
    }, 1000); // Actualizar cada segundo
  }
  async loginUserWithPhone(phonenumber: string){
    if(this.myForm.valid){
    const captcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {'size': 'invisible'})
    const user = await signInWithPhoneNumber(this.auth, phonenumber, captcha)
    .then(async (confirmationResult) => {
      this.isModalOpen = true;
      this.getOTP().then( () => {
        this.isModalOpen = false;
        confirmationResult.confirm(this.otp).then( (result) => {
          this.isCharging = false;
          const user = result.user;
        }).catch((error) => {
          this.isModalOpen = false;
          this.isCharging = false;
          new Errors(this.alertController).showErrors(error.code);
        });
      })
    }).catch((error) => {
      this.isModalOpen = false;
      this.isCharging = false;
      new Errors(this.alertController).showErrors(error.code);
      
    });
  }else{
    new Errors(this.alertController).showErrors("auth/invalid-phone-number")
  }
}
  handleRefresh(event: { target: { complete: () => void; }; }) {
    window.location.reload();
  }
  doRefresh() {
    window.location.reload();
  }
}
