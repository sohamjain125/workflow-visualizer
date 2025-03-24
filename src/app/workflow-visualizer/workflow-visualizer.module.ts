import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowVisualizerComponent } from './workflow-visualizer.component';

// PrimeNG Imports
import { TreeModule } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    WorkflowVisualizerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TreeModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    FileUploadModule,
    DialogModule,
    MultiSelectModule,
    InputTextareaModule,
    ToastModule,
    MenuModule
  ],
  exports: [
    WorkflowVisualizerComponent
  ],
  providers: [
    MessageService
  ]
})
export class WorkflowVisualizerModule { } 