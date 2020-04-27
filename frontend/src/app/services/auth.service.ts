import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Observable, combineLatest, throwError } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { OAuthErrorEvent, OAuthService } from 'angular-oauth2-oidc';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isAuthenticatedSubject$ = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject$.asObservable();

  private isDoneLoadingSubject$ = new ReplaySubject<boolean>();
  public isDoneLoading$ = this.isDoneLoadingSubject$.asObservable();

  /**
   * Publishes `true` if and only if (a) all the asynchronous initial
   * login calls have completed or errorred, and (b) the user ended up
   * being authenticated.
   *
   * In essence, it combines:
   *
   * - the latest known state of whether the user is authorized
   * - whether the ajax calls for initial log in have all been done
   */
  public canActivateProtectedRoutes$: Observable<boolean> = combineLatest(
    this.isAuthenticated$,
    this.isDoneLoading$
  ).pipe(map(values => values.every(b => b)));

  private navigateToLoginPage() {
    // TODO: Remember current URL
    this.router.navigateByUrl('/should-login');
  }

  constructor(private oauthService: OAuthService, private configService: ConfigService, private http: HttpClient, private router: Router) {

    // Useful for debugging:
    this.oauthService.events.subscribe(event => {
      if (event instanceof OAuthErrorEvent) {
        console.error(event);
      } else {
        console.warn(event);
      }
    });

    // This is tricky, as it might cause race conditions (where access_token is set in another
    // tab before everything is said and done there.
    // TODO: Improve this setup.
    window.addEventListener('storage', (event) => {
      // The `key` is `null` if the event was caused by `.clear()`
      if (event.key !== 'access_token' && event.key !== null) {
        return;
      }

      console.warn('Noticed changes to access_token (most likely from another tab), updating isAuthenticated');
      this.isAuthenticatedSubject$.next(this.oauthService.hasValidAccessToken());

      if (!this.oauthService.hasValidAccessToken()) {
        this.navigateToLoginPage();
      }
    });

    this.oauthService.events
      .subscribe(_ => {
        this.isAuthenticatedSubject$.next(this.oauthService.hasValidAccessToken());
      });

    this.oauthService.events
      .pipe(filter(e => ['token_received'].includes(e.type)))
      .subscribe(e => this.oauthService.loadUserProfile());

    this.oauthService.events
      .pipe(filter(e => ['session_terminated', 'session_error'].includes(e.type)))
      .subscribe(e => this.navigateToLoginPage());

    this.oauthService.setupAutomaticSilentRefresh();
  }

  public runInitialLoginSequence(): Promise<void> {
    if (location.hash) {
      console.log('Encountered hash fragment, plotting as table...');
      console.table(location.hash.substr(1).split('&').map(kvp => kvp.split('=')));
    }

    // 0. LOAD CONFIG:
    // First we have to check to see how the IdServer is
    // currently configured.
    //
    // IMPORTANT: To make the OIDC discovery work on WSO2 IS
    // you have to unsecure the oidc dicovery endpoint (a spa must never know admin credentials).
    // - Open the file <IS_HOME>/repository/conf/identity/identity.xml
    // - Find this line
    //      <Resource context="(.*)/.well-known(.*)" secured="true" http-method="all"/>
    // - Set secure attribute to false
    return this.oauthService.loadDiscoveryDocument()

      // For demo purposes, we pretend the previous call was very slow
      .then(() => new Promise(resolve => setTimeout(() => resolve(), 1000)))

      // 1. HASH LOGIN:
      // Try to log in after redirect back
      // from IdServer from initLoginFlow:
      .then(() => this.oauthService.tryLogin())

      .then(() => {
        if (this.oauthService.hasValidAccessToken()) {
          return Promise.resolve();
        }

        // 2. SILENT LOGIN:
        // Try to log in via silent refresh because the IdServer
        // might have a cookie to remember the user, so we can
        // prevent doing a redirect:
        return this.refresh()
          .then(() => Promise.resolve())
          .catch(result => {
            if (this.checkUserInteractionRequiredOnRefreshFailure(result)) {

              // 3. ASK FOR LOGIN:
              // At this point we know for sure that we have to ask the
              // user to log in, so we redirect them to the IdServer to
              // enter credentials.
              if (this.configService.autoLogin) {
                // Force user to login
                console.log('Forcing user to log in');
                this.login();
              }
              else {
                console.warn('User interaction is needed to log in, we will wait for the user to manually log in.');
              }
              return Promise.resolve();
            }

            // We can't handle the truth, just pass on the problem to the
            // next handler.
            return Promise.reject(result);
          });
      })

      .then(() => {
        this.isDoneLoadingSubject$.next(true);

        // Check for the strings 'undefined' and 'null' just to be sure. Our current
        // login(...) should never have this, but in case someone ever calls
        // initImplicitFlow(undefined | null) this could happen.
        if (this.oauthService.state && this.oauthService.state !== 'undefined' && this.oauthService.state !== 'null') {
          let stateUrl = this.oauthService.state;
          if (stateUrl.startsWith('/') === false) {
            stateUrl = decodeURIComponent(stateUrl);
          }
          console.log(`There was state of ${this.oauthService.state}, so we are sending you to: ${stateUrl}`);
          this.router.navigateByUrl(stateUrl);
        }
      })
      .catch(() => this.isDoneLoadingSubject$.next(true));
  }

  private checkUserInteractionRequiredOnRefreshFailure(result: any): boolean {
    // Only consider situations where it's reasonably sure that sending the
    // user to the IdServer will help.
    const errorCodes = [
      // OAuth2 error codes
      // See RFC https://tools.ietf.org/html/rfc6749#section-5.2
      'invalid_grant',

      // OIDC error codes
      // See https://openid.net/specs/openid-connect-core-1_0.html#AuthError
      'interaction_required',
      'login_required',
      'account_selection_required',
      'consent_required'
    ];

    // Notice that implicit and code flows return errors in different ways
    const k = this.oauthService.responseType === 'code' ? 'error' : 'reason';

    return result
      && result[k]
      && errorCodes.indexOf(result[k].error) >= 0;
  }

  public login(targetUrl?: string) {
    // Note: before version 9.1.0 of the library you needed to
    // call encodeURIComponent on the argument to the method.
    this.oauthService.initLoginFlow(targetUrl || this.router.url);
  }

  public logout() {
    if (this.configService.revokeTokenOnLogout) {
      const token = this.oauthService.getAccessToken(); // Get token before logging out which clears the token  
      this.revokeToken(token);
    }

    this.oauthService.logOut();
  }

  public refresh(): Promise<object> {
    return this.oauthService.responseType === 'code'
      ? this.oauthService.refreshToken()
      : this.oauthService.silentRefresh();
  }

  public hasValidToken() { return this.oauthService.hasValidAccessToken(); }

  // These normally won't be exposed from a service like this, but
  // for debugging it makes sense.
  public get accessToken() { return this.oauthService.getAccessToken(); }
  public get refreshToken() { return this.oauthService.getRefreshToken(); }
  public get identityClaims() { return this.oauthService.getIdentityClaims(); }
  public get idToken() { return this.oauthService.getIdToken(); }
  public get logoutUrl() { return this.oauthService.logoutUrl; }

  // Revoke access token
  // Notice that WSO2 IS 5.8.0 automatically revokes the associated refresh token
  // (check response headers of access token revocation) which looks very reasonable.
  private revokeToken(token: string) {
    console.log('Revoking token = ' + token);
    const revocationUrl = this.oauthService.tokenEndpoint.replace(/\/token$/, '/revoke');
    const headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('token', token);
    urlSearchParams.append('token_type_hint', 'access_token');
    urlSearchParams.append('client_id', this.oauthService.clientId);
    this.http.post(revocationUrl, urlSearchParams.toString(), { headers })
      .subscribe(result => {
        console.log('Access token and related refresh token (if any) have been successfully revoked');
      }, (error) => {
        console.error('Something went wrong on token revocation');
        //this.oidcSecurityService.handleError(error);
        return throwError(error);
      });
  }
}
