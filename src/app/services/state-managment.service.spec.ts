import { TestBed } from '@angular/core/testing';

import { StateManagmentService } from './state-managment.service';

describe('StateManagmentService', () => {
  let service: StateManagmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateManagmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
