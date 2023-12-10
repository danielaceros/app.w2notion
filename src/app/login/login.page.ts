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
  constructor(public http: HttpClient, public formBuilder: FormBuilder, private alertController: AlertController, private router: Router) {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.router.navigate(['/home'])
        
      } else {
        console.log("NOT LOGGED")
      }
    })
  }
  async onOtpChange(event: any) {
    this.otp = event;
    console.log(this.otp)
  }
  checkOTP(){
    return this.otp.length
  }
  delay(ms: number) {
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
    return countryCodeEmoji(code);
  }
  ngOnInit() {
    this.myForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.email, Validators.required])],
      password: ['', Validators.compose([Validators.minLength(6),  Validators.required])],
    })
  }
  onSubmit() {
    this.isCharging = true;
    const telefonoCompleto = `+${this.selectedCountry} ${this.phoneNumber}`;
    this.loginUserWithPhone(telefonoCompleto)
  }
  async isFormValid(){
    if(this.myForm.valid){
      return true;
    }
    else if(this.myForm.get("password")?.hasError('minlength') && this.myForm.get("email")?.hasError('email')){
      this.presentAlertMailAndPassword();
      return false;
    }
    else if(this.myForm.get("password")?.hasError('minlength')){
      this.presentAlertWeakPassword();
      return false;
    }
    else if(this.myForm.get("email")?.hasError('email')){
      this.presentAlertIsNotEmail();
      return false;
    }
    else{
      return null;
    }
  }
  async presentAlertForgotPassword() {
    const alert = await this.alertController.create({
      header: 'Password Reset',
      message: 'An email is sent to ('+this.email+") in order to change your password",
      buttons: ['¡Perfect!'],
    });
    await alert.present();
  }
  async presentAlertIsNotEmail() {
    const alert = await this.alertController.create({
      header: 'Email Incorrect',
      message: "The email that you've entered is incorrect",
      buttons: ['Dismiss'],
    });
    await alert.present();
  }
  async presentAlertMailAndPassword() {
    const alert = await this.alertController.create({
      header: 'Email and Password Incorrect',
      message: "The email and password that you've entered are incorrect",
      buttons: ['Dismiss'],
    });
    await alert.present();
  }
  async presentAlertPasswordError() {
    const alert = await this.alertController.create({
      header: 'Incorrect User/Password',
      message: "The user/password entered are incorrect",
      buttons: ['Dismiss'],
    });
    await alert.present();
  }
  async presentAlertManyRequests() {
    const alert = await this.alertController.create({
      header: 'Many Requests',
      message: "Try to login in a few minutes",
      buttons: ['Dismiss'],
    });
    await alert.present();
  }
  async presentAlertWeakPassword() {
    const alert = await this.alertController.create({
      header: 'Weak Password',
      message: "You've entered a weak password, password needs to have 6 characters at least",
      buttons: ['Dismiss'],
    });
    await alert.present();
  }
  async presentAlertFirebaseAuthError(errorMessage: string) {
    const alert = await this.alertController.create({
      header: 'Error during OTP',
      message: errorMessage,
      buttons: ['Dismiss'],
    });
    await alert.present();
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
  async signupUserWithEmailAndPassword() {
    if(await this.isFormValid()){
    const user = await createUserWithEmailAndPassword(
      this.auth,
      this.email = this.myForm.get('email')!.value,
      this.password = this.myForm.get('password')!.value,
      ).then((u) =>{

      }).catch(error =>{
        switch (error.code){
          case 'auth/email-already-in-use':
            this.loginUserWithEmailAndPassword()
            break
          case 'auth/weak-password':
            this.presentAlertWeakPassword()
            break
          case 'auth/too-many-requests':
            this.presentAlertManyRequests()
            break
          default:
        }
      })
    return user;}
  }
  async loginUserWithEmailAndPassword() {
    if(await this.isFormValid()){
    const user = await signInWithEmailAndPassword(
       this.auth,
       this.email = this.myForm.get('email')!.value,
       this.password = this.myForm.get('password')!.value,
       ).then((u) =>{
       }).catch(error =>{
         console.log(error.code)
         switch (error.code){
            case 'auth/email-already-in-use':
              break
            case 'auth/invalid-login-credentials':
              this.presentAlertPasswordError();
              break
            case 'auth/too-many-requests':
              this.presentAlertManyRequests()
              break
            default:
         }
       })
    return user;}
  }
  async loginUserWithGoogle(){
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    const auth = getAuth();
    const user = await signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;
    }).catch((error) => {
      const errorCode = error.code;
      const email = error.customData.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
    });
    
  }
  async forgotpassword(){
    this.presentAlertForgotPassword()
    sendPasswordResetEmail(this.auth, this.myForm.get('email')!.value).then(() =>{
    }, () => {
    })
  }
  async loginUserWithPhone(phonenumber: string){
    const captcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {'size': 'invisible'})
    this.isModalOpen = true;
    const user = await signInWithPhoneNumber(this.auth, phonenumber, captcha)
    .then(async (confirmationResult) => {
      this.getOTP().then( () => {
        this.isModalOpen = false;
        confirmationResult.confirm(this.otp).then( (result) => {
          this.isCharging = false;
          const user = result.user;
        }).catch((error) => {
          new Errors(this.alertController).showErrors(error.code);
          this.isModalOpen = false;
          this.isCharging = false;
          console.log(error)
        });
      })
    }).catch((error) => {
      new Errors(this.alertController).showErrors(error.code);
      this.isModalOpen = false;
      this.isCharging = false;
      console.log(error)
    });
  }
  handleRefresh(event: { target: { complete: () => void; }; }) {
    window.location.reload();
  }
}
