import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class MonitorService {

  constructor(
    private http: HttpClient
  ) {
    this.init();
  }

  init() {
    console.log('Init monitor service');
  }
}
