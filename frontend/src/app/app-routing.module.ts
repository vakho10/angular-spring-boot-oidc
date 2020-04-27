import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AuthGuardWithForcedLogin } from './services/auth-guard-with-forced-login.service';
import { NotFoundComponent } from './pages/not-found/not-found.component';


const routes: Routes = [

  // Public
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'about-us',
    component: AboutUsComponent
  },
  {
    path: 'contact-us',
    component: ContactUsComponent
  },

  // Private
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuardWithForcedLogin]
  },

  // 404
  {
    path: '**',
    component: NotFoundComponent
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
