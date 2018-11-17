import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

import { Papa } from 'ngx-papaparse';
import * as _ from 'lodash';

const ACTIVE_POWER_THRESHOLD: number = 110; // csv max value approach
const UNLOADED_THRESHOLD: number = 0.2;     // based on derivation monitoring
const IDLE_THRESHOLD: number = 0.2 * ACTIVE_POWER_THRESHOLD;
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

  constructor(
    private http: HttpClient,
    private papa: Papa
  ) {
    this.data = null;
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
    this.data = { headers: HEADERS, content };
    console.log('Data loaded successfully.');
    return this.data;
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
    var prevDate = chunk[0][0];
    if (prevDate === 'timestamp') prevDate = chunk[1][0];

    _.each(chunk, (record: any) => {
      if (record.indexOf('Psum_kW') <= -1) return;

      let result = {};

      if (record[0] - prevDate > 30000) {
        result = {
          time: +prevDate + ((record[0] - prevDate) / 2),
          activePower: 0,
          state: 'off'
        }
        console.log('Off state found', result);
      } else {
        result = {
          time: record[0],
          activePower: (+record[3]).toFixed(4),
          state: this.getCompressorState(record[3])
        }
      }
      resultDataChunk = [...resultDataChunk, result];
      prevDate = record[0];
    });
    return _.sortBy(resultDataChunk, 'time');
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
}
