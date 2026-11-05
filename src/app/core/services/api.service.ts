import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

function toHttpParams(params?: Record<string, string | number | boolean>): HttpParams {
  let httpParams = new HttpParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      httpParams = httpParams.set(key, String(value));
    });
  }
  return httpParams;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getAll<TResponse>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): Observable<TResponse[]> {
    return this.http.get<TResponse[]>(`${environment.apiUrl}/${endpoint}`, { params: toHttpParams(params) });
  }

  getById<TResponse>(endpoint: string, id: number | string): Observable<TResponse> {
    return this.http.get<TResponse>(`${environment.apiUrl}/${endpoint}/${id}`);
  }

  get<TResponse>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): Observable<TResponse> {
    return this.http.get<TResponse>(`${environment.apiUrl}/${endpoint}`, { params: toHttpParams(params) });
  }

  download(
    endpoint: string,
    fallbackFilename: string,
    params?: Record<string, string | number | boolean>,
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${environment.apiUrl}/${endpoint}`, {
      params: toHttpParams(params),
      responseType: 'blob',
      observe: 'response',
    });
  }

  create<TRequest, TResponse>(endpoint: string, data: Partial<TRequest>): Observable<TResponse> {
    return this.http.post<TResponse>(`${environment.apiUrl}/${endpoint}`, data);
  }

  post<TRequest, TResponse>(endpoint: string, data: Partial<TRequest>): Observable<TResponse> {
    return this.http.post<TResponse>(`${environment.apiUrl}/${endpoint}`, data);
  }

  update<TRequest, TResponse>(
    endpoint: string,
    id: number | string,
    data: Partial<TRequest>,
  ): Observable<TResponse> {
    return this.http.put<TResponse>(`${environment.apiUrl}/${endpoint}/${id}`, data);
  }

  put<TResponse>(endpoint: string, data: unknown = {}): Observable<TResponse> {
    return this.http.put<TResponse>(`${environment.apiUrl}/${endpoint}`, data);
  }

  patch<TResponse>(endpoint: string, data: unknown = {}): Observable<TResponse> {
    return this.http.patch<TResponse>(`${environment.apiUrl}/${endpoint}`, data);
  }

  delete<TResponse>(endpoint: string, id: number | string): Observable<TResponse> {
    return this.http.delete<TResponse>(`${environment.apiUrl}/${endpoint}/${id}`);
  }
}
