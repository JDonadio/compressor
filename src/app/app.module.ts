import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// Modules
import { routes } from './app.routes';
import { HttpClientModule } from '@angular/common/http';
import { PapaParseModule } from 'ngx-papaparse';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { FormsModule } from '@angular/forms';

// PAGES
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';

// SERVICES
import { MonitorService } from '../services/monitor.service';
import { ChartService } from '../services/chart.service';
import { SpinnerComponent } from './spinner/spinner.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SpinnerComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    FormsModule,
    PapaParseModule,
    MDBBootstrapModule.forRoot(),
  ],
  providers: [MonitorService, ChartService],
  bootstrap: [AppComponent]
})
export class AppModule { }
