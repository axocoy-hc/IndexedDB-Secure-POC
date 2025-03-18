import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private user?: {
    email: string,
    userId: number,
    name: string,
  };

  constructor() { }

  public login(email: string, password: string): void {
    if (email && password) {
      this.user = {
        email: email,
        userId: Math.random(),
        name: "User 1",
      }
    }
  }

  public userAuth() {
    return this.user;
  }

  public logout() {
    this.user = undefined;
  }

}
