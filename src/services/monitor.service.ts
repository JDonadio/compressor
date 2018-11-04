import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

import { Papa } from 'ngx-papaparse';
import * as _ from 'lodash';

const URL = 'assets/signals.csv';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {
  public data: any;

  constructor(
    private http: HttpClient,
    private papa: Papa
  ) {
    this.data = null;
    console.log('Init monitor service');
  }

  /**
   * Returns the number of chunks specified as 'slice' parameter. Around ~177601 records
   * @param slice chunk number of the whole data loaded array
   */
  public getCompressorData(slice: number) {
    return { 
      headers: this.data.headers, 
      content: this.data.content.slice(slice-1, slice)[0] 
    }
  }

  /**
   * Request data as blob using http client and wait for the response
   * Process the blob data separating headers from content
   * Fill the 'data' variable content with the whole processed csv file
   */
  public async loadCompressorData() {
    const resp = await this.http.get(URL, { responseType: 'blob' }).toPromise();
    const content = await this.readAndParseContent(resp);
    this.data = { headers: content[0].shift(), content };
    console.log('Data loaded successfully.');
  }

  /**
   * Use Papaparse library to read and parse the csv file content
   * Every chunk contain around ~177601 records
   * Once parse process is completed return a buffer which contains all the records
   * @param data blob data response
   */
  private readAndParseContent(data): Promise<any> {
    return new Promise((resolve, reject) => {
      let newBuffer: Array<any> = [];

      this.papa.parse(data, {
        chunk: partialResult => {
          newBuffer = _.concat(newBuffer, [...newBuffer, partialResult.data]);
        },
        complete: result => resolve(newBuffer),
        error: error => reject(error)
      });
    })
  }
}
