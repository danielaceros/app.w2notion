import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, InfiniteScrollCustomEvent, IonButton, LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { RecaptchaVerifier, UserMetadata, getAuth, reload, signInWithPhoneNumber } from '@angular/fire/auth';
import { DocumentReference, DocumentSnapshot, DocumentData, addDoc, collection, doc, getDoc, getDocs, getFirestore, onSnapshot, query, where, updateDoc } from '@angular/fire/firestore';
import { Errors } from '../errors.page';
import { otpConfig } from 'src/config/otp.config'
import { CookieService } from 'ngx-cookie-service';
import { map } from 'rxjs';
import { TranslationService } from '../translation.module';
import countryCodeEmoji from 'country-code-emoji';
import { Location } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Animation, AnimationController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  animations: [
    trigger('buttonClick', [
      state('clicked', style({
        transform: 'rotate(360deg)',
      })),
      transition('void => clicked', [
        animate('500ms ease-out'),
      ]),
    ]),
  ],
})
export class HomePage {
  auth = getAuth()
  db = getFirestore()
  chrome: any;
  selectedLanguage: any;
  user: string | undefined;
  username: string | null;
  email: string | null;
  emailp: string | undefined;
  md: UserMetadata;
  phone: string | null;
  image: string | null;
  uid: string | null;
  myForm: FormGroup;
  code: string;
  buttonState = 'unclicked';
  isCharging: boolean = false;
  subscriptionData: Object | any;
  startDate: string;
  endDate: string;
  stripeLink: string;
  otpConfig: any = otpConfig;
  isModalOpen: boolean = false;
  otp: string = "";
  isOTP6: boolean = false;
  isButtonDisabled: boolean = false;
  countdown: number = 60;
  databases: [{
    id: string,
    dbname: string,
    url: string
  }]
  selectedDatabase: {
    dbname: string, 
    id: string,
    url: string
  };
  urlDatabase: string;
  countryCodeEmoji: string;
  messages: [{
    task: string,
    timestamp: number,
    url: string,
    status: number
  }]
  lastUpdate: string = "";
  listmessages: any[] = [];
  lastVisible: number = 10;
  captcha: RecaptchaVerifier;
  constructor(private animationCtrl: AnimationController, private router: Router, private translationService: TranslationService, private cookieService: CookieService, private loadingCtrl: LoadingController, public http: HttpClient, public formBuilder: FormBuilder, private alertController: AlertController) {
    this.onCharge();
    this.myForm = this.formBuilder.group({
      secret: ['', Validators.compose([Validators.minLength(50), Validators.maxLength(50), Validators.required])],
      dbid: ['', Validators.compose([Validators.minLength(32), Validators.maxLength(32), Validators.required])]
    })
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.phone = user.phoneNumber
        this.uid = user.uid
        document.cookie = "firebaseUUID="+user.uid+ "; domain=.w2notion.es; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT"
        document.cookie = "phone="+user.phoneNumber+ "; domain=.w2notion.es; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT"
        document.querySelector("ion-progress-bar")
        const subscriptionsQuery = query(
          collection(this.db, 'customers', user.uid!, 'subscriptions'),
          where('status', 'in', ['trialing', 'active'])
        );
        const unsubscribe = onSnapshot(subscriptionsQuery, (snapshot) => {
          const doc = snapshot.docs[0];
          if (doc) {
            this.subscriptionData = doc.data();
            this.startDate = new Date(doc.data()['current_period_start']['seconds'] * 1000).toLocaleDateString()
            this.endDate = new Date(doc.data()['current_period_end']['seconds'] * 1000).toLocaleDateString()
            this.stripeLink = doc.data()['stripeLink']
          } else {
          }
        }); 
        getDoc(doc(collection(this.db, "notion"), this.uid!)).then( (data) => {
          this.databases = data.data()!['databasesIds']
          this.selectedDatabase = data.data()!['defaultDatabase']
          this.urlDatabase = "https://www.notion.so/"+this.selectedDatabase.id.replace(/-/g, '')
          this.messages = data.data()!['messages']
          this.listmessages = this.messages.slice(0, 10)
          this.lastUpdate = new Date().toLocaleDateString() +" "+ new Date().toLocaleTimeString()
        })
      } else {
      }
    })
    
  }
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString()+" "+date.toLocaleTimeString() // Customize the format string as needed
  }
  getData(){
    getDoc(doc(collection(this.db, "notion"), this.uid!)).then( (data) => {
      this.databases = data.data()!['databasesIds']
      this.selectedDatabase = data.data()!['defaultDatabase']
      this.urlDatabase = "https://www.notion.so/"+this.selectedDatabase.id.replace(/-/g, '')
      this.messages = data.data()!['messages']
      this.listmessages = this.messages.slice(0, 10)
    })
    this.lastUpdate = new Date().toLocaleDateString() +" "+ new Date().toLocaleTimeString()
    setTimeout(() => {
      this.buttonState = 'unclicked';
    }, 200);
  }
  getStatusEmoji(emoji: number){
    if(emoji === 200 || emoji === 300){
      return "🟢"
    }
    else if(emoji === 404){
      return "🔴"
    }
    return ""
  }
  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.lastVisible = this.lastVisible + 10
    this.listmessages = this.messages.slice(0, this.lastVisible)
    setTimeout(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
    }, 500);
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
  compareObjects(option1: any, option2: any): boolean {
    return option1 && option2 ? option1.id === option2.id : option1 === option2;
  }
  changeLanguage(){
    this.translationService.setLanguage(this.selectedLanguage)
  }
  getCurrentLanguage(): string {
    return this.translationService.getLanguage();
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
  async onOtpChange(event: any) {
    this.otp = event;
  }
  async checkOTP(){
    return this.otp.length
  }
  async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
  isOtpInputComplete(): boolean {
    if(this.otp.length > 5){
      return true;
    }
    else{
      return false;
    }
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
  async onCharge(){
    const loading = this.loadingCtrl.create({
      duration: 1000,
      spinner: "lines-small",
      animated: true,
      showBackdrop: true
    });

    (await loading).present();
  }
  async ngOnInit(){    
    this.selectedLanguage = navigator.language.substring(0,2) || window.navigator.language.substring(0,2)
    this.changeLanguage();
    this.auth.useDeviceLanguage();
  }
  async payment(){
    this.isCharging = true;
    const docRef = await addDoc(
      collection(this.db, 'customers', this.uid!, 'checkout_sessions'),
      {
        price: 'price_1OKKwfCBeUvmGnFOAI5M5hSk',
        success_url: window.location.origin,
        cancel_url: window.location.origin,
      }
    );
    onSnapshot(docRef, (snap) => {
      const data = snap.data();
    
      if (data) {
        const { error, url } = data as { error?: any; url?: string };
    
        if (error) {
          alert(`Ocurrió un error: ${error.message}`);
        }
    
        if (url) {
          window.open(url, "_blank")
        }
      }
    });
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
  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }
  async presentAlertNotPayed() {
    const alert = await this.alertController.create({
      header: this.phone!+" is not on a active suscription",
      message: "The user, "+this.phone!+", is not on an active suscription",
      buttons: [{
        text: "Suscribe",
        handler: () => {
          this.payment()
        }
      },
      {
        text: "Cancel",
        handler: () => {
        }
      }],
    });
    await alert.present();
  }
  async presentAlertPayed() {
    const alert = await this.alertController.create({
      header: this.phone!+" data was configured successfully",
      message: "The data of, "+this.phone!+", was configured successfully",
      buttons: [
      {
        text: "Ok",
        handler: () => {
        }
      }],
    });
    await alert.present();
  }
  async changeDefaultDatabase(e:any){
    updateDoc(doc(collection(this.db, "notion"), this.uid!), {"defaultDatabase":{
      "dbname":this.selectedDatabase.dbname,
      "id":this.selectedDatabase.id,
      "url":this.selectedDatabase.url
    }}).then ( () =>{
    })
    this.urlDatabase = "https://www.notion.so/"+this.selectedDatabase.id.replace(/-/g, '')
  }
  async suscription(){
    window.open("https://billing.stripe.com/p/login/test_dR61742Q87zz7f2288", "_blank")
  }
  async reportbug(){
    window.open("https://forms.gle/dJAufJjYbn7R9Ny19", "_blank")
  }
  async connect(){
      this.captcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {'size': 'invisible'})
      const user = await signInWithPhoneNumber(this.auth, this.phone!, this.captcha)
      .then(async (confirmationResult) => {
        this.isModalOpen = true;
        this.getOTP().then( () => {
          this.isModalOpen = false;
          confirmationResult.confirm(this.otp).then( (result) => {
            this.isCharging = false;
            const user = result.user;
            const subscriptionsQuery = query(
              collection(this.db, 'customers', user.uid, 'subscriptions'),
              where('status', 'in', ['trialing', 'active'])
            );
            onSnapshot(subscriptionsQuery, (snapshot) => {
              const doc = snapshot.docs[0];
              if (doc) {
                window.open("https://api.notion.com/v1/oauth/authorize?client_id=a7c99919-e68a-4309-8f28-fccf4948be22&response_type=code&owner=user&redirect_uri=https%3A%2F%2Fapi.w2notion.es%2Fv1%2Foauth", "_blank")
                } else {
                this.presentAlertNotPayed()
              }
            });  
          }).catch((error) => {
            this.isCharging = false;
            new Errors(this.router, this.translationService, this.alertController).showErrors(error.code);
            this.captcha.clear()
          });
        })
      }).catch((error) => {
        this.isModalOpen = false;
        this.isCharging = false;
        new Errors(this.router, this.translationService, this.alertController).showErrors(error.code);
        this.captcha.clear()
        
      });
  }
  handleRefresh(event: { target: { complete: () => void; }; }) {
    window.location.reload();
  }
  signout(){
    this.auth.signOut();
  }
  doRefresh() {
    window.location.reload();
  }
}
