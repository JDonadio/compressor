import { Component } from '@angular/core';
import { MonitorService } from 'src/services/monitor.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'compressor';

  constructor(
    private monitorService: MonitorService,
  ) {
    // this.monitorService.init();
  }
}
