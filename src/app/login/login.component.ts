import { Component } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  public fg: FormGroup

  constructor(private authService: AuthService, private formBuilder: FormBuilder) {
    this.fg = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    })
  }


  onSubmit() {
    const { email, password } = this.fg.value;
    this.authService.login(email, password);
  }
}
