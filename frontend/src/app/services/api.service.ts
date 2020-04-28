import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient, private configService: ConfigService) { }

  getProtectedApiResponse(): Observable<string> {
    const httpOptions = {
      headers: new HttpHeaders({
        // Add here your headers, for instance
        // 'My-Custom-Header-1':  'header 1 value',
        // 'My-Custom-Header-2':  'header 2 value'
      })
    };
    return this.http.get<any>(`${this.configService.apiUrl}/message`, httpOptions)
      .pipe(
        map(response => `☁ Date returned by API call: ${response}`),
        catchError((e: HttpErrorResponse) => of(`🌩 API Error: ${e.status} ${e.statusText}`)),
      );
  }
}
