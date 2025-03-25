// src/app/services/workflow-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkflowDataService {
  private apiUrl = 'https://localhost:7183/api/WorkflowData'; // Update with your actual API port

  constructor(private http: HttpClient) { }

  getEmailTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/emailtemplates`);
  }

  getAddressees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/addressees`);
  }
}