import { Component, OnInit } from '@angular/core';

import { MonitorService } from 'src/services/monitor.service';
import * as _ from 'lodash';

class Data {
  public headers: Array<string> = [];
  public content: Array<Object> = [];
}
const RECORDS_IN_PAGE: number = 74;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public loadingData: boolean;
  public activeInterval: boolean;
  public error: boolean;
  public data: Data;
  public currentDataTable: Array<object>;
  public refresher: number;

  private interval: any;
  private pageNumber: number;
  private previousDataTable: Array<object>;

  constructor(
    private monitorService: MonitorService,
  ) {
    this.loadingData = false;
    this.activeInterval = false;
    this.data = new Data();
    this.error = null;
    this.pageNumber = 1;
    this.previousDataTable = [];
    this.currentDataTable = [];
    this.refresher = 3;
  }
  
  ngOnInit() {
    clearInterval(this.interval);
    this.loadingData = true;
    this.monitorService.loadCompressorData()
      .then(() => this.onSuccessGetData())
      .catch(() => this.onErrorGetData())
  }

  /**
   * Init the interval to simulate each read of data from the table
   * Set the refreshing time as 3 seconds by default
   */
  public init() {
    this.activeInterval = true;
    this.interval = setInterval(() => {
      var next = RECORDS_IN_PAGE * this.pageNumber;
      var skip = next - RECORDS_IN_PAGE;
      this.previousDataTable = _.clone(this.currentDataTable);
      this.currentDataTable = this.data.content.slice(skip, next);
      this.pageNumber++;
    }, this.refresher * 1000);
  }

  public stop() {
    this.pageNumber = 1;
    this.activeInterval = false;
    clearInterval(this.interval);
  }
  
  public pause() {
    this.activeInterval = false;
    clearInterval(this.interval);
  }
  
  public backward() {
    clearInterval(this.interval);
    this.refresher += 1;
    this.init();
  }

  public forward() {
    if (this.refresher === 1) return;
    clearInterval(this.interval);
    this.refresher -= 1;
    this.init();
  }

  /**
   * Returns a class name results of a comparison between previous and new value.
   * If nothing change return null.
   * Only compare recvalue and calcvalue fields [3, 4] index of the data table
   * @param row current row in table
   * @param col current col in table
   */
  public getClassForCell(row: number, col: number) {
    if (!this.previousDataTable[row]) return;
    if ([3, 4].indexOf(col) == -1) return;

    var prevValue = this.previousDataTable[row][col];
    var currentValue = this.currentDataTable[row][col];

    if (currentValue < prevValue) return 'smaller';
    else if (currentValue > prevValue) return 'greater';
    else return null;
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
