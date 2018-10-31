import { Component, OnInit } from '@angular/core';

import { MonitorService } from 'src/services/monitor.service';
import * as _ from 'lodash';

class Data {
  public headers: Array<string> = [];
  public content: Array<Object> = [];
}
const REFRESHER: number = 3 * 1000;
const PAGE_COUNTER: number = 74;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public loadingData: boolean;
  public activeCounter: boolean;
  public error: boolean;
  public data: Data;
  public counter: any;
  public page: number;
  public tablePage: Array<object>;

  constructor(
    private monitorService: MonitorService,
  ) {
    this.loadingData = false;
    this.activeCounter = false;
    this.data = new Data();
    this.error = null;
    this.page = 1;
    this.tablePage = [];
    clearInterval(this.counter);
  }
  
  ngOnInit() {
    this.loadingData = true;
    this.monitorService.loadCompressorData()
      .then(() => this.onSuccessGetData())
      .catch(() => this.onErrorGetData())
  }

  public init() {
    this.activeCounter = true;
    this.counter = setInterval(() => {
      var currentPage = PAGE_COUNTER * this.page;
      this.tablePage = this.data.content.slice(currentPage - PAGE_COUNTER, currentPage);
      console.log(this.tablePage);
      this.page++;
    }, REFRESHER);
  }

  public stop() {
    this.page = 1;
    this.activeCounter = false;
    clearInterval(this.counter);
  }

  onSuccessGetData() {
    this.data = this.monitorService.getCompressorData(1);
    console.log('Data buffer', this.data);
    this.loadingData = false;
    this.error = false;
  }
  
  onErrorGetData() {
    console.log('err');
    this.loadingData = false;
    this.error = true;
  }


}
