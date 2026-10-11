import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoService, Producto } from './services/catalogo.service';
import { PreciosService, PrecioStock } from './services/precios.service';
import { IndexedDbService, PedidoVenta } from './services/indexeddb.service';

interface ProductoItem extends Producto {
  precioActualizado?: number;
  stockActualizado?: number;
  fechaActualizado?: string;
  estrategiaPrecio?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private catalogoService = inject(CatalogoService);
  private preciosService = inject(PreciosService);
  private idbService = inject(IndexedDbService);

  // Estados de conectividad
  isOnline: boolean = navigator.onLine;
  simulatedOffline: boolean = false;

  // Catálogo y precios
  productos: ProductoItem[] = [];
  categoriaSeleccionada: string = 'TODAS';
  busqueda: string = '';
  
  // Métricas y estado del Service Worker
  swActivo: boolean = false;
  cacheCatalogoOk: boolean = false;
  cachePreciosOk: boolean = false;
  tiempoRespuestaMs: number = 0;

  // Carrito de ventas
  carrito: Array<{
    producto: ProductoItem;
    cantidad: number;
    subtotal: number;
  }> = [];
  nombreBodega: string = 'Bodega San Martín - San Juan de Lurigancho';
  modalCarritoVisible: boolean = false;

  // Notificación toast
  toastMensaje: string = '';
  toastTipo: 'success' | 'warning' | 'info' = 'info';
  toastVisible: boolean = false;

  // Historial offline
  pedidosPendientes: PedidoVenta[] = [];

  ngOnInit() {
    this.verificarServiceWorker();
    this.cargarDatos();
    this.escucharEventosRed();
    this.cargarPedidosPendientes();
  }

  get esConexionReal(): boolean {
    return this.isOnline && !this.simulatedOffline;
  }

  escucharEventosRed() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.lanzarToast('🟢 Conexión restablecida. Sincronizando datos de ventas...', 'success');
      this.cargarDatos();
      this.sincronizarPedidosPendientes();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.lanzarToast('⚡ Sin conexión. Modo offline activo (Cache Storage + IndexedDB).', 'warning');
    });
  }

  toggleSimulacionOffline() {
    this.simulatedOffline = !this.simulatedOffline;
    if (this.simulatedOffline) {
      this.lanzarToast('⚡ Simulación Offline activada: Consultando caché local.', 'warning');
    } else {
      this.lanzarToast('🟢 Reconectado con servidor central de Backus.', 'success');
      this.cargarDatos();
      this.sincronizarPedidosPendientes();
    }
  }

  async verificarServiceWorker() {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      this.swActivo = !!reg;
      if ('caches' in window) {
        const keys = await caches.keys();
        this.cacheCatalogoOk = keys.some(k => k.includes('catalogo'));
        this.cachePreciosOk = keys.some(k => k.includes('precios'));
      }
    }
  }

  cargarDatos() {
    const t0 = performance.now();

    // 1. Cargar catálogo (Strategy: performance en dataGroups)
    this.catalogoService.obtenerCatalogo().subscribe({
      next: (data) => {
        const t1 = performance.now();
        this.tiempoRespuestaMs = Math.round(t1 - t0);
        this.productos = data.map(p => ({
          ...p,
          precioActualizado: p.precio,
          stockActualizado: p.stock,
          estrategiaPrecio: 'Performance (Caché Prioritaria)'
        }));
        this.verificarServiceWorker();

        // 2. Cargar precios y stock frescos (Strategy: freshness en dataGroups)
        this.obtenerPreciosFrescos();
      },
      error: (err) => {
        console.warn('[App] Error al leer catálogo:', err);
      }
    });
  }

  obtenerPreciosFrescos() {
    this.preciosService.obtenerPrecios().subscribe({
      next: (precios) => {
        precios.forEach(pr => {
          const prod = this.productos.find(p => p.id === pr.productoId);
          if (prod) {
            prod.precioActualizado = pr.precio;
            prod.stockActualizado = pr.stock;
            prod.fechaActualizado = pr.actualizado;
            prod.estrategiaPrecio = 'Freshness (Red Prioritaria · 3s Timeout)';
          }
        });
      },
      error: () => {
        console.log('[App] Usando precios previos almacenados en caché por freshness fallback.');
      }
    });
  }

  get productosFiltrados(): ProductoItem[] {
    return this.productos.filter(p => {
      const coincideCat = this.categoriaSeleccionada === 'TODAS' || p.categoria === this.categoriaSeleccionada;
      const coincideBusqueda = p.nombre.toLowerCase().includes(this.busqueda.toLowerCase());
      return coincideCat && coincideBusqueda;
    });
  }

  agregarAlCarrito(prod: ProductoItem) {
    const item = this.carrito.find(i => i.producto.id === prod.id);
    const precio = prod.precioActualizado || prod.precio;

    if (item) {
      item.cantidad++;
      item.subtotal = item.cantidad * precio;
    } else {
      this.carrito.push({
        producto: prod,
        cantidad: 1,
        subtotal: precio
      });
    }

    this.lanzarToast(`+1 ${prod.nombre} añadido a la orden de venta.`, 'info');
  }

  cambiarCantidad(index: number, delta: number) {
    const item = this.carrito[index];
    item.cantidad += delta;
    if (item.cantidad <= 0) {
      this.carrito.splice(index, 1);
    } else {
      const precio = item.producto.precioActualizado || item.producto.precio;
      item.subtotal = item.cantidad * precio;
    }
  }

  get totalCarrito(): number {
    return this.carrito.reduce((sum, i) => sum + i.subtotal, 0);
  }

  get totalItemsCarrito(): number {
    return this.carrito.reduce((sum, i) => sum + i.cantidad, 0);
  }

  async confirmarPedido() {
    if (this.carrito.length === 0) return;

    const uuidLocal = 'ped-bk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const nuevoPedido: PedidoVenta = {
      uuid_local: uuidLocal,
      cliente_bodega: this.nombreBodega,
      total: this.totalCarrito,
      items: this.carrito.map(i => ({
        productoId: i.producto.id,
        nombre: i.producto.nombre,
        cantidad: i.cantidad,
        precio_unitario: i.producto.precioActualizado || i.producto.precio,
        subtotal: i.subtotal
      })),
      creado_en: new Date().toISOString(),
      status: this.esConexionReal ? 'SINCRONIZADO' : 'PENDIENTE_SYNC'
    };

    if (this.esConexionReal) {
      this.lanzarToast(`¡Pedido confirmado en línea! Total: S/ ${nuevoPedido.total.toFixed(2)}`, 'success');
    } else {
      await this.idbService.guardarPedidoOffline(nuevoPedido);
      this.cargarPedidosPendientes();
      this.lanzarToast(`¡Pedido guardado en IndexedDB! Se sincronizará al volver la señal.`, 'warning');
    }

    this.carrito = [];
    this.modalCarritoVisible = false;
  }

  async cargarPedidosPendientes() {
    this.pedidosPendientes = await this.idbService.obtenerPedidosPendientes();
  }

  async sincronizarPedidosPendientes() {
    if (!this.esConexionReal) return;
    const pendientes = await this.idbService.obtenerPedidosPendientes();
    for (const p of pendientes) {
      await this.idbService.marcarPedidoSincronizado(p.uuid_local);
    }
    this.cargarPedidosPendientes();
    if (pendientes.length > 0) {
      this.lanzarToast(`¡${pendientes.length} pedido(s) sincronizados con el servidor Backus!`, 'success');
    }
  }

  lanzarToast(mensaje: string, tipo: 'success' | 'warning' | 'info') {
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 3800);
  }
}
