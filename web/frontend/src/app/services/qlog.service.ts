import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QlogService {

  public logStream(topicName: string, controller: AbortController) {
    const { signal } = controller;
    return new Observable(observer => {
      fetchEventSource('http://localhost:4000/qlog/' + topicName, {
        method: 'GET',
        headers: {
            'Accept': 'text/event-stream',
            'Content-Type': 'text/event-stream',
        },
        onmessage(msg) {
          observer.next(msg);
        },
        signal,
        openWhenHidden: true
      });
    });
  }

}
