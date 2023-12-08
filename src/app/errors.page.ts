import { AlertController } from "@ionic/angular";

export class Errors{
  constructor(private alertController: AlertController){}
  async presentAlertFirebaseError(errorMessage: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: errorMessage,
      buttons: ['OK'],
    });
    await alert.present();
  }
  showErrors(errorcode: string){
        switch (errorcode) {
          case 'auth/invalid-email':
            this.presentAlertFirebaseError('Invalid email address.');
            break;
          case 'auth/user-disabled':
            this.presentAlertFirebaseError('The user account has been disabled.');
            break;
          case 'auth/user-not-found':
            this.presentAlertFirebaseError('User not found. Please check the email address.');
            break;
          case 'auth/wrong-password':
            this.presentAlertFirebaseError('Incorrect password. Please try again.');
            break;
          case 'auth/email-already-in-use':
            this.presentAlertFirebaseError('The email address is already in use by another account.');
            break;
          case 'auth/invalid-action-code':
          case 'auth/invalid-phone-number':
            this.presentAlertFirebaseError('The number phone is invalid. Please try again');
            break;
          case 'auth/expired-action-code':
            this.presentAlertFirebaseError('The action code is invalid or has expired. Please request a new one.');
            break;
          case 'auth/invalid-continue-uri':
            this.presentAlertFirebaseError('The continue URL provided in the request is invalid.');
            break;
          case 'auth/missing-continue-uri':
            this.presentAlertFirebaseError('The continue URL must be provided in the request.');
            break;
          case 'auth/invalid-verification-code':
            this.presentAlertFirebaseError('Invalid verification code.');
            break;
          case 'auth/invalid-verification-id':
            this.presentAlertFirebaseError('Invalid verification ID.');
            break;
          case 'auth/missing-verification-code':
            this.presentAlertFirebaseError('Missing verification code.');
            break;
          case 'auth/network-request-failed':
            this.presentAlertFirebaseError('Network request failed. Please check your internet connection.');
            break;
          case 'auth/too-many-requests':
            this.presentAlertFirebaseError('Too many unsuccessful login attempts. Please try again later.');
            break;
          case 'auth/unauthorized-continue-uri':
            this.presentAlertFirebaseError('The domain of the continue URL is not whitelisted.');
            break;
          case 'auth/weak-password':
            this.presentAlertFirebaseError('The password is too weak. Please choose a stronger password.');
            break;
          default:
            this.presentAlertFirebaseError('An unexpected error occurred. Please try again later.');
            break;
      }
    }
  }

