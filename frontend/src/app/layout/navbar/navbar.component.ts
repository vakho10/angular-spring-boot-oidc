import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  isAuthenticated$: Observable<boolean>;

  constructor(private authService: AuthService) {
    this.isAuthenticated$ = authService.isAuthenticated$;
  }

  ngOnInit(): void {
  }

  get appName() {
    return environment.appName;
  }

  get fullName() {
    const identityClaims = this.authService.identityClaims;
    if (!identityClaims) {
      return null;
    }
    return `${identityClaims['given_name']} ${identityClaims['family_name']}`;
  }

  login(e: Event) {
    e.preventDefault();
    console.log("Called login :)");
    this.authService.login();
  }

  logout(e: Event) {
    e.preventDefault();
    this.authService.logout();
  }

}
