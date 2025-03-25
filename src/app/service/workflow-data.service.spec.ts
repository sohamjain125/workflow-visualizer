import { TestBed } from '@angular/core/testing';

import { WorkflowDataService } from './workflow-data.service';

describe('WorkflowDataService', () => {
  let service: WorkflowDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkflowDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
