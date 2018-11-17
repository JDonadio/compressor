import { Component, OnInit, HostListener } from '@angular/core';

import { MonitorService } from 'src/services/monitor.service';
import { ChartService } from 'src/services/chart.service';
import { Chart } from 'chart.js';
import * as _ from 'lodash';

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
  public currentData: any;
  public completeData: any;
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
    this.currentData = {};
    this.completeData = {};
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
   * Slice chunk of data and divide it in pages for a friendly visualization
   * @param next boolean: pagination flag
   */
  processDataByChunk(next: boolean) {
    next ? this.chunk++ : this.chunk--;
    if (this.chunk == 0 || this.chunk == this.pagesInChunk) return;
    
    this.currentData.content = this.completeData.content.slice(this.chunk - 1, this.chunk)[0];
    this.pagesInChunk = Math.ceil(this.currentData.content.length / this.paginationConfig.recordsInPage);
    console.log('Current data', this.currentData);
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
    _.each(_.map(this.slicedData, 'time'), t => { x = [...x, new Date(+t).toLocaleString()] });

    // Generate yAxis with active power values
    let y = _.map(this.slicedData, 'activePower');

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
