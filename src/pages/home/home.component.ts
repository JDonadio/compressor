import { Component, OnInit } from '@angular/core';
import { MonitorService } from 'src/services/monitor.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(
    private monitorService: MonitorService,
  ) {}

  ngOnInit() {
    this.monitorService.getCompressorData()
      .then(res => { console.log(res) })
  }

  readSignals() {
  }
}
