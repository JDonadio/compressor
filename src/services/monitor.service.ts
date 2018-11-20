import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

import { Papa } from 'ngx-papaparse';
import * as _ from 'lodash';

const ACTIVE_POWER_THRESHOLD: number = 110; // csv max value approach
const UNLOADED_THRESHOLD: number = 0.2;     // based on derivation monitoring
const IDLE_THRESHOLD: number = 0.2 * ACTIVE_POWER_THRESHOLD;
const TIME_BETWEEN_RECORDS: number = 30000; // 30 seconds
const URL = 'assets/signals.csv';
const HEADERS = [
  { name: 'DATE', id: 0 },
  { name: 'METRICID', id: 1 },
  { name: 'ACTIVE POWER', id: 3 },
  { name: 'STATE', id: 4 }
];

@Injectable({
  providedIn: 'root'
})
export class MonitorService {
  private data: any;
  public resume: any;

  constructor(
    private http: HttpClient,
    private papa: Papa
  ) {
    this.data = null;
    this.resume = [];
    console.log('Init monitor service');
  }

  public async getCompressorData() {
    var result = await this.loadCompressorData();
    return result;
  }

  /**
   * Request data as blob using http client and wait for the response
   * Process the blob data separating headers from content
   * Fill the 'data' variable content with the whole processed csv file
   */
  private async loadCompressorData() {
    const resp = await this.http.get(URL, { responseType: 'blob' }).toPromise();
    const content = await this.readAndParseContent(resp);
    this.pushOffStates(content);
    this.data = { headers: HEADERS, content };
    console.log('Data loaded successfully.');
    return this.data;
  }

  private pushOffStates(data: any): any {
    var firstRecord = data[0][0];
    var latestRecord = data[data.length - 1][data[data.length - 1].length - 1];

    var firstDate = new Date(+firstRecord.time);
    firstDate.setHours(0, 0, 0, 0);
    
    var latestDate = new Date(+latestRecord.time);
    latestDate.setDate(latestDate.getDate() + 1);
    latestDate.setHours(23, 59, 59, 0);

    this.resume[0]['off'].count = this.resume[0]['off'].count++;
    this.resume[0]['off'].time = this.resume[0]['off'].time + (firstRecord.time - firstDate.getTime());
    this.resume[0]['off'].timeStr = this.getTimeStr(this.resume[0]['off'].time);

    this.resume[this.resume.length - 1]['off'].count = this.resume[0]['off'].count++;
    this.resume[this.resume.length - 1]['off'].time = this.resume[0]['off'].time + (latestDate.getTime() - latestRecord.time);
    this.resume[this.resume.length - 1]['off'].timeStr = this.getTimeStr(this.resume[0]['off'].time);
  }

  /**
   * Use Papaparse library to read and parse the csv file content
   * Every chunk contain around ~177601 records
   * Once parse process is completed return a buffer which contains all the records
   * @param data blob data response
   */
  private readAndParseContent(data): Promise<any> {
    return new Promise((resolve, reject) => {
      let buffer: Array<any> = [];

      this.papa.parse(data, {
        chunk: partialResult => {
          buffer = [...buffer, this.processDataChunk(partialResult.data)];
        },
        complete: result => resolve(buffer),
        error: error => reject(error)
      });
    })
  }

  private processDataChunk(chunk): any {
    var resultDataChunk = [];
    var totalOffStates = [];
    var prevTime = chunk[0][0];
    if (prevTime === 'timestamp') prevTime = chunk[1][0];

    _.each(chunk, (record: any) => {
      if (record.indexOf('Psum_kW') <= -1) return;

      if (record[0] - prevTime > 30000) {
        let off = {
          activePower: 0,
          state: 'off',
          from: prevTime,
          to: record[0],
          time: record[0] - prevTime
        }
        totalOffStates.push(off);
      } else {
        let result = {
          time: record[0],
          activePower: (+record[3]).toFixed(4),
          state: this.getCompressorState(record[3])
        }
        resultDataChunk = [...resultDataChunk, result];
      }
      prevTime = record[0];
    });
    this.setResumeDataChunk(resultDataChunk, totalOffStates);
    return _.sortBy(resultDataChunk, 'time');
  }

  private setResumeDataChunk(dataChunk, offStates) {
    var idleStates = _.filter(dataChunk, r => { return r.state === 'idle' });
    var unloadedStates = _.filter(dataChunk, r => { return r.state === 'unloaded' });
    var loadedStates = _.filter(dataChunk, r => { return r.state === 'loaded' });

    let res = {
      off: {
        count: offStates.length,
        time: _.sumBy(offStates, 'time'),
        timeStr: this.getTimeStr(_.sumBy(offStates, 'time'))
      },
      idle: {
        count: idleStates.length,
        time: idleStates.length * TIME_BETWEEN_RECORDS,
        timeStr: this.getTimeStr(idleStates.length * TIME_BETWEEN_RECORDS)
      },
      unloaded: {
        count: unloadedStates.length,
        time: unloadedStates.length * TIME_BETWEEN_RECORDS,
        timeStr: this.getTimeStr(unloadedStates.length * TIME_BETWEEN_RECORDS)
      },
      loaded: {
        count: loadedStates.length,
        time: loadedStates.length * TIME_BETWEEN_RECORDS,
        timeStr: this.getTimeStr(loadedStates.length * TIME_BETWEEN_RECORDS)
      },
      max: _.maxBy(dataChunk, 'activePower')['activePower'],
      min: _.minBy(dataChunk, 'activePower')['activePower'],
    }
    this.resume = [...this.resume, res];
  }

  private getTimeStr(time): string {
    let date = new Date(null);
    date.setSeconds(time / 1000);
    return date.toISOString().substr(11, 8);
  }

  /**
   * Returns the state of the machine based on the current active power value
   * @param activePower numeric: value from 'Psum_kw' key
   */
  private getCompressorState(activePower): string {
    if (activePower === 0) return 'off';
    if (activePower > 0 && activePower <= UNLOADED_THRESHOLD) return 'unloaded';
    if (activePower > UNLOADED_THRESHOLD && activePower < IDLE_THRESHOLD) return 'idle';
    if (activePower > IDLE_THRESHOLD) return 'loaded';
  }
}
