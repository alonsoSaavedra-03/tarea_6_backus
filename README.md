# Backus Ventas B2B — PWA con Angular 19 y Runtime Caching

> **Caso Académico:** "Ventas que no se detienen, aunque se caiga la señal"  
> **Institución:** SENATI  
> **Instructor:** Jorge Antonio Luque Chambi  
> **Estudiante:** Alonso Stevens Saavedra Donayre  
> **Operación:** Implementación de Caché con Angular Service Worker (@angular/service-worker y ngsw-config.json)  

---

## 1. Descripción del Proyecto

Aplicación Web Progresiva (PWA) de nivel empresarial diseñada para la fuerza de ventas en ruta de Backus (distribución de bebidas para bodegas, restaurantes y minimarkets). 

En escenarios de ruta donde la cobertura móvil 4G/5G es inestable o inexistente (zonas de sombra, sótanos o mercados techados), la arquitectura garantiza navegación continua del portafolio comercial y captura ininterrumpida de pedidos de preventa.

---

## 2. Estrategias de Runtime Caching (`ngsw-config.json`)

La solución implementa una estrategia de caché diferencial mediante `dataGroups`:

| Recurso | Grupo NGSW | Estrategia | Parámetros | Justificación Técnica |
| :--- | :--- | :--- | :--- | :--- |
| `/data/catalogo.json` | `catalogo-backus` | `performance` | `maxSize: 20`, `maxAge: 1d` | **Cache First:** Prioriza respuesta local inmediata (0 ms de red). Los nombres y presentaciones de bebidas no varían durante la jornada. |
| `/data/precios.json` | `precios-backus` | `freshness` | `timeout: 3s`, `maxSize: 20`, `maxAge: 1h` | **Network First:** Prioriza consulta al servidor para obtener tarifas y stock recientes. Si la red demora más de 3 segundos o se interrumpe, recurre a la última tarifa en caché. |
| App Shell (HTML/CSS/JS) | `app` | `prefetch` | Hashes SHA-1 en `ngsw.json` | Carga instantánea del cascarón de la interfaz en modo offline. |

---

## 3. Arquitectura y Tecnologías

- **Frontend:** Angular 19 Standalone Architecture + HTML5 Semántico + CSS3 B2B Enterprise.
- **Service Worker:** `@angular/service-worker` (`ngsw-worker.js`).
- **Alertas y Diálogos:** SweetAlert2 (`sweetalert2`) integrado localmente para alertas de red y confirmación de preventas.
- **Almacenamiento Local Offline:** IndexedDB (`BackusVentasDB`) para almacenamiento transaccional de órdenes de preventa pendientes de sincronización.
- **Backend / API:** Node.js Express con soporte Serverless para Vercel (`api/index.js`).

---

## 4. Ejecución en Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor local
npm start
```

Abrir en navegador:
- App PWA: [http://localhost:8080/](http://localhost:8080/)
- Portal de Laboratorio: [http://localhost:8080/portal.html](http://localhost:8080/portal.html)
- Evidencias DevTools: [http://localhost:8080/devtools.html](http://localhost:8080/devtools.html)
