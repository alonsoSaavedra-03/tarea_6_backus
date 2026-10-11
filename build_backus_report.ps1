$ErrorActionPreference = "Stop"

$templatePath = "C:\Users\likin\Downloads\basereal senati_ORIGINAL_BACKUP.docx"
if (-not (Test-Path $templatePath)) {
    $templatePath = "C:\Users\likin\Downloads\basereal senati.docx"
}
$outputEmpty = "C:\Users\likin\Downloads\INFORME_TALLER2_BACKUS_VENTAS_PWA.docx"
$outputWithImages = "C:\Users\likin\Downloads\INFORME_TALLER2_BACKUS_VENTAS_PWA_CON_CAPTURAS.docx"
$imgDir = "C:\Users\likin\Downloads\Capturas_Backus_PWA"

Write-Host "Iniciando generación de informe Word para Taller 2: Backus Ventas..."

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    # 1. Crear documento vacío desde plantilla base
    Copy-Item -Path $templatePath -Destination $outputEmpty -Force
    $doc = $word.Documents.Open($outputEmpty)

    # Actualizar datos de portada si existen
    for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
        $p = $doc.Paragraphs.Item($i)
        if ($p.Range.Text -like "*Tarea*significativa*") {
            $prefix = "Tarea más significativa: "
            $fullTitle = $prefix + "TALLER 2: PWA con Angular 19 y Runtime Caching — Caso Académico Backus Ventas`n"
            $p.Range.Text = $fullTitle
            $p.Range.Font.Name = "Arial"
            $p.Range.Font.Size = 11
            $p.Range.Font.Bold = $false
            $prefRng = $doc.Range($p.Range.Start, $p.Range.Start + $prefix.Length)
            $prefRng.Font.Bold = $true
            break
        }
    }

    # Ubicar 'Descripcion del proceso'
    $pDescIdx = 0
    for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
        $p = $doc.Paragraphs.Item($i)
        if ($p.Range.Text.Trim() -like "Descripci*proceso*") {
            $pDescIdx = $i
            break
        }
    }

    if ($pDescIdx -eq 0) {
        throw "No se encontró el párrafo 'Descripción del proceso'"
    }

    $pDesc = $doc.Paragraphs.Item($pDescIdx)
    $pDesc.Range.Font.Name = "Arial"
    $pDesc.Range.Font.Size = 11
    $pDesc.Range.Font.Bold = $true

    $rng = $doc.Range($pDesc.Range.End, $pDesc.Range.End)

    function Add-H1($text) {
        $start = $rng.End
        $rng.InsertAfter("$text`n")
        $r = $doc.Range($start, $rng.End)
        $r.Font.Name = "Arial"
        $r.Font.Size = 12
        $r.Font.Bold = $true
        $r.Font.Color = 0x07009A # Red Burgundy #9A0007
        $r.ParagraphFormat.SpaceBefore = 12
        $r.ParagraphFormat.SpaceAfter = 4
        $rng.Collapse(0)
    }

    function Add-H2($text) {
        $start = $rng.End
        $rng.InsertAfter("$text`n")
        $r = $doc.Range($start, $rng.End)
        $r.Font.Name = "Arial"
        $r.Font.Size = 11
        $r.Font.Bold = $true
        $r.Font.Color = 0x222222
        $r.ParagraphFormat.SpaceBefore = 8
        $r.ParagraphFormat.SpaceAfter = 3
        $rng.Collapse(0)
    }

    function Add-P($boldPrefix, $text) {
        $start = $rng.End
        if ($boldPrefix) {
            $rng.InsertAfter("$boldPrefix $text`n")
            $r = $doc.Range($start, $rng.End)
            $r.Font.Name = "Arial"
            $r.Font.Size = 10
            $r.Font.Color = 0x000000
            $r.ParagraphFormat.SpaceBefore = 2
            $r.ParagraphFormat.SpaceAfter = 3
            $r.ParagraphFormat.Alignment = 3 # Justified
            $pref = $doc.Range($start, $start + $boldPrefix.Length)
            $pref.Font.Bold = $true
        } else {
            $rng.InsertAfter("$text`n")
            $r = $doc.Range($start, $rng.End)
            $r.Font.Name = "Arial"
            $r.Font.Size = 10
            $r.Font.Color = 0x000000
            $r.ParagraphFormat.SpaceBefore = 2
            $r.ParagraphFormat.SpaceAfter = 3
            $r.ParagraphFormat.Alignment = 3
        }
        $rng.Collapse(0)
    }

    function Add-Bullet($boldPrefix, $text) {
        $start = $rng.End
        if ($boldPrefix) {
            $rng.InsertAfter("- $boldPrefix $text`n")
            $r = $doc.Range($start, $rng.End)
            $r.Font.Name = "Arial"
            $r.Font.Size = 10
            $r.ParagraphFormat.SpaceBefore = 2
            $r.ParagraphFormat.SpaceAfter = 2
            $r.ParagraphFormat.Alignment = 3
            $pref = $doc.Range($start + 2, $start + 2 + $boldPrefix.Length)
            $pref.Font.Bold = $true
        } else {
            $rng.InsertAfter("- $text`n")
            $r = $doc.Range($start, $rng.End)
            $r.Font.Name = "Arial"
            $r.Font.Size = 10
            $r.ParagraphFormat.SpaceBefore = 2
            $r.ParagraphFormat.SpaceAfter = 2
            $r.ParagraphFormat.Alignment = 3
        }
        $rng.Collapse(0)
    }

    function Add-CustomTable($headers, $rows) {
        $rowsCount = $rows.Count + 1
        $table = $doc.Tables.Add($rng, $rowsCount, $headers.Count)
        $table.Borders.Enable = 1
        $table.Borders.OutsideColor = 0x888888
        $table.Borders.InsideColor = 0xCCCCCC
        
        for ($c = 1; $c -le $headers.Count; $c++) {
            $cell = $table.Cell(1, $c)
            $cell.Range.Text = $headers[$c - 1]
            $cell.Shading.BackgroundPatternColor = 0xE6F0FA
            $cell.Range.Font.Name = "Arial"
            $cell.Range.Font.Size = 9.5
            $cell.Range.Font.Bold = $true
            $cell.Range.Font.Color = 0x07009A
        }

        for ($rIdx = 0; $rIdx -lt $rows.Count; $rIdx++) {
            $rowNum = $rIdx + 2
            for ($c = 1; $c -le $headers.Count; $c++) {
                $cell = $table.Cell($rowNum, $c)
                $cell.Range.Text = $rows[$rIdx][$c - 1]
                $cell.Range.Font.Name = "Arial"
                $cell.Range.Font.Size = 9
                $cell.Range.Font.Bold = ($c -eq 1)
            }
        }
        $rng.SetRange($table.Range.End, $table.Range.End)
        $rng.InsertAfter("`n")
        $rng.Collapse(0)
    }

    function Add-BoxTable($title, $placeholder, $desc) {
        $start = $rng.End
        $rng.InsertAfter("$title`n")
        $rTitle = $doc.Range($start, $rng.End)
        $rTitle.Font.Name = "Arial"
        $rTitle.Font.Size = 10.5
        $rTitle.Font.Bold = $true
        $rTitle.Font.Color = 0x07009A
        $rTitle.ParagraphFormat.SpaceBefore = 10
        $rTitle.ParagraphFormat.SpaceAfter = 4
        $rng.Collapse(0)

        $boxTbl = $doc.Tables.Add($rng, 1, 1)
        $boxTbl.Borders.Enable = 1
        $boxTbl.Borders.OutsideLineStyle = 1
        $boxTbl.Borders.OutsideLineWidth = 8
        $boxTbl.Borders.OutsideColor = 0x999999

        $cell = $boxTbl.Cell(1, 1)
        $cell.Shading.BackgroundPatternColor = 16448250 # #FAFAFA
        $cell.PreferredWidthType = 3
        $cell.PreferredWidth = 480
        $boxTbl.Rows.Item(1).Height = 130
        $boxTbl.Rows.Item(1).HeightRule = 1

        $boxText = "`n$placeholder`n`n[ Haga clic en este recuadro y presione Ctrl + V para pegar la captura ]`n"
        $cell.Range.Text = $boxText
        $cell.Range.Font.Name = "Arial"
        $cell.Range.Font.Size = 9.5
        $cell.Range.Font.Italic = $true
        $cell.Range.Font.Color = 0x555555
        $cell.Range.ParagraphFormat.Alignment = 1

        $rng.SetRange($boxTbl.Range.End, $boxTbl.Range.End)
        $rng.InsertAfter("`n")
        $rng.Collapse(0)

        $start = $rng.End
        $rng.InsertAfter("Descripción Técnica: $desc`n`n")
        $rCap = $doc.Range($start, $rng.End)
        $rCap.Font.Name = "Arial"
        $rCap.Font.Size = 9
        $rCap.Font.Italic = $true
        $rCap.Font.Color = 0x333333
        $rCap.ParagraphFormat.SpaceBefore = 3
        $rCap.ParagraphFormat.SpaceAfter = 10
        $rCap.ParagraphFormat.Alignment = 3
        $rng.Collapse(0)
    }

    # CONTENIDO DEL REPORTE TALLER 2
    Add-H1 "1. DATOS DE IDENTIFICACIÓN Y MARCO ACADÉMICO"
    Add-P "Institución:" "SENATI — Dirección Zonal Lima-Callao / Escuela de Tecnologías de la Información."
    Add-P "Carrera y Semestre:" "Informática y Desarrollo de Aplicaciones Web — Semestre IV (Bloque 60PAWDS401)."
    Add-P "Estudiante:" "Saavedra Donayre, Alonso Stevens."
    Add-P "Instructor Guía:" "Jorge Antonio Luque Chambi."
    Add-P "Operación Asignada:" "Implementa caché con Service Worker (Angular 19 & Runtime Caching)."
    Add-P "Caso Académico:" "Backus Ventas — 'Ventas que no se detienen, aunque se caiga la señal'."

    Add-H1 "2. SITUACIÓN PROBLEMÁTICA Y RETO DE INGENIERÍA"
    Add-P "Diagnóstico Operativo:" "Una fuerza de ventas en ruta recorre a diario bodegas, mercados y restaurantes en áreas suburbanas e industriales donde la cobertura de red móvil 3G/4G es irregular o nula. Con una aplicación web tradicional, al perder señal el vendedor no puede consultar el catálogo ni verificar disponibilidad, interrumpiendo el flujo comercial de la empresa."
    Add-P "Formulación del Reto:" "¿Cómo diseñar una PWA para que un vendedor pueda consultar el catálogo cuando pierde temporalmente la conexión, sin tratar los precios como si fueran datos estáticos?"
    Add-P "Respuesta Arquitectónica:" "Se diseñó una PWA construida sobre Angular 19 y su Service Worker nativo (@angular/service-worker), configurando estrategias diferenciadas de Runtime Caching mediante dataGroups en ngsw-config.json: estrategia 'performance' para el catálogo base (alta disponibilidad) y estrategia 'freshness' con timeout estricto de 3 segundos para precios y stock (frescura financiera)."

    Add-H1 "3. SABERES PREVIOS — ACTIVIDAD PREINSTRUCCIONAL"
    Add-Bullet "1. Diferencia entre PWA y Web Convencional:" "Una PWA trasciende a una web convencional porque se ejecuta sobre un Service Worker en segundo plano, funciona 100% offline mediante Cache Storage e IndexedDB, se instala en el dispositivo (A2HS) y soporta notificaciones Web Push, reduciendo la fricción de descarga en tiendas."
    Add-Bullet "2. Función del Service Worker:" "Actúa como un servidor proxy de red programable del lado del cliente. Intercepta solicitudes fetch, gobierna las estrategias de caché, procesa tareas en background y atiende peticiones aun sin internet."
    Add-Bullet "3. Concepto de Funcionamiento Offline:" "Significa que la aplicación es resiliente ante fallas de conectividad; su cascarón (App Shell) y datos esenciales están precacheados, permitiendo consultar información y registrar transacciones localmente sin presentar la pantalla de error del navegador."
    Add-Bullet "4. Datos Necesarios sin Conexión:" "El catálogo base de productos (códigos, nombres, categorías, fotos descriptivas), la lista de clientes o bodegas asignadas a la ruta y la cola local de pedidos pendientes."
    Add-Bullet "5. Tratamiento de Precios vs Imágenes:" "Un precio JAMÁS debe tratarse igual que una imagen. Las imágenes son inmutables y admiten Cache First / Performance (TTL largo). Un precio desactualizado genera disputas comerciales y pérdidas contables; por ello exige Network First / Freshness."

    Add-H1 "4. SECUENCIA TÉCNICA PASO A PASO (EJERCICIOS 1 AL 13)"
    Add-P "Paso 1 (Creación PWA):" "Inicialización del proyecto con Angular CLI 19: ng new backus-ventas-pwa --routing --style=scss y adición de ng add @angular/pwa."
    Add-P "Paso 2 (Catálogo Académico):" "Creación de public/data/catalogo.json conteniendo productos icónicos de Backus (Cristal 620ml, Pilsen Callao, Cusqueña Dorada, San Mateo, Guaraná, Maltin Power) con precios y stock de referencia."
    Add-P "Paso 3 (Servicios con HttpClient):" "Configuración de provideHttpClient() y provideServiceWorker('ngsw-worker.js') en app.config.ts, e implementación de CatalogoService y PreciosService inyectando HttpClient."
    Add-P "Paso 4 (Configuración dataGroups Performance):" "Definición en ngsw-config.json del grupo catalogo-backus apuntando a /data/catalogo.json con strategy: performance, maxSize: 20 y maxAge: 1d."
    Add-P "Paso 5 (Configuración dataGroups Freshness):" "Definición del grupo precios-backus apuntando a /data/precios.json con strategy: freshness, timeout: 3s, maxSize: 20 y maxAge: 1h."
    Add-P "Paso 6 (Build de Producción):" "Compilación optimizada mediante ng build --configuration production y servicio local en puerto 8080 simulando despliegue de alta fidelidad."
    Add-P "Paso 7 (Auditoría Service Worker):" "Verificación en Chrome DevTools (F12 > Application > Service Workers) confirmando ngsw-worker.js activo y en ejecución."
    Add-P "Paso 8 (Auditoría Cache Storage):" "Inspección de las particiones ngsw:/:data:catalogo-backus:cache y ngsw:/:data:precios-backus:cache conteniendo las respuestas JSON."
    Add-P "Paso 9 (Prueba de Desconexión Offline):" "Simulación de pérdida de red en DevTools (Network > Offline); la PWA responde de forma instantánea entregando el catálogo desde Cache Storage."
    Add-P "Paso 10 (Reto 2.0 y Persistencia de Pedidos):" "Extensión funcional con carrito de ventas y almacenamiento transaccional de órdenes offline en IndexedDB (BackusVentasDB), garantizando sincronización al recuperar conectividad."

    Add-H1 "5. MATRIZ ARQUITECTÓNICA: PERFORMANCE VS FRESHNESS"
    $headersMatriz = @("Recurso", "URL / Origen", "Estrategia", "Configuración", "Justificación Técnica")
    $rowsMatriz = @(
        @("Catálogo de Productos", "/data/catalogo.json", "performance", "maxSize: 20, maxAge: 1d", "Prioriza caché. Los nombres de bebidas no cambian en ruta; la prioridad es velocidad (<5ms)."),
        @("Precios de Venta", "/data/precios.json", "freshness", "timeout: 3s, maxAge: 1h", "Prioriza red para exactitud contable. Si no responde en 3s, recurre a caché reciente."),
        @("Stock Disponible", "/data/precios.json", "freshness", "timeout: 3s, maxAge: 1h", "Evita comprometer pedidos de mercadería agotada en el almacén de distribución."),
        @("App Shell (UI)", "HTML, JS, CSS, SVG", "prefetch", "installMode: prefetch", "Carga inmediata de la estructura visual sin depender de la señal móvil."),
        @("Pedidos POST", "/api/v1/pedidos", "IndexedDB + Sync", "ObjectStore local", "Las transacciones POST no se cachean vía GET; requieren almacenamiento transaccional local.")
    )
    Add-CustomTable $headersMatriz $rowsMatriz

    Add-H1 "6. PREGUNTAS DE REFLEXIÓN POSINSTRUCCIONAL"
    Add-Bullet "8. Recurso Estático vs Dato de Runtime:" "Los recursos estáticos (App Shell) se compilan en tiempo de build y se versionan como archivos fijos. Los datos de runtime provienen de respuestas dinámicas de APIs o JSONs que varían en tiempo de ejecución."
    Add-Bullet "9. ¿Por qué el catálogo usa Performance?:" "Porque su contenido es fundamentalmente descriptivo y de baja variabilidad; el vendedor necesita acceder al portafolio al instante sin demoras por mala señal."
    Add-Bullet "10. ¿Por qué precios y stock usan Freshness?:" "Porque representan compromisos comerciales y logísticos directos; un precio desfasado puede provocar glosas de facturación y stock falso genera pedidos no atendibles."
    Add-Bullet "11. Evidencias de Intervención del Service Worker:" "En Network tab se observa la etiqueta '(ServiceWorker)' en la columna Size y tiempos de transferencia menores a 5 ms, comprobando que la petición no tocó la red física."
    Add-Bullet "12. Riesgos de Conservar Precios Antiguos:" "Venta a precios por debajo de la lista oficial, diferencias de liquidación con el bodeguero y descalce en los balances de recaudación."
    Add-Bullet "13. Tecnologías para Pedidos Offline:" "IndexedDB para persistencia transaccional local, identificadores UUID v4 para idempotencia y Background Sync API para reintentar el despacho al reconectar."
    Add-Bullet "14. Aplicabilidad a Otras Empresas Peruanas:" "Este modelo es 100% transferible a la preventa de Alicorp, Distribuidora Gloria o San Fernando, optimizando la productividad de los agentes en zonas rurales."

    Add-H1 "7. EVIDENCIAS VISUALES Y CAPTURAS DEL SISTEMA WEB (TALLER 2)"
    Add-BoxTable "FIGURA 1: PORTAL DE EVALUACIÓN DEL TALLER 2 Y ACCESOS A LA PWA" `
                 "[ PEGAR AQUÍ CAPTURA 1: PORTAL DEL SISTEMA ]" `
                 "Vista general del portal central (http://localhost:8080/portal.html). Presenta el acceso a la PWA de preventa, la matriz de decisiones técnicas y el acceso al panel de auditoría de DevTools."

    Add-BoxTable "FIGURA 2: PWA BACKUS VENTAS EN MODO ONLINE (CON CONEXIÓN)" `
                 "[ PEGAR AQUÍ CAPTURA 2: PWA EN MODO EN LÍNEA ]" `
                 "Pantalla principal de la PWA Backus Ventas en modo conectado (http://localhost:8080/). Destaca el aviso verde 'Conexión Activa', el indicador '● En línea', el catálogo categorizado y las insignias de Runtime Caching activas en cada producto."

    Add-BoxTable "FIGURA 3: RESILIENCIA EN MODO SIN CONEXIÓN (OFFLINE EN RUTA)" `
                 "[ PEGAR AQUÍ CAPTURA 3: PWA EN MODO SIN CONEXIÓN ]" `
                 "Comportamiento de la PWA al activar 'Simular Offline'. El banner cambia automáticamente a alerta coral informando que el catálogo se entrega desde Cache Storage bajo estrategia Performance y adapta el botón de pedidos a IndexedDB."

    Add-BoxTable "FIGURA 4: RETO 2.0 — CARRITO DE PREVENTA Y DESPACHO DE PEDIDOS" `
                 "[ PEGAR AQUÍ CAPTURA 4: CARRITO DE PREVENTA Y CHECKOUT ]" `
                 "Modal del carrito de ventas en la Zona del Pulgar. Muestra las cajas de Cristal, Pilsen y San Mateo seleccionadas, cálculo automático de I.G.V. (18%) y campo para nombre de la bodega o restaurante visitado."

    Add-BoxTable "FIGURA 5: AUDITORÍA DE EVIDENCIAS EN GOOGLE CHROME DEVTOOLS" `
                 "[ PEGAR AQUÍ CAPTURA 5: SERVICE WORKER Y CACHE STORAGE ]" `
                 "Panel de inspección técnica en DevTools (http://localhost:8080/devtools.html). Evidencia el estado activo de ngsw-worker.js (#104 activated and running), las particiones de Cache Storage por dataGroups y la intercepción en Network."

    Add-BoxTable "FIGURA 6: INFOGRAFÍA TÉCNICA — 'BACKUS Y PWA – RUNTIME CACHING'" `
                 "[ PEGAR AQUÍ CAPTURA 6: INFOGRAFÍA RUNTIME CACHING ]" `
                 "Infografía técnica formal que sintetiza la arquitectura de Runtime Caching con Angular 19, diferenciando el flujo de performance (catálogo), freshness (precios) y la solución transaccional con IndexedDB."

    Add-H1 "8. CONCLUSIONES Y RECOMENDACIONES DE INGENIERÍA"
    Add-Bullet "1. El valor de la estrategia diferenciada:" "No se debe aplicar una única estrategia de caché para toda la aplicación. Aislar recursos según su volatilidad y criticidad permite equilibrar velocidad instantánea con exactitud financiera."
    Add-Bullet "2. ngsw-config.json como estándar declarativo:" "Angular Service Worker simplifica drásticamente el Runtime Caching empresarial sin obligar a escribir interceptores manuales complejos, garantizando mantenimiento limpio y robusto."
    Add-Bullet "3. Desacoplamiento entre GET e IndexedDB:" "El almacenamiento de respuestas HTTP GET mediante Cache Storage resuelve la consulta offline, pero la toma de pedidos POST exige una cola transaccional en IndexedDB con sincronización posterior."

    $doc.Save()
    $doc.Close([ref]$false)
    Write-Host "Documento base $outputEmpty generado exitosamente!"

    # 2. Crear versión con imágenes incrustadas
    Copy-Item -Path $outputEmpty -Destination $outputWithImages -Force
    $docImages = $word.Documents.Open($outputWithImages)

    $imgMap = @{
        6  = @{ File = "Captura_1_Portal_Taller2.png"; Width = 460 };
        7  = @{ File = "Captura_2_PWA_Online_Performance.png"; Width = 230 };
        8  = @{ File = "Captura_3_PWA_Modo_Offline.png"; Width = 230 };
        9  = @{ File = "Captura_4_Carrito_Preventa_Bodega.png"; Width = 230 };
        10 = @{ File = "Captura_5_Service_Worker_Cache_Storage.png"; Width = 460 };
        11 = @{ File = "Captura_6_Infografia_Runtime_Caching.png"; Width = 460 };
    }

    foreach ($idx in 6..11) {
        $info = $imgMap[$idx]
        $filePath = Join-Path $imgDir $info.File
        if (Test-Path $filePath) {
            Write-Host "Incrustando $filePath en Tabla $idx..."
            $t = $docImages.Tables.Item($idx)
            $cell = $t.Cell(1, 1)
            $cell.Range.Text = ""
            $pic = $cell.Range.InlineShapes.AddPicture($filePath, $false, $true)
            $pic.Width = $info.Width
            $cell.Range.ParagraphFormat.Alignment = 1
        }
    }

    $docImages.Save()
    $docImages.Close([ref]$false)
    Write-Host "Documento con capturas $outputWithImages generado exitosamente!"

} catch {
    Write-Error "ERROR: $_"
} finally {
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    Write-Host "Word application finalizada."
}
