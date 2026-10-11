import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PrecioStock {
  productoId: number;
  precio: number;
  stock: number;
  actualizado: string;
}

@Injectable({
  providedIn: 'root'
})
export class PreciosService {
  private http = inject(HttpClient);

  obtenerPrecios(): Observable<PrecioStock[]> {
    return this.http.get<PrecioStock[]>('/data/precios.json');
  }
}
