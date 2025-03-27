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

  getEmailTemplates(licenseId: number, applicationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/emailtemplates?licenseId=${licenseId}&applicationTypeId=${applicationId}`);
  }

  getAddressees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/addressees`);
  }

  getAssignedStaff(licenseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assignedstaff?licenseId=${licenseId}`);
  }
  getSmsTemplates(licenseId: number, applicationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/smstemplates?licenseId=${licenseId}&applicationTypeId=${applicationId}`);
  }
}