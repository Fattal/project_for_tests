import { Component } from '@angular/core';
import { WebsocketService } from './api/websocket/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.styl']
})
export class AppComponent {
  title = 'new-test-app';

  constructor(
    private ws: WebsocketService,
  ) {}

  public onClick() {
  }
}
