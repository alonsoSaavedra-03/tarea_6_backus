import { Injectable } from '@angular/core';

export interface PedidoVenta {
  uuid_local: string;
  cliente_bodega: string;
  total: number;
  items: Array<{
    productoId: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  creado_en: string;
  status: 'PENDIENTE_SYNC' | 'SINCRONIZADO';
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbName = 'BackusVentasDB';
  private dbVersion = 1;
  private storeName = 'pedidos_offline';

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.dbVersion);

      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'uuid_local' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async guardarPedidoOffline(pedido: PedidoVenta): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(pedido);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async obtenerPedidosPendientes(): Promise<PedidoVenta[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => {
        const list: PedidoVenta[] = req.result || [];
        resolve(list.filter(p => p.status === 'PENDIENTE_SYNC'));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async marcarPedidoSincronizado(uuidLocal: string): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const getReq = store.get(uuidLocal);
      getReq.onsuccess = () => {
        const p = getReq.result;
        if (p) {
          p.status = 'SINCRONIZADO';
          store.put(p);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
}
