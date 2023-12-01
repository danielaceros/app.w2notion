import { Component } from '@angular/core';
import { StatusBar } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { LoginPage } from "src/app/login/login.page";
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  auth = getAuth();
  constructor(private router: Router) {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.router.navigate(['/home'])
      } else {
        this.router.navigate([''])
      }
    })
  }
  
}
