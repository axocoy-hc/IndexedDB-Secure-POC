import {Component} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {EncryptService} from '../../services/encryption.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {switchMap} from 'rxjs/operators';
import {IndexedDbService} from '../../services/indexed-db.service';

@Component({
  selector: 'app-form', standalone: false, templateUrl: './form.component.html', styleUrl: './form.component.css'
})
export class FormComponent {

  public formGroup: FormGroup;
  public idGenerated?: number;
  public generalKeyJSON?: string;
  private generalKey?: { derivedKey: CryptoKey; iv: Uint8Array };
  public itemsList?: any[];

  constructor(private authService: AuthService, private encryptService: EncryptService, private indexedDbService: IndexedDbService, private formBuilder: FormBuilder) {
    this.formGroup = this.formBuilder.group({
      content: ['', Validators.required]
    })
  }

  onSubmit() {
    const {content} = this.formGroup.value;
    const email = this.authService.userAuth()?.email
    const userId = this.authService.userAuth()?.userId
    console.log('passphrase used', userId, email);
    this.encryptService.generateAndStoreKey(`${email}${userId}`)
      .pipe(switchMap(key => {
        if (!this.generalKey) {
          this.generalKey = key;
        }
        console.log('Private Key Generated', this.generalKey);
        return this.encryptService.encryptData(content, this.generalKey.derivedKey, this.generalKey.iv)
      }), switchMap(value => this.indexedDbService.addItem(value)))
      .subscribe(id => {
        this.idGenerated = id;
        this.refreshList();
        setTimeout(() => {
          this.idGenerated = undefined
        }, 5000);
      });
  }

  refreshList(): void {
    this.itemsList = [];
    console.log('List with Items is empty')
    this.indexedDbService.getAll()
      .subscribe(valueDe => {
        valueDe.forEach(v => {
          this.encryptService.decryptData(v, this.generalKey!.derivedKey, this.generalKey!.iv)
            .subscribe(result => {
              this.itemsList?.push(result);
              console.log('VALUE DECRYPTED', result)
            });
        });
        console.log('List with Items is loading...')
      });
  }

  public loadKeyFromJSON(): void {
    if (this.generalKey) {
      this.encryptService.transformToJsonWebKey(this.generalKey!.derivedKey)
      .subscribe(jsonDerivatedKey => {
        this.generalKeyJSON = (JSON.stringify({
          derivedKey: jsonDerivatedKey, iv: this.encryptService.arrayBufferToBase64(this.generalKey!.iv),
        }));
        const jwk = JSON.parse(this.generalKeyJSON as string);
        console.log('JSON Web Key', jwk);
        this.encryptService.transformToCryptoKey(jwk.derivedKey)
          .subscribe(cryptoKey => {
            this.generalKey = {
              iv: this.encryptService.base64ToUInt8Array(jwk.iv),
              derivedKey: cryptoKey
            }
            console.log('CryptoKey generated using JSON Web Key data', this.generalKey);
            this.refreshList();
          });
      });
    } else {
      console.warn("Private key is empty");
    }
  }
}
