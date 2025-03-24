import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowVisualizerComponent } from './workflow-visualizer.component';

describe('WorkflowVisualizerComponent', () => {
  let component: WorkflowVisualizerComponent;
  let fixture: ComponentFixture<WorkflowVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowVisualizerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
