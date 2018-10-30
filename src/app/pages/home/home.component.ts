import { Component, OnInit } from '@angular/core';
import { MonitorService } from 'src/services/monitor.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public loadingData: boolean;
  public error: boolean;
  public data: Array<any>;

  constructor(
    private monitorService: MonitorService,
  ) {
    this.loadingData = false;
    this.data = null;
    this.error = null;
  }
  
  ngOnInit() {
    this.loadingData = true;
    this.monitorService.getCompressorData()
      .then(success => this.onSuccessGetData(success))
      .catch(err => this.onErrorGetData(err))
  }

  onSuccessGetData(data) {
    console.log('Data buffer', data);
    this.data = data;
    this.error = false;
  }

  onErrorGetData(err) {
    console.log('Error getting data', err);
    this.error = true;
  }
}
