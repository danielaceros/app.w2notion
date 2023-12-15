import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  constructor(private translate: TranslateService) {
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
  }

  getLanguage(): string {
    return this.translate.store.currentLang;
  }

  translateString(st: string){
    return this.translate.instant(st)
  }
}