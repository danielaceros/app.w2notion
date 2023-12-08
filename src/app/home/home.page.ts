import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, RefresherCustomEvent } from '@ionic/angular';
import { RecaptchaVerifier, UserMetadata, getAuth, reload, signInWithPhoneNumber } from 'firebase/auth';
import { DocumentData, addDoc, collection, doc, getDoc, getFirestore, onSnapshot, query, where } from 'firebase/firestore';

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
  db = getFirestore();
  isCharging: boolean = false;
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
        document.querySelector("ion-progress-bar")
        const subscriptionsQuery = query(
          collection(this.db, 'customers', user.uid!, 'subscriptions'),
          where('status', 'in', ['trialing', 'active'])
        );
        const unsubscribe = onSnapshot(subscriptionsQuery, (snapshot) => {
          const doc = snapshot.docs[0];
          if (doc) {
            console.log(doc.id, ' => ', doc.data());
          } else {
            console.log('No hay suscripciones activas o en periodo de prueba.');
          }
        });
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
  async payment(){
    const docRef = await addDoc(
      collection(this.db, 'customers', this.uid!, 'checkout_sessions'),
      {
        price: 'price_1OKKwfCBeUvmGnFOAI5M5hSk',
        success_url: window.location.origin,
        cancel_url: window.location.origin,
      }
    );
    // Espera a que se adjunte el CheckoutSession por la extensión
    onSnapshot(docRef, (snap) => {
      const data = snap.data();
    
      if (data) {
        const { error, url } = data as { error?: any; url?: string };
    
        if (error) {
          // Muestra un error al cliente e inspecciona los registros de Cloud Function en la consola de Firebase.
          alert(`Ocurrió un error: ${error.message}`);
        }
    
        if (url) {
          // Tenemos una URL de Stripe Checkout, redirijamos.
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
  async connect(){
    if(this.myForm.valid){
      const captcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {'size': 'invisible'})
      const user = await signInWithPhoneNumber(this.auth, this.phone!, captcha)
      .then(async (confirmationResult) => {
        this.presentAlertCodeVerification(this.phone!).then( () => {
          
          confirmationResult.confirm(this.code).then( async (result) => {
            const user = result.user;
            const subscriptionsQuery = query(
              collection(this.db, 'customers', user.uid, 'subscriptions'),
              where('status', 'in', ['trialing', 'active'])
            );
            onSnapshot(subscriptionsQuery, (snapshot) => {
              const doc = snapshot.docs[0];
              if (doc) {
                this.presentAlertPayed()
                this.http.get("https://api.w2notion.es/v1/connect?whphone="+this.phone!+"&secret="+this.myForm.get("secret")?.value+"&dbid="+this.myForm.get("dbid")?.value).subscribe((data: any) =>{
              })
              } else {
                this.presentAlertNotPayed()
              }
            });
            
            
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
