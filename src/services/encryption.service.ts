import {catchError, from, map, Observable} from 'rxjs';
import { switchMap } from 'rxjs/operators';

export class EncryptService {
  private readonly alg = 'AES-GCM'

  generateAndStoreKey(passphrase: string): Observable<{ derivedKey: CryptoKey, iv: Uint8Array }> {
    return from(crypto.subtle.generateKey(
      { name: this.alg, length: 256 },
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
            { name: this.alg, length: 256 },
            true,
            ['encrypt', 'decrypt']
          ))),
          switchMap(derivedKey => from(crypto.subtle.exportKey('raw', mainKey)).pipe(
            switchMap(exportedMainKey => {
              const iv = crypto.getRandomValues(new Uint8Array(12));
              return from(crypto.subtle.encrypt(
                { name: this.alg, iv },
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
      { name: this.alg, iv },
      key,
      encodedData
    ));
  }

  decryptData(encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Observable<string> {
    return from(crypto.subtle.decrypt(
      { name: this.alg, iv },
      key,
      encryptedData
    )).pipe(
      map(decryptedData => new TextDecoder().decode(decryptedData)),
      catchError(err => {
        console.error('Error decrypt:', err);
        throw err;
      })
    );
  }

  public arrayBufferToBase64(uint8Array: Uint8Array): string {
    const binaryString = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  }

  public base64ToUInt8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
  }

  public transformToJsonWebKey(key: CryptoKey) {
    return from(crypto.subtle.exportKey('jwk', key)).pipe(
      catchError(err => {
        console.error('Error exporting key:', err);
        throw err;
      })
    );
  }

  public transformToCryptoKey(jwkKey: JsonWebKey) {
    return from(crypto.subtle.importKey(
      'jwk',
      jwkKey,
      { name: this.alg },
      true,
      ['encrypt', 'decrypt']
    )).pipe(
      catchError(err => {
        console.error('Error importing key:', err);
        throw err;
      })
    );
  }
}
