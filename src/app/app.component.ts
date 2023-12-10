import { Component, inject } from '@angular/core';
import { StatusBar } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { getAuth, onAuthStateChanged } from "@angular/fire/auth";
import { LoginPage } from "src/app/login/login.page";
import { Router, RouterModule } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})

export class AppComponent {
  firestore: Firestore = inject(Firestore);
  auth = getAuth();
  
  constructor(private http: HttpClient, private router: Router) {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.router.navigate(['/home'])
      } else {
        this.router.navigate([''])
      }
    })
  }
  
}
