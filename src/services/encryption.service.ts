import {from, map, Observable} from 'rxjs';
import { switchMap } from 'rxjs/operators';

export class EncryptService {
  generateAndStoreKey(passphrase: string): Observable<{ derivedKey: CryptoKey, iv: Uint8Array }> {
    return from(crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )).pipe(
      switchMap(mainKey => {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        return from(crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(passphrase),
          'PBKDF2',
          false,
          ['deriveKey']
        )).pipe(
          switchMap(importedKey => from(crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            importedKey,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          ))),
          switchMap(derivedKey => from(crypto.subtle.exportKey('raw', mainKey)).pipe(
            switchMap(exportedMainKey => {
              const iv = crypto.getRandomValues(new Uint8Array(12));
              return from(crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                derivedKey,
                exportedMainKey
              )).pipe(
                map(() => ({ derivedKey, iv }))
              );
            })
          ))
        );
      })
    );
  }

  encryptData(data: string, key: CryptoKey, iv: Uint8Array): Observable<ArrayBuffer> {
    const encodedData = new TextEncoder().encode(data);
    return from(crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    ));
  }

  decryptData(encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Observable<string> {
    return from(crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    )).pipe(
      map(decryptedData => new TextDecoder().decode(decryptedData))
    );
  }
}
