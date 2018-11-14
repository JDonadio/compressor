import { Injectable } from '@angular/core';
import { Chart } from 'chart.js';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor() { }

  public drawChart(x, y, opts?) {
    opts = opts ? opts : this.getOptions();
    return new Chart('activepower', {
      type: 'line',
      data: {
        labels: x,
        datasets: [
          {
            data: y,
            label: 'Active Power',
            backgroundColor: 'rgba(75, 192, 192, 0.2)'
          }
        ],
      },
      options: opts,
    });
  }

  private getOptions() {
    return {
      legend: { display: true },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true, labelString: 'Date axis'
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true, labelString: 'Active power axis'
          }
        }],
      }
    };
  }
}

