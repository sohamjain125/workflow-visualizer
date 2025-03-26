import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// PrimeNG Imports
import { TreeModule } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { AppComponent } from './app.component';
import { WorkflowVisualizerComponent } from './workflow-visualizer/workflow-visualizer.component';
import { MessageService } from 'primeng/api';
import { WorkflowDataService } from './service/workflow-data.service';
import { TruncatePipe } from './truncate.pipe';

@NgModule({
  declarations: [
    AppComponent,
    WorkflowVisualizerComponent,
    TruncatePipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    InputTextareaModule,
    FileUploadModule,
    // PrimeNG Modules
    TreeModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    MenuModule,
    TooltipModule,
    ToastModule,
    CheckboxModule,
    MultiSelectModule,
    
  ],
  providers: [MessageService,WorkflowDataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
