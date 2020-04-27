import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { OAuthModule, AuthConfig, OAuthModuleConfig, ValidationHandler, OAuthStorage } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks'
import { ConfigService } from './services/config.service';
import { authModuleConfigFactory } from './services/auth-module-config-factory';
import { CommonModule } from '@angular/common';
import { NotFoundComponent } from './pages/not-found/not-found.component';

// We need a factory since localStorage is not available at AOT build time
export function storageFactory() : OAuthStorage {
  return localStorage
}

export function authConfigFactory(configService: ConfigService): AuthConfig {
  return configService.authConfig;
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    AboutUsComponent,
    ContactUsComponent,
    ProfileComponent,
    NotFoundComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    OAuthModule.forRoot(), // OAuth Module
  ],
  providers: [
    { provide: AuthConfig, useFactory: authConfigFactory, deps: [ConfigService] },
    { provide: OAuthModuleConfig, useFactory: authModuleConfigFactory, deps: [ConfigService] },
    { provide: ValidationHandler, useClass: JwksValidationHandler },
    { provide: OAuthStorage, useFactory: storageFactory },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }