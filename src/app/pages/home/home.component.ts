import { Component, OnInit } from '@angular/core';

import { MonitorService } from 'src/services/monitor.service';
import * as _ from 'lodash';

class Data {
  public headers: Array<string> = [];
  public content: Array<Object> = [];
}
const ACTIVE_POWER_THRESHOLD: number = 100;
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
  public slicedData: any;
  public firstDate: string;
  public latestDate: string;
  public chunk: number;
  public pagesInChunk: number;
  public paginationConfig: any;

  constructor(
    private monitorService: MonitorService,
  ) {
    this.loadingData = false;
    this.currentData = new Data();
    this.completeData = new Data();
    this.slicedData = [];
    this.error = null;
    this.chunk = 0;
    this.pagesInChunk = 0;
    this.firstDate = null;
    this.latestDate = null;
    this.paginationConfig = {
      currentPage: 0,
      recordsInPage: 400
    };
  }
  
  async ngOnInit() {
    this.loadingData = true;
    this.completeData = await this.monitorService.getCompressorData();
    this.loadingData = false;
    console.log('Complete data', this.completeData);
    this.currentData.headers = this.completeData.headers;
    this.processDataByChunk({ data: this.completeData.content, next: true });
    this.firstDate = this.currentData.content[0][0];
    this.nextPage();
  }

  processDataByChunk(opts?: any) {
    opts.next ? this.chunk++ : this.chunk--;
    if (this.chunk == 0 || this.chunk == this.pagesInChunk) return;

    var psumRecords = [];
    var dataChunk: any = this.completeData.content.slice(this.chunk-1, this.chunk)[0];
    _.each(dataChunk, (record: any) => {
      if (record.indexOf('Psum_kW') > -1) {
        record[3] = (+record[3]).toFixed(4);
        record[4] = this.getCompressorState(record[3]);
        psumRecords = [...psumRecords, record];
      }
    })
    this.latestDate = dataChunk[dataChunk.length-1][0];
    this.currentData.content = psumRecords;
    this.pagesInChunk = Math.ceil(this.currentData.content.length / this.paginationConfig.recordsInPage);
    console.log('Current data', this.currentData);
  }

  getCompressorState(activePower): string {
    if (activePower === 0) return 'unloaded';
    if (activePower < IDLE_THRESHOLD && activePower > 0) return 'idle';
    if (activePower > IDLE_THRESHOLD) return 'loaded';
  }

  nextPage() {
    this.paginationConfig.currentPage++;
    var skip = (this.paginationConfig.recordsInPage * this.paginationConfig.currentPage)-this.paginationConfig.recordsInPage;
    var next = this.paginationConfig.currentPage * this.paginationConfig.recordsInPage;
    this.slicedData = _.clone(this.currentData.content.slice(skip, next));
    if (this.slicedData.length == 0) this.nextChunk();
  }

  previousPage() {
    if (this.paginationConfig.currentPage == 1) {
      this.previousChunk();
      return;
    }
    this.paginationConfig.currentPage--;
    var skip = (this.paginationConfig.recordsInPage * this.paginationConfig.currentPage)-this.paginationConfig.recordsInPage;
    var next = this.paginationConfig.currentPage * this.paginationConfig.recordsInPage;
    this.slicedData = _.clone(this.currentData.content.slice(skip, next));
  }

  nextChunk() {
    this.processDataByChunk({ next: true });
    this.paginationConfig.currentPage = 0;
    this.nextPage();
  }

  previousChunk() {
    if (this.chunk == 1) return;
    this.processDataByChunk({ next: false });
    this.paginationConfig.currentPage = Math.ceil(this.currentData.content.length/this.paginationConfig.recordsInPage-1);
    this.nextPage();
  }

  onErrorGetData(error) {
    console.log('err', error);
    this.loadingData = false;
    this.error = true;
  }
}
