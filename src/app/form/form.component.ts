import { Component } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {EncryptService} from '../../services/encryption.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {switchMap} from 'rxjs/operators';
import {IndexedDbService} from '../../services/indexed-db.service';

@Component({
  selector: 'app-form',
  standalone: false,
  templateUrl: './form.component.html',
  styleUrl: './form.component.css'
})
export class FormComponent {

  public formGroup: FormGroup;
  public idGenerated?: number;
  private generalKey?: { derivedKey: CryptoKey; iv: Uint8Array };

  constructor(private authService: AuthService,
              private encryptService: EncryptService,
              private indexedDbService: IndexedDbService,
              private formBuilder: FormBuilder) {
    this.formGroup = this.formBuilder.group({
      content: ['', Validators.required]
    })
  }

  onSubmit() {
    const { content } = this.formGroup.value;
    const email = this.authService.userAuth()?.email
    const userId = this.authService.userAuth()?.userId
    console.log(content, userId, email);
    this.encryptService.generateAndStoreKey(`${email}${userId}`)
      .pipe(
        switchMap(key => {
          this.generalKey = key;
          console.log(JSON.stringify(key));
          return this.encryptService.encryptData(content, key.derivedKey, key.iv)
        }),
        switchMap(value => this.indexedDbService.addItem(value))
      )
      .subscribe(id => {
        this.idGenerated = id;
        setTimeout(() => {
          this.refreshList();
          this.idGenerated = undefined
        }, 5000);
      });
  }

  refreshList(): void {
    const email = this.authService.userAuth()?.email
    const userId = this.authService.userAuth()?.userId
    console.log(userId, email);
    // this.encryptService.generateAndStoreKey(`${email}${userId}`)
    //   .subscribe(key => {
        this.indexedDbService.getAll()
          .subscribe(valueDe => {
            valueDe.forEach(v => {
              console.log('VALUE', v)
              this.encryptService.decryptData(v, this.generalKey!.derivedKey, this.generalKey!.iv)
                .subscribe(result => {
                console.log('VALUE DECRYPTED', result)
              });
            });
        });
    //})
  }
}
