import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title: string;

  constructor(private authService: AuthService, private router: Router, private titleService: Title) {
    // Subscribe to route navigated event to reset the title of the page.
    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.title = this.titleService.getTitle();
      }
    });

    this.authService.runInitialLoginSequence();
  }
}
