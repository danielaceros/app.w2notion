import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, RefresherCustomEvent } from '@ionic/angular';
import { RecaptchaVerifier, UserMetadata, getAuth, reload, signInWithPhoneNumber } from 'firebase/auth';
import { getStripePayments, createCheckoutSession } from "@invertase/firestore-stripe-payments";
import { getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  auth = getAuth()
  app = getApp()
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
  constructor(public http: HttpClient, public formBuilder: FormBuilder, private alertController: AlertController) {
    this.myForm = this.formBuilder.group({
      secret: ['', Validators.compose([Validators.minLength(50), Validators.maxLength(50), Validators.required])],
      dbid: ['', Validators.compose([Validators.minLength(32), Validators.maxLength(32), Validators.required])]
    })
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        console.log(this.db)
        this.phone = user.phoneNumber
        this.uid = user.uid
      } else {
        console.log("NOT LOGGED")
      }
    })
  }
  async suscribe(){
    const payments = getStripePayments(getApp(), {
      productsCollection: "products",
      customersCollection: "customers",
    });
    const session = await createCheckoutSession(payments, {
      price: "price_1OKKwfCBeUvmGnFOAI5M5hSk",
    });
    window.location.assign(session.url);
  }
  ngOnInit(){
    
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
  async connect(){
    if(this.myForm.valid){
      const captcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {'size': 'invisible'})
      const user = await signInWithPhoneNumber(this.auth, this.phone!, captcha)
      .then(async (confirmationResult) => {
        this.presentAlertCodeVerification(this.phone!).then( () => {
          confirmationResult.confirm(this.code).then( (result) => {
            const user = result.user;
            this.http.get("https://api.w2notion.es/v1/connect?whphone="+this.phone!+"&secret="+this.myForm.get("secret")?.value+"&dbid="+this.myForm.get("dbid")?.value).subscribe((data: any) =>{
            })
          }).catch((error) => {
            console.log(error)
          });
        })
      }).catch((error) => {
        console.log(error)
      });
    }
  }
  handleRefresh(event: { target: { complete: () => void; }; }) {
    window.location.reload();
  }
  signout(){
    this.auth.signOut();
  }
}
