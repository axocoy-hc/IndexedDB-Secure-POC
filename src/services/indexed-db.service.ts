import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {EncryptService} from './encryption.service';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbName = 'exampledb';
  private dbVersion = 1;
  private storeName = 'exstore';
  private db: IDBDatabase | null = null;

  constructor() {
    this.openDb();
  }

  private openDb(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event: Event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
    };

    request.onerror = (event: Event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
    };
  }

  public addItem(item: any): Observable<number> {
    return new Observable<number>((observer) => {
      if (!this.db) {
        observer.error('Database not initialized');
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const request = store.add(item);

      request.onsuccess = () => {
        observer.next(request.result as number);
        observer.complete();
      };

      request.onerror = () => {
        observer.error(request.error);
      };
    });
  }

  public getItem<T>(id: number): Observable<T> {
    return new Observable<T>((observer) => {
      if (!this.db) {
        observer.error('Database not initialized');
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        observer.next(request.result as T);
        observer.complete();
      };

      request.onerror = () => {
        observer.error(request.error);
      };
    });
  }

  public getAll(): Observable<any[]> {
    return new Observable(observer => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          observer.next(getAllRequest.result);
          observer.complete();
        };

        getAllRequest.onerror = (event: any) => {
          observer.error(event.target.error);
        };
      };

      request.onerror = (event: any) => {
        observer.error(event.target.error);
      };
    });
  }

  public updateItem(item: any): Observable<void> {
    return new Observable<void>((observer) => {
      if (!this.db) {
        observer.error('Database not initialized');
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        observer.next();
        observer.complete();
      };

      request.onerror = () => {
        observer.error(request.error);
      };
    });
  }

  public deleteItem(id: number): Observable<void> {
    return new Observable<void>((observer) => {
      if (!this.db) {
        observer.error('Database not initialized');
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        observer.next();
        observer.complete();
      };

      request.onerror = () => {
        observer.error(request.error);
      };
    });
  }
}
