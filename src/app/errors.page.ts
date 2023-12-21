import { Router } from "@angular/router";
import { AlertController } from "@ionic/angular";
import { TranslationService } from "src/app/translation.module";

export class Errors{
  constructor(private router: Router, private translationService: TranslationService, private alertController: AlertController){}
  async presentAlertFirebaseError(errorMessage: any) {
    const alert = await this.alertController.create({
      header: this.translationService.translateString("error"),
      message: errorMessage,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            window.location.reload();
          },
        },
      ],
    });
    await alert.present();
  }
  showErrors(errorcode: string){
        switch (errorcode) {
          case 'auth/invalid-email':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/invalid-email"));
            break;
          case 'auth/user-disabled':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/invalid-email"));
            break;
          case 'auth/user-not-found':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/user-not-found"));
            break;
          case 'auth/wrong-password':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/wrong-password"));
            break;
          case 'auth/email-already-in-use':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/email-already-in-use"));
            break;
          case 'auth/invalid-action-code':
          case 'auth/invalid-phone-number':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/invalid-phone-number"));
            break;
          case 'auth/expired-action-code':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/expired-action-code"));
            break;
          case 'auth/invalid-continue-uri':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/invalid-continue-uri"));
            break;
          case 'auth/missing-continue-uri':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/missing-continue-uri"));
            break;
          case 'auth/invalid-verification-code':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/invalid-verification-code"));
            break;
          case 'auth/invalid-verification-id':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/invalid-verification-id"));
            break;
          case 'auth/missing-verification-code':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/missing-verification-code"));
            break;
          case 'auth/network-request-failed':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/network-request-failed"));
            break;
          case 'auth/too-many-requests':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/too-many-requests"));
            break;
          case 'auth/unauthorized-continue-uri':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/unauthorized-continue-uri"));
            break;
          case 'auth/weak-password':
            this.presentAlertFirebaseError(this.translationService.translateString("auth/weak-password"));
            break;
          default:
            this.presentAlertFirebaseError(this.translationService.translateString("default"));
            break;
      }
    }
  }

