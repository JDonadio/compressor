import { Component, OnInit } from '@angular/core';

import { MonitorService } from 'src/services/monitor.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public loadingData: boolean;
  public error: boolean;
  public data: Object;

  constructor(
    private monitorService: MonitorService,
  ) {
    this.loadingData = false;
    this.data = {
      headers: null,
      signals: null,
    };
    this.error = null;
  }
  
  ngOnInit() {
    this.loadingData = true;
    this.monitorService.loadCompressorData()
      .then(() => this.onSuccessGetData())
      .catch(() => this.onErrorGetData())
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
