import { Injectable } from '@angular/core';
import { interval, Observable, Observer, Subject, SubscriptionLike } from 'rxjs';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { distinctUntilChanged, filter, map, share, takeWhile } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  public status: Observable<boolean>;

  private connection$: Observer<boolean> = new Subject();
  private socket$: WebSocketSubject<any> | null = null;
  private wsMessages$ = new Subject<any>();
  private reconnectInterval: number = 5000;
  private isConnected: boolean = false;
  private websocketSub: SubscriptionLike;
  private statusSub: SubscriptionLike;
  private reconnection$: Observable<number> | null = null;

  private config = {
    url: 'wss://www.bitmex.com/realtime?subscribe=tradeBin1m',
    closeObserver: {
      next: (event: CloseEvent) => {
        this.socket$ = null;
        this.connection$.next(false);
      }
    },
    openObserver: {
      next: (event: Event) => {
        console.log('WebSocket connected!');
        this.connection$.next(true);
      }
    }
  };

  constructor() {
    this.status = new Observable<boolean>((observer) => { this.connection$ = observer; })
      .pipe(
        share(),
        distinctUntilChanged(),
      );

    this.statusSub = this.status
      .subscribe((isConnected) => {
        this.isConnected = isConnected;

        if (!this.reconnection$ && typeof(isConnected) === 'boolean' && !isConnected) {
          this.reconnect();
        }
      });

    this.websocketSub = this.wsMessages$
      .subscribe(
        null,
        (error: ErrorEvent) => console.error('WebSocket error!', error)
      );

    this.connect();
  }

  ngOnDestroy() {
    this.websocketSub.unsubscribe();
    this.statusSub.unsubscribe();
  }

  public connect() {
    this.socket$ = new WebSocketSubject(this.config);

    this.socket$.subscribe(
      (message) => this.wsMessages$.next(message),
      (error: Event) => {
        if (!this.socket$) {
          this.reconnect();
        }
      });
  }

  public on<T>(event: string): Observable<T> | void {
    if (event) {
      return this.wsMessages$.pipe(
        filter((message) => message.event === event),
        map((message) => message.data)
      );
    }
  }

  public send(event: string, data: any = {}): void {
    if (event && this.isConnected && this.socket$) {
      this.socket$.next(<any>JSON.stringify({ event, data }));
    }
  }

  private reconnect() {
    this.reconnection$ = interval(this.reconnectInterval)
      .pipe(
        takeWhile((v) => !this.socket$),
      );
    this.reconnection$.subscribe(
      () => this.connect(),
      null,
      () => {
        if (!this.socket$) {
          this.wsMessages$.complete();
          this.connection$.complete();
        }
      }
    );
  }
}
