import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// Modules
import { HttpClientModule } from '@angular/common/http';
import { PapaParseModule } from 'ngx-papaparse';
import { routes } from './app.routes';

// PAGES
import { AppComponent } from './app.component';
import { HomeComponent } from '../pages/home/home.component';

// SERVICES
import { MonitorService } from '../services/monitor.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    PapaParseModule
  ],
  providers: [MonitorService],
  bootstrap: [AppComponent]
})
export class AppModule { }
