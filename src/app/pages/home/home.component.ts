import { Component, OnInit } from '@angular/core';

import { MonitorService } from 'src/services/monitor.service';
import * as _ from 'lodash';

class Data {
  public headers: Array<string> = [];
  public content: Array<Object> = [];
}
const ACTIVE_POWER_THRESHOLD: number = 100;
const _THRESHOLD: number = 100;
const IDLE_THRESHOLD: number = 0.2 * ACTIVE_POWER_THRESHOLD;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public loadingData: boolean;
  public error: boolean;
  public currentData: Data;
  public completeData: Data;
  public firstDate: string;
  public latestDate: string;

  private chunk: number;

  constructor(
    private monitorService: MonitorService,
  ) {
    this.loadingData = false;
    this.currentData = new Data();
    this.completeData = new Data();
    this.error = null;
    this.chunk = 1;
    this.firstDate = null;
    this.latestDate = null;
  }
  
  async ngOnInit() {
    this.loadingData = true;
    this.completeData = await this.monitorService.getCompressorData();
    this.loadingData = false;
    console.log('Complete data', this.completeData);
    this.currentData.headers = this.completeData.headers;
    this.currentData.content = this.processDataByChunk(this.completeData.content);
    this.firstDate = this.currentData.content[0][0];
    console.log('Current data', this.currentData);
  }

  processDataByChunk(data?) {
    data = data || this.completeData.content;
    var psumRecords = [];
    var dataChunk = data.slice(this.chunk-1, this.chunk)[0];
    _.each(dataChunk, (record: any) => {
      if (record.indexOf('Psum_kW') > -1) {
        record[3] = (+record[3]).toFixed(4);
        record[4] = this.determinateState(record[3]);
        psumRecords = [...psumRecords, record];
      }
    })
    this.latestDate = dataChunk[dataChunk.length-1][0];
    this.chunk++;
    return psumRecords;
  }

  determinateState(activePower): string {
    if (activePower === 0) return 'unloaded';
    if (activePower < IDLE_THRESHOLD && activePower > 0) return 'idle';
    if (activePower > IDLE_THRESHOLD) return 'loaded';
  }
  
  onErrorGetData(error) {
    console.log('err', error);
    this.loadingData = false;
    this.error = true;
  }
}
