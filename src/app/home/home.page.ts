import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RefresherCustomEvent } from '@ionic/angular';
import { UserMetadata, getAuth } from 'firebase/auth';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  auth = getAuth()
  user: string | undefined;
  username: string | null;
  email: string | null;
  emailp: string | undefined;
  md: UserMetadata;
  phone: string | null;
  image: string | null;
  uid: string | null;
  myForm: FormGroup;
  constructor(public http: HttpClient, public formBuilder: FormBuilder) {
    this.myForm = this.formBuilder.group({
      whphone: ['', Validators.compose([Validators.required])],
      secret: ['', Validators.compose([Validators.minLength(50), Validators.maxLength(50), Validators.required])],
      dbid: ['', Validators.compose([Validators.minLength(32), Validators.maxLength(32), Validators.required])]
    })
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.user = user.displayName?.split(" ")[0],
        this.username = user.displayName;
        this.email = user.email;
        this.emailp = user.email?.split("@")[0];
        this.md = user.metadata;
        this.phone = user.phoneNumber
        this.image = user.photoURL
        this.uid = user.uid
      } else {
        console.log("NOT LOGGED")
      }
    })
  }
  ngOnInit(){
    
  }
  refresh(ev: any) {
    setTimeout(() => {
      (ev as RefresherCustomEvent).detail.complete();
    }, 3000);
  }
  connect(){
    if(this.myForm.valid){
      this.http.get("https://api.w2notion.es/v1/connect?whphone="+this.myForm.get("whphone")?.value+"&secret="+this.myForm.get("secret")?.value+"&dbid="+this.myForm.get("dbid")?.value).subscribe((data: any) =>{
      })
    }
  }
  signout(){
    this.auth.signOut();
  }
}
