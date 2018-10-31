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

  public getCompressorData(slice: number) {
    return { headers: this.data.headers, content: this.data.content.slice(slice-1, slice) }
  }

  public async loadCompressorData() {
    const resp = await this.http.get(URL, { responseType: 'blob' }).toPromise();
    const content = await this.readData(resp);
    this.data = { headers: content[0].shift(), content };
    console.log('Data loaded successfully.');
  }

  private readData(data): Promise<any> {
    return new Promise((resolve, reject) => {
      let newBuffer: Array <any> = [];
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
