import { ChangeDetectionStrategy, Component, Injectable, OnInit, Pipe, PipeTransform } from '@angular/core';
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
import { countryCodeEmoji, emojiCountryCode } from 'country-code-emoji';
import { Errors } from "src/app/errors.page"
import { ViewChildren, ElementRef } from '@angular/core';
import { otpConfig } from 'src/config/otp.config'
import { Observable, delay } from 'rxjs';
import { countries } from 'src/app/countries.module'
import { TranslationService } from 'src/app/translation.module';

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
  selectedLanguage: any;
  originalText:string = "";
  translatedText: string;
  email: string = "";
  password: string = "";
  auth = getAuth();
  myForm:FormGroup;
  captcha: RecaptchaVerifier;
  code: string;
  selectedCountry: string = ""; 
  phoneNumber: string = '';
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
  countries: Country[] = countries;
  defaultCountry: Object | any;
  constructor(private translationService: TranslationService, public http: HttpClient, public formBuilder: FormBuilder, private alertController: AlertController, private router: Router) {
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
      }, 100); 
    });
  }
  changeLanguage(){
    this.translationService.setLanguage(this.selectedLanguage)
  }
  getCurrentLanguage(): string {
    return this.translationService.getLanguage();
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
    if(code){
      this.countryCodeEmoji = countryCodeEmoji(code);
      return this.countryCodeEmoji;
    }
    else{
      return "🌍"
    }
  }
  ngOnInit() {
    this.selectedLanguage = navigator.language.substring(0,2) || window.navigator.language.substring(0,2)
    this.changeLanguage();
    this.auth.useDeviceLanguage();
  }
  async onSubmit() {
    this.isCharging = true;
    const telefonoCompleto = `+${this.selectedCountry} ${this.phoneNumber}`;
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
    this.captcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {'size': 'invisible'})
    const user = await signInWithPhoneNumber(this.auth, phonenumber, this.captcha)
    .then(async (confirmationResult) => {
      this.isModalOpen = true;
      this.getOTP().then( () => {
        this.isModalOpen = false;
        confirmationResult.confirm(this.otp).then( (result) => {
          this.isCharging = false;
          const user = result.user;
        }).catch((error:any) => {
          console.log(error)
          this.isModalOpen = false;
          this.isCharging = false;
          new Errors(this.router, this.translationService, this.alertController).showErrors(error.code);
          this.captcha.clear()
        });
      })
    }).catch((error:any) => {
      console.log(error)
      this.isModalOpen = false;
      this.isCharging = false;
      new Errors(this.router, this.translationService, this.alertController).showErrors(error.code);
      this.captcha.clear()
      
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
    this.captcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {'size': 'invisible'})
    const user = await signInWithPhoneNumber(this.auth, phonenumber, this.captcha)
    .then(async (confirmationResult) => {
      this.isModalOpen = true;
      this.getOTP().then( () => {
        this.isModalOpen = false;
        confirmationResult.confirm(this.otp).then( (result) => {
          this.isCharging = false;
          const user = result.user;
        }).catch((error:any) => {
          console.log(error)
          this.isCharging = false;
          new Errors(this.router, this.translationService, this.alertController).showErrors(error.code);
          this.captcha.clear()
        });
      })
    }).catch((error:any) => {
      console.log(error)
      this.isModalOpen = false;
      this.isCharging = false;
      new Errors(this.router, this.translationService, this.alertController).showErrors(error.code);
      this.captcha.clear()
      
    });
  }else{
    new Errors(this.router, this.translationService, this.alertController).showErrors("auth/invalid-phone-number")
  }
  }
  async reportbug(){
    window.open("https://forms.gle/dJAufJjYbn7R9Ny19", "_blank")
  }
  handleRefresh(event: { target: { complete: () => void; }; }) {
    window.location.reload();
  }
  doRefresh() {
    window.location.reload();
  }
}
