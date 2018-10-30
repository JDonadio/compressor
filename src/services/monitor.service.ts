import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Papa } from 'ngx-papaparse';

const URL = 'assets/signals.csv';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {

  constructor(
    private http: HttpClient,
    private papa: Papa
  ) {
    console.log('Init monitor service');
  }

  public async getCompressorData() {
    const response = await this.http.get(URL, { responseType: 'blob' }).toPromise();
    console.log(response)
    const result = await this.readSignals(response);
    console.log(result)
    return result;
  }

  public readSignals(data): Promise<any> {
    return new Promise((resolve, reject) => {
      let buffer: Array <any> = [];

      this.papa.parse(data, {
        chunk: partialResult => { console.log(partialResult); [...buffer, partialResult] },
        complete: result => { console.log('done'); resolve(buffer) },
        error: error => { console.log(error); reject(error) }
      });
    })
  }
}
