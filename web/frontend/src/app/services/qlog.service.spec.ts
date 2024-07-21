import { TestBed } from '@angular/core/testing';

import { QlogService } from './qlog.service';

describe('QlogService', () => {
  let service: QlogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QlogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
