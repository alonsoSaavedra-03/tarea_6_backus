const fs = require('fs');
const path = require('path');

const reportData = {
  tarea_mas_significativa: "TALLER 2: PWA con Angular 19 y Runtime Caching — Caso Académico Backus Ventas: 'Ventas que no se detienen, aunque se caiga la señal'",
  items: [
    // Encabezado institucional y metadatos
    {
      type: "h1",
      text: "INFORME TÉCNICO DE LABORATORIO: PWA CON ANGULAR 19 Y RUNTIME CACHING"
    },
    {
      type: "p",
      boldPrefix: "Programa Profesional:",
      text: "Ingeniería de Software con Inteligencia Artificial / Desarrollo de Aplicaciones Web"
    },
    {
      type: "p",
      boldPrefix: "Instructor del Curso:",
      text: "Jorge Antonio Luque Chambi"
    },
    {
      type: "p",
      boldPrefix: "Estudiante:",
      text: "Alonso Stevens Saavedra Donayre"
    },
    {
      type: "p",
      boldPrefix: "Operación Principal:",
      text: "Implementación de estrategias de Runtime Caching con Angular Service Worker (@angular/service-worker y ngsw-config.json)"
    },
    {
      type: "p",
      boldPrefix: "Caso de Estudio:",
      text: "Backus Ventas Móvil — Fuerza de ventas en ruta para bodegas, minimarkets y restaurantes con cobertura intermitente"
    },
    {
      type: "p",
      boldPrefix: "Nota de Alcance Académico:",
      text: "Backus se utiliza como escenario académico e ilustrativo. Catálogos, rutas, precios, metas y esquemas son supuestos didácticos y no representan sistemas internos ni datos comerciales confidenciales de la corporación."
    },

    // 1. Situación Problemática y Reto
    {
      type: "h1",
      text: "1. SITUACIÓN PROBLEMÁTICA Y RETO DE INGENIERÍA"
    },
    {
      type: "p",
      boldPrefix: "Contexto Real de Operación:",
      text: "La fuerza de ventas de consumo masivo visita a diario cientos de bodegas, restaurantes y mercados en zonas urbanas y periféricas del Perú donde la cobertura celular 4G/5G oscila drásticamente o se interrumpe por completo (zonas de sombra, sótanos, mercados techados). En una aplicación web convencional basada únicamente en arquitectura cliente-servidor tradicional, la pérdida momentánea de señal bloquea la carga de vistas, impide consultar el inventario disponible y frustra el registro de la preventa, ocasionando tiempos muertos y pérdidas de pedidos."
    },
    {
      type: "p",
      boldPrefix: "El Reto Planteado:",
      text: "¿Cómo diseñar e implementar una Progressive Web App (PWA) con Angular 19 de modo que el agente de ventas pueda navegar fluidamente por el catálogo de productos cuando pierda la conectividad a Internet, sin tratar los precios y stocks como si fueran datos estáticos invariables?"
    },
    {
      type: "p",
      boldPrefix: "Hipótesis de Solución Técnica:",
      text: "La solución requiere desacoplar el ciclo de vida del catálogo estático respecto a los datos comerciales volátiles mediante Runtime Caching diferencial. Aplicando la estrategia 'performance' para el catálogo base logramos disponibilidad instantánea offline (Cache First); mientras que aplicando 'freshness' con un timeout estricto de 3 segundos para precios y stocks (Network First con fallback a caché), garantizamos que el vendedor obtenga las tarifas más actualizadas siempre que haya red disponible, sin bloquearse jamás en caso de corte total."
    },

    // 2. Actividad Preinstruccional - Saberes Previos
    {
      type: "h1",
      text: "2. ACTIVIDAD PREINSTRUCCIONAL — SABERES PREVIOS (EVALUACIÓN INICIAL)"
    },
    {
      type: "p",
      boldPrefix: "Pregunta 1: ¿Qué diferencia existe entre una PWA y una aplicación web convencional?",
      text: "Una aplicación web tradicional depende enteramente de la conexión continua al servidor remoto para descargar activos HTML/JS y realizar solicitudes HTTP; ante la caída de red, muestra la pantalla de error del navegador ('Sin conexión'). En contraste, una Progressive Web App (PWA) incorpora Service Workers que interceptan el tráfico de red en segundo plano, almacena en caché el App Shell y datos en Cache Storage/IndexedDB, dispone de un Web App Manifest para instalación nativa sin pasar por tiendas de aplicaciones y funciona de forma resiliente tanto online como offline."
    },
    {
      type: "p",
      boldPrefix: "Pregunta 2: ¿Qué función cumple un Service Worker?",
      text: "Un Service Worker es un script de fondo (background worker) independiente del hilo principal de JavaScript que actúa como un servidor proxy de red programable alojado en el propio navegador cliente. Sus funciones capitales son: interceptar peticiones Fetch de la aplicación, gestionar el almacenamiento y recuperación en Cache Storage según reglas de caching, gestionar notificaciones Push y ejecutar sincronización en segundo plano (Background Sync API)."
    },
    {
      type: "p",
      boldPrefix: "Pregunta 3: ¿Qué significa que una aplicación funcione offline?",
      text: "Significa que la aplicación puede iniciar, renderizar su interfaz de usuario completa (App Shell), permitir la navegación por sus pantallas y habilitar la consulta e interacción con datos previamente sincronizados, todo ello sin arrojar errores de red ni quedar bloqueada cuando el dispositivo carece por completo de conexión a Internet o experimenta una red intermitente (Lie-Fi)."
    },
    {
      type: "p",
      boldPrefix: "Pregunta 4: ¿Qué información de un sistema de ventas debería estar disponible sin conexión?",
      text: "Debe estar disponible: 1) El catálogo general de productos (códigos SKU, nombres comerciales, descripciones, marcas, categorías y fotografías optimizadas); 2) Lista de clientes asignados a la ruta del día con dirección y teléfonos; 3) Última lista de precios de lista conocida con fecha y hora de vigencia; 4) Módulo de registro de preventa local (carrito de compras) para almacenar órdenes en cola mediante IndexedDB."
    },
    {
      type: "p",
      boldPrefix: "Pregunta 5: ¿Un precio debería tratarse igual que una imagen de producto? ¿Por qué?",
      text: "No, en absoluto. Una imagen de producto es un recurso estático de gran peso en bytes que cambia muy raramente (meses o años); por lo tanto, debe almacenarse bajo una estrategia agresiva de rendimiento ('performance' / Cache First) con tiempos de vida largos (días o semanas). Por el contrario, los precios y niveles de stock son datos de negocio altamente volátiles y críticos que varían constantemente según campañas comerciales y disponibilidad de planta; tratarlos con caché prolongada generaría pedidos con precios desfasados y reclamos contables. Su estrategia obligatoria debe ser de frescura ('freshness' / Network First) con un timeout de fallback corto."
    },

    // 3. Arquitectura y Tecnologías
    {
      type: "h1",
      text: "3. ARQUITECTURA TECNOLÓGICA Y ENTORNO DE DESARROLLO"
    },
    {
      type: "p",
      boldPrefix: "Entorno de Ejecución:",
      text: "El proyecto se fundamenta en Angular 19 Standalone Components con Node.js v24.18.0 LTS y TypeScript 5.6. La capa de service worker se implementa con el paquete oficial @angular/service-worker gestionado mediante ngsw-config.json."
    },
    {
      type: "table",
      headers: ["Componente / Herramienta", "Versión y Función en la Solución"],
      rows: [
        ["Angular Framework", "Angular 19.2 (Standalone Components, Signals, Control Flow @if/@for)"],
        ["Angular Service Worker", "@angular/service-worker (ngsw-worker.js) y manifest ngsw.json"],
        ["Runtime Caching Module", "dataGroups en ngsw-config.json (estrategias performance y freshness)"],
        ["Base de Datos Local", "IndexedDB ('BackusVentasDB') para cola de preventas offline"],
        ["Entorno HTTP Server", "Node.js Express + http-server en puerto TCP 8080 (producción PWA)"],
        ["Validación y Auditoría", "Google Chrome DevTools (Application, Network, Lighthouse PWA Audit)"]
      ]
    },

    // 4. Implementación Paso a Paso de los Ejercicios
    {
      type: "h1",
      text: "4. DESARROLLO TÉCNICO DE LOS EJERCICIOS DEL TALLER"
    },
    {
      type: "h2",
      text: "Ejercicio 1 y 2: Creación de la PWA y Catálogo Académico Ficticio"
    },
    {
      type: "p",
      boldPrefix: "Estructura de Archivos:",
      text: "Se generó el proyecto base 'backus-ventas-pwa' con soporte PWA nativo mediante 'ng add @angular/pwa'. Para garantizar la disponibilidad estática y prevenir colisiones de enrutamiento SPA, los datos se ubicaron en la carpeta 'public/data/' de Angular 19:"
    },
    {
      type: "bullet",
      boldPrefix: "public/data/catalogo.json:",
      text: "Contiene la matriz de SKUs (Cristal 620ml, Pilsen Callao 620ml, Cusqueña Dorada 620ml, Agua San Mateo 600ml, Gaseosa Guaraná 500ml, Maltin Power 330ml), con sus categorías y descripciones."
    },
    {
      type: "bullet",
      boldPrefix: "public/data/precios.json:",
      text: "Contiene la estructura de precios en soles, stock en tiempo real en almacén central y la marca temporal de actualización ('2026-10-01T09:00:00')."
    },

    {
      type: "h2",
      text: "Ejercicio 3: Consumo de Datos con HttpClient y Signals"
    },
    {
      type: "p",
      boldPrefix: "Configuración de Servicios:",
      text: "En app.config.ts se proveyeron provideHttpClient() y provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() }). Se construyeron dos servicios modulares: CatalogoService para obtener '/data/catalogo.json' y PreciosService para consultar '/data/precios.json', consumidos reactivamente por el componente principal de ventas."
    },

    {
      type: "h2",
      text: "Ejercicio 4 y 5: Configuración de Runtime Caching en ngsw-config.json"
    },
    {
      type: "p",
      boldPrefix: "Reglas de Caching en dataGroups:",
      text: "La configuración en ngsw-config.json establece la diferenciación estricta entre disponibilidad (performance) y vigencia (freshness):"
    },
    {
      type: "table",
      headers: ["Recurso / Endpoint", "Configuración NGSW", "Estrategia", "Parámetros Clave", "Justificación Técnica de Negocio"],
      rows: [
        [
          "/data/catalogo.json",
          "dataGroups: catalogo-backus",
          "performance",
          "maxSize: 20, maxAge: 1d",
          "Prioriza Caché (Cache First). Garantiza que el catálogo abra al instante sin esperar la red, ideal en zonas sin cobertura."
        ],
        [
          "/data/precios.json",
          "dataGroups: precios-backus",
          "freshness",
          "timeout: 3s, maxSize: 20, maxAge: 1h",
          "Prioriza Red (Network First). Consulta al servidor para obtener precios recientes; si no responde en 3s o no hay red, usa la copia en caché."
        ],
        [
          "/icons/*, /img/*",
          "assetGroups: assets",
          "performance",
          "installMode: prefetch, updateMode: prefetch",
          "Recursos estáticos de interfaz que no varían; deben residir permanentemente en caché local."
        ]
      ]
    },
    {
      type: "p",
      boldPrefix: "Advertencia Técnica Clave:",
      text: "En el Angular Service Worker oficial, los valores válidos para la propiedad 'strategy' son exactamente las cadenas 'performance' y 'freshness'. No se deben escribir literalmente términos como 'Cache First' o 'Network First' en el JSON, ya que provocarían que el compilador ngsw descarte la regla."
    },

    // 5. Build, Despliegue y Pruebas Offline
    {
      type: "h1",
      text: "5. BUILD DE PRODUCCIÓN, PRUEBAS Y VALIDACIÓN EN DEVTOOLS"
    },
    {
      type: "p",
      boldPrefix: "Compilación de Producción:",
      text: "Se ejecutó el comando 'ng build --configuration production', generando los artefactos optimizados en 'dist/backus-ventas-pwa/browser', incluyendo el service worker compilado ngsw-worker.js y el manifiesto ngsw.json con los hashes criptográficos SHA-1 de cada recurso."
    },
    {
      type: "p",
      boldPrefix: "Ejecución del Servidor Local:",
      text: "Se levantó el servicio de producción en el puerto TCP 8080. Se diseñó una interfaz minimalista con aviso dual de conectividad (Banner verde 'En Línea - Conectado al Almacén Central' vs Banner ámbar 'Modo Offline - Trabajando con Caché Local') y un panel de diagnóstico del Service Worker en tiempo real."
    },

    // 6. Evidencias y Capturas del Sistema
    {
      type: "h1",
      text: "6. REGISTRO DE EVIDENCIAS TÉCNICAS (CAPTURAS DE PANTALLA)"
    },

    // Captura 1
    {
      type: "box",
      title: "FIGURA 1: PORTAL CENTRAL Y MATRIZ TÉCNICA TALLER 2 — BACKUS VENTAS PWA",
      placeholderText: "[ ESPACIO PARA CAPTURA 1: PORTAL DE ACCESO Y MATRIZ TÉCNICA ]",
      desc: "Vista general del portal del Taller 2 en http://localhost:8080/portal.html con acceso a la PWA de Ventas, simulador de Chrome DevTools, infografía arquitectónica y matriz de estrategias runtime."
    },

    // Captura 2
    {
      type: "box",
      title: "FIGURA 2: PWA EN MODO ONLINE CON AVISO DE CONEXIÓN Y ESTRATEGIA RUNTIME",
      placeholderText: "[ ESPACIO PARA CAPTURA 2: PWA MODO ONLINE Y BADGES DE CACHÉ ]",
      desc: "Interfaz minimalista de Backus Ventas en modo online. Se aprecia el banner de estado 'En Línea (Conectado a Central Backus)', los badges 'Cache: performance' en catálogo y 'Network First: freshness (timeout 3s)' en precios."
    },

    // Captura 3
    {
      type: "box",
      title: "FIGURA 3: PRUEBA DE RESILENCIA OFFLINE — CATÁLOGO OPERATIVO SIN CONEXIÓN",
      placeholderText: "[ ESPACIO PARA CAPTURA 3: PRUEBA OFFLINE Y AVISO VISIBLE ]",
      desc: "Simulación de desconexión (Offline). El sistema emite inmediatamente el aviso de desconexión 'Modo Offline - Trabajando con Caché Local' sin colapsar, manteniendo visible el catálogo completo recuperado de Cache Storage."
    },

    // Captura 4
    {
      type: "box",
      title: "FIGURA 4: REGISTRO DE PREVENTA EN BODEGA Y ALMACENAMIENTO EN INDEXEDDB",
      placeholderText: "[ ESPACIO PARA CAPTURA 4: CARRITO Y PREVENTA EN INDEXEDDB ]",
      desc: "Registro de preventa para una bodega cliente en ruta sin señal. La orden se almacena de forma persistente en la base de datos local IndexedDB ('BackusVentasDB') en cola de sincronización."
    },

    // Captura 5
    {
      type: "box",
      title: "FIGURA 5: VERIFICACIÓN EN CHROME DEVTOOLS (SERVICE WORKER Y CACHE STORAGE)",
      placeholderText: "[ ESPACIO PARA CAPTURA 5: DEVTOOLS APPLICATION Y CACHE PARTITIONS ]",
      desc: "Evidencia de inspección en Chrome DevTools (Application > Service Workers y Cache Storage). Se observan el Service Worker 'ngsw-worker.js' activo y las particiones de caché 'ngsw:/:data:catalogo-backus:cache' y 'ngsw:/:data:precios-backus:cache'."
    },

    // Captura 6
    {
      type: "box",
      title: "FIGURA 6: INFOGRAFÍA ARQUITECTÓNICA DE RUNTIME CACHING EN ANGULAR 19",
      placeholderText: "[ ESPACIO PARA CAPTURA 6: INFOGRAFÍA TÉCNICA DEL FLUJO DE CACHÉ ]",
      desc: "Diagrama visual infográfico explicativo del flujo de peticiones HTTP frente al Service Worker, ilustrando la bifurcación entre la estrategia Performance (Catálogo) y Freshness con Timeout de 3s (Precios/Stock)."
    },

    // 7. Análisis de la Evidencia y Preguntas de Profundización
    {
      type: "h1",
      text: "7. ANÁLISIS DE LA EVIDENCIA Y PREGUNTAS TÉCNICAS (EJERCICIO 10)"
    },
    {
      type: "table",
      headers: ["Recurso Analizado", "Estrategia NGSW", "Prioridad Inicial", "Justificación Técnica del Comportamiento"],
      rows: [
        ["Catálogo de Productos", "performance", "Caché Local", "Maximiza la velocidad de carga (0 ms de red) y garantiza que el vendedor vea los productos en zonas de sombra."],
        ["Lista de Precios", "freshness", "Red Central", "Prioriza consultar el servidor central; si la respuesta tarda más de 3 segundos o no hay conexión, recurre a la última tarifa en caché."],
        ["Nivel de Stock", "freshness", "Red Central", "Evita comprometer existencias que ya no existen en almacén; si está offline, se advierte que el stock mostrado es referencial."],
        ["Imágenes y Logotipos", "performance", "Caché Local", "Son archivos multimedia pesados invariables. Descargarlos cada vez saturaría el ancho de banda del plan móvil del vendedor."]
      ]
    },
    {
      type: "p",
      boldPrefix: "¿Qué podría ocurrir si se utiliza 'performance' durante demasiado tiempo para información que cambia con frecuencia?:",
      text: "Si se aplica 'performance' a datos volátiles como precios o stock con un 'maxAge' muy prolongado (por ejemplo, 30 días), el navegador continuará sirviendo indefinidamente los datos obsoletos desde Cache Storage sin realizar solicitudes al servidor. En el caso de Backus, esto provocaría que los vendedores registren preventas con precios desactualizados o prometan mercadería agotada, acarreando desfases contables severos, cancelación de pedidos y quejas comerciales de las bodegas."
    },

    // 8. Actualización de Contenido y Diferenciación Técnica (Ejercicio 11)
    {
      type: "h1",
      text: "8. ACTUALIZACIÓN DE CONTENIDO: APP SHELL VS DATOS RUNTIME (EJERCICIO 11)"
    },
    {
      type: "p",
      boldPrefix: "Diferencia Fundamental:",
      text: "En una PWA con Angular Service Worker existen dos mundos de caché completamente diferenciados:"
    },
    {
      type: "bullet",
      boldPrefix: "1. Recursos del Build (App Shell / assetGroups):",
      text: "Son los archivos generados en tiempo de compilación (HTML, bundles de JS, CSS, fuentes). El Service Worker los gestiona mediante hashes criptográficos en ngsw.json. Cuando se publica una nueva versión de la app, el worker detecta el cambio de hash en background, descarga la nueva versión en paralelo y notifica a la aplicación para recargar sin fricciones."
    },
    {
      type: "bullet",
      boldPrefix: "2. Datos de Runtime (dataGroups):",
      text: "Son las respuestas a peticiones HTTP/API que ocurren dinámicamente mientras el usuario opera el aplicativo. No tienen hash en el build; su ciclo de vida depende exclusivamente de la estrategia configurada ('performance' o 'freshness'), el tiempo de expiración ('maxAge') y el tamaño máximo del almacén ('maxSize')."
    },

    // 9. Push Notifications y Pedidos Offline (Ejercicios 12 y 13)
    {
      type: "h1",
      text: "9. EXTENSIÓN CONCEPTUAL: PUSH NOTIFICATIONS Y PEDIDOS OFFLINE"
    },
    {
      type: "h2",
      text: "Push Notifications: Escenarios de Aplicación y Componentes Reales"
    },
    {
      type: "table",
      headers: ["Escenario de Negocio", "Tipo de Notificación", "Comportamiento del Service Worker en el Móvil"],
      rows: [
        ["Pedido Confirmado", "Transaccional", "Informa al vendedor que la orden de preventa fue procesada con éxito por el ERP de Backus."],
        ["Cambio de Precio Urgente", "Alerta Crítica", "Actualiza la caché de precios en background e invalida la partición de freshness previa."],
        ["Nueva Promoción Comercial", "Marketing Operativo", "Notifica descuentos especiales por volumen de cerveza (ej. 'Pack Cristal 620ml')."],
        ["Actualización de Catálogo", "Mantenimiento", "Despierta el worker para pre-descargar nuevos SKUs antes de iniciar la ruta."]
      ]
    },
    {
      type: "p",
      boldPrefix: "Componentes necesarios para Push en producción:",
      text: "Para operar en un entorno real se requieren: 1) Par de claves criptográficas VAPID (Voluntary Application Server Identification); 2) Servicio de Push del navegador (FCM para Chrome, Mozilla Push Service para Firefox); 3) Servidor de aplicaciones backend (Node.js/Spring Boot) que almacene los PushSubscription endpoints; 4) Registro del listener 'push' en el Service Worker para renderizar la notificación nativa mediante self.registration.showNotification()."
    },

    {
      type: "h2",
      text: "Flujo de Ingeniería para Pedidos Offline con IndexedDB y Sincronización"
    },
    {
      type: "bullet",
      boldPrefix: "Paso 1 - Registro Local:",
      text: "El vendedor selecciona los productos y confirma el pedido en la UI. Si navigator.onLine es false o la API falla, la transacción no se aborta."
    },
    {
      type: "bullet",
      boldPrefix: "Paso 2 - Persistencia en IndexedDB:",
      text: "El pedido se serializa en el almacén de objetos 'pedidos' de IndexedDB con el atributo 'estado: PENDIENTE_SINCRONIZACION' y un timestamp ISO."
    },
    {
      type: "bullet",
      boldPrefix: "Paso 3 - Registro de Background Sync:",
      text: "La aplicación registra una tarea en la Background Sync API (registration.sync.register('sync-pedidos-backus')). Si el navegador no soporta esta API, se activa un listener reactivo 'window.addEventListener(\"online\", ...)')."
    },
    {
      type: "bullet",
      boldPrefix: "Paso 4 - Detección de Conexión y Reintento:",
      text: "Al recuperar la conectividad, el Service Worker o el listener lee los registros pendientes de IndexedDB y los envía secuencialmente al backend mediante peticiones POST con idempotencia."
    },
    {
      type: "bullet",
      boldPrefix: "Paso 5 - Confirmación y Conciliación:",
      text: "La API responde con el código de confirmación del pedido; el estado en IndexedDB cambia a 'CONFIRMADO' y se emite una notificación al vendedor confirmando que su preventa ya está en planta."
    },

    // 10. Conclusiones y Logros de Aprendizaje
    {
      type: "h1",
      text: "10. CONCLUSIONES TÉCNICAS Y LOGROS DE APRENDIZAJE"
    },
    {
      type: "bullet",
      boldPrefix: "1. Autonomía Operativa Garantizada:",
      text: "Se comprobó empíricamente que la configuración de dataGroups en Angular 19 permite que una solución de ventas opere sin interrupciones ante caídas de señal, eliminando el riesgo de paradas en ruta."
    },
    {
      type: "bullet",
      boldPrefix: "2. Caching Estratégico Diferencial:",
      text: "Se demostró que la separación entre 'performance' (para catálogos) y 'freshness' (para precios/stock con timeout de 3s) es el patrón óptimo para conciliar alta disponibilidad offline con veracidad financiera de datos."
    },
    {
      type: "bullet",
      boldPrefix: "3. Experiencia de Usuario Transparente:",
      text: "El diseño minimalista con avisos de conectividad duales (online y offline) ofrece al vendedor certidumbre sobre el origen de los datos que está consultando, reforzando la confianza en el sistema."
    },
    {
      type: "bullet",
      boldPrefix: "4. Escalabilidad Hacia la Nube:",
      text: "La arquitectura desarrollada está completamente desacoplada y lista para su despliegue continuo en plataformas serverless como Vercel y su sincronización con microservicios en la nube."
    }
  ]
};

const outputPath = path.join(__dirname, 'backus_report_data.json');
fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2), 'utf-8');
console.log(`JSON generated successfully at: ${outputPath}`);
