import { Component, OnInit, HostListener } from '@angular/core';

import { MonitorService } from 'src/services/monitor.service';
import { ChartService } from 'src/services/chart.service';
import { Chart } from 'chart.js';
import * as _ from 'lodash';

class Data {
  public headers: Array<string> = [];
  public content: Array<Object> = [];
}
const ACTIVE_POWER_THRESHOLD: number = 110; // csv max value approach
const UNLOADED_THRESHOLD: number = 0.2;     // based on derivation monitoring
const IDLE_THRESHOLD: number = 0.2 * ACTIVE_POWER_THRESHOLD;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @HostListener('window:scroll', ['$event'])
  onWindowScroll($event) {
    this.showScrolls = window.pageYOffset != 0;
  }
  
  public loadingData: boolean;
  public showScrolls: boolean;
  public error: boolean;
  public currentData: Data;
  public completeData: Data;
  public resumeChunkInformation: any;
  public slicedData: any;
  public chunk: number;
  public pagesInChunk: number;
  public paginationConfig: any;
  public chart: any;

  constructor(
    private monitorService: MonitorService,
    private chartService: ChartService,
  ) {
    this.loadingData = false;
    this.currentData = new Data();
    this.completeData = new Data();
    this.slicedData = [];
    this.error = null;
    this.chunk = 0;
    this.pagesInChunk = 0;
    this.paginationConfig = {
      currentPage: 0,
      recordsInPage: 200
    };
    this.chart = null;
    this.resumeChunkInformation = null;
  }
  
  async ngOnInit() {
    this.loadingData = true;
    this.completeData = await this.monitorService.getCompressorData();
    this.loadingData = false;
    console.log('Complete data', this.completeData);
    this.currentData.headers = this.completeData.headers;
    this.processDataByChunk(true);
    this.nextPage();
  }

  /**
   * Returns the sliced chunk of data and divide it in pages for a friendly visualization
   * Process only recvalue and state values of each record
   * @param next boolean: pagination flag
   */
  processDataByChunk(next: boolean) {
    next ? this.chunk++ : this.chunk--;
    if (this.chunk == 0 || this.chunk == this.pagesInChunk) return;
    
    this.resetResumeChunkInformation();
    var psumRecords = [];
    var dataChunk: any = this.completeData.content.slice(this.chunk-1, this.chunk)[0];
    _.each(dataChunk, (record: any) => {
      if (record.indexOf('Psum_kW') > -1) {
        record[3] = (+record[3]).toFixed(4);
        record[4] = this.getCompressorState(record[3]);
        psumRecords = [...psumRecords, record];
        this.processResumeDataByChunk(record[3], record[4]);
      }
    });
    this.currentData.content = psumRecords;
    this.pagesInChunk = Math.ceil(this.currentData.content.length / this.paginationConfig.recordsInPage);
    console.log('Current data', this.currentData);
    console.log('Resume chunk', this.resumeChunkInformation);
  }

  processResumeDataByChunk(activePower, state) {
    var max = this.resumeChunkInformation.maxValue;
    var min = this.resumeChunkInformation.minValue;
    this.resumeChunkInformation.maxValue = activePower > max ? activePower : max;
    this.resumeChunkInformation.minValue = activePower < min ? activePower : min;
    this.resumeChunkInformation.stateCount[state]++;
  }

  resetResumeChunkInformation() {
    this.resumeChunkInformation = {
      unloadedThreshold: UNLOADED_THRESHOLD,
      maxValue: 0,
      minValue: ACTIVE_POWER_THRESHOLD,
      stateCount: {
        off: 0, unloaded: 0, idle: 0, loaded: 0
      }
    };
  }

  /**
   * Returns the state of the machine based on the current active power value
   * @param activePower numeric: value from 'Psum_kw' key
   */
  getCompressorState(activePower): string {
    if (activePower === 0) return 'off';
    if (activePower > 0 && activePower <= UNLOADED_THRESHOLD) return 'unloaded';
    if (activePower > UNLOADED_THRESHOLD && activePower < IDLE_THRESHOLD) return 'idle';
    if (activePower > IDLE_THRESHOLD) return 'loaded';
  }

  /**
   * Slices the next page of current data chunk
   */
  nextPage() {
    this.paginationConfig.currentPage++;
    var skip = (this.paginationConfig.recordsInPage * this.paginationConfig.currentPage)-this.paginationConfig.recordsInPage;
    var next = this.paginationConfig.currentPage * this.paginationConfig.recordsInPage;
    this.slicedData = _.clone(this.currentData.content.slice(skip, next));
    if (this.slicedData.length == 0) this.nextChunk();
    else this.drawChart();
  }

  /**
   * Slices the previous page of current data chunk
   */
  previousPage() {
    if (this.paginationConfig.currentPage == 1) {
      this.previousChunk();
      return;
    }
    this.paginationConfig.currentPage--;
    var skip = (this.paginationConfig.recordsInPage * this.paginationConfig.currentPage)-this.paginationConfig.recordsInPage;
    var next = this.paginationConfig.currentPage * this.paginationConfig.recordsInPage;
    this.slicedData = _.clone(this.currentData.content.slice(skip, next));
    this.drawChart();
  }

  /**
   * Slices the next chunk of data
   */
  nextChunk() {
    this.processDataByChunk(true);
    this.paginationConfig.currentPage = 0;
    this.nextPage();
  }

  /**
   * Slices the previous chunk of data
   */
  previousChunk() {
    if (this.chunk == 1) return;
    this.processDataByChunk(false);
    this.paginationConfig.currentPage = Math.ceil(this.currentData.content.length/this.paginationConfig.recordsInPage-1);
    this.nextPage();
  }

  drawChart() {
    // Generate xAxis with dates
    let x = [];
    _.each(this.slicedData, d => { x = [...x, new Date(+d[0]).toLocaleString()] });

    // Generate yAxis with active power values
    let y = [];
    _.each(this.slicedData, d => { y = [...y, d[3]] });

    // If a chart is already drew, clean chart object it before re-draw it
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this.chart = this.chartService.drawChart(x, y);
  }

  goTop() {
    window.scroll(0, 0);
  }

  goBottom() {
    window.scroll(0, 100000);
  }

  onErrorGetData(error) {
    console.log('err', error);
    this.loadingData = false;
    this.error = true;
  }
}
