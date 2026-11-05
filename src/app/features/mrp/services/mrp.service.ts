import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MrpPayload } from '../models/mrp.model';

@Injectable({ providedIn: 'root' })
export class MrpService {
  private readonly http = inject(HttpClient);

  ejecutar(payload: MrpPayload): Observable<unknown> {
    return this.http.post<unknown>(`${environment.mrpApiUrl}/planificaciones`, payload);
  }
}
