import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { routes } from './app.routes';
import { AppComponent } from './app.component';
import { HomeComponent } from '../pages/home/home.component';

import { MonitorService } from '../services/monitor.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    HttpClientModule
  ],
  providers: [MonitorService],
  bootstrap: [AppComponent]
})
export class AppModule { }
