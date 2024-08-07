import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { QlogService } from './services/qlog.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  private logStreamSubscription: Subscription | undefined;
  logs: any[] = [];
  abortController: AbortController | undefined;
  topicName: string = '';

  constructor(private qlogService: QlogService) {}

  ngOnInit(): void {
  }

  start() {
    if (this.topicName) {
      this.logs = [];
      this.abortController = new AbortController();
      this.logStreamSubscription = this.qlogService.logStream(this.topicName, this.abortController).subscribe({
        next: (response) => this.handleSuccessResponse(response),
        error: (errResponse) => this.handleErrorResponse(errResponse),
      });
    }
  }
  stop() {
    this.logStreamSubscription?.unsubscribe();
    this.abortController?.abort();
    this.topicName = '';
  }
  handleSuccessResponse(response: any) {
    console.log(response);
    const logObj = JSON.parse(response.data);
    this.logs = [...this.logs, logObj];
  }
  handleErrorResponse(error: any) {
    console.error(error);
  }
}
