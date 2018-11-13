import { Injectable } from '@angular/core';
import { Chart } from 'chart.js';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  private opts: any;

  constructor() {
    this.opts = {
      legend: {
        display: true
      },
      scales: {
        xAxes: [{
          display: true
        }],
        yAxes: [{
          display: true
        }],
      }
    };
  }

  public drawChart(x, y, opts?) {
    opts = opts ? opts : this.opts;
    return new Chart('activepower', {
      type: 'line',
      data: {
        labels: x,
        datasets: [{
          data: y,
          label: 'Active Power',
        }],
      },
      options: opts,
    });
  }
}
