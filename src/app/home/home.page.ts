import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, RefresherCustomEvent } from '@ionic/angular';
import { RecaptchaVerifier, UserMetadata, getAuth, reload, signInWithPhoneNumber } from '@angular/fire/auth';
import { DocumentReference, DocumentSnapshot, DocumentData, addDoc, collection, doc, getDoc, getDocs, getFirestore, onSnapshot, query, where, updateDoc } from '@angular/fire/firestore';
import { Errors } from '../errors.page';
import { otpConfig } from 'src/config/otp.config'
import { CookieService } from 'ngx-cookie-service';
import { map } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  auth = getAuth()
  db = getFirestore()
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
    name: string,
    id: string
  }]
  selectedDatabase: string;
  constructor(private cookieService: CookieService, private loadingCtrl: LoadingController, public http: HttpClient, public formBuilder: FormBuilder, private alertController: AlertController) {
    this.onCharge();
    this.myForm = this.formBuilder.group({
      secret: ['', Validators.compose([Validators.minLength(50), Validators.maxLength(50), Validators.required])],
      dbid: ['', Validators.compose([Validators.minLength(32), Validators.maxLength(32), Validators.required])]
    })
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.phone = user.phoneNumber
        this.uid = user.uid
        document.cookie = "firebaseUUID="+ user.uid+ "; domain=.w2notion.es; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT"
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
            this.startDate = new Date(doc.data()['current_period_start']['seconds'] * 1000).toDateString()
            this.endDate = new Date(doc.data()['current_period_end']['seconds'] * 1000).toDateString()
            this.stripeLink = doc.data()['stripeLink']
          } else {
          }
        }); 
        getDoc(doc(collection(this.db, "notion"), this.uid!)).then( (data) => {
          this.databases = data.data()!['databasesIds']
          console.log(this.databases)
        })
      } else {
      }
    })
    
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
      message: 'Setting everithing up...',
      duration: 1000,
    });

    (await loading).present();
  }
  async ngOnInit(){      
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
          window.location.assign(url);
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
    updateDoc(doc(collection(this.db, "notion"), this.uid!), {"defaultDatabase":this.selectedDatabase}).then ( () =>{
    })
  }
  async connect(){
      const captcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {'size': 'invisible'})
      const user = await signInWithPhoneNumber(this.auth, this.phone!, captcha)
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
                window.location.assign("https://api.notion.com/v1/oauth/authorize?client_id=a7c99919-e68a-4309-8f28-fccf4948be22&response_type=code&owner=user&redirect_uri=https%3A%2F%2Fapi.w2notion.es%2Fv1%2Foauth")
                } else {
                this.presentAlertNotPayed()
              }
            });  
          }).catch((error) => {
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
