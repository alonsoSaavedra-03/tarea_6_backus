// Backus Ventas B2B - Runtime Caching con Angular Service Worker & SweetAlert2
let catalogoProductos = [];
let preciosActualizados = [];
let activeCategory = 'TODAS';
let searchQuery = '';
let simulatedOffline = false;
let carrito = [];

// SweetAlert2 Toast Configuración Base
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

// ==========================================
// 1. REGISTRO DE SERVICE WORKER (NGSW)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('/ngsw-worker.js');
            console.log('[NGSW] Service Worker activo:', reg.scope);
            actualizarEstadoSw(true);
        } catch (err) {
            console.warn('[NGSW] Registro omitido o error:', err);
            actualizarEstadoSw(false);
        }
    });
}

function actualizarEstadoSw(activo) {
    const el = document.getElementById('swStatusText');
    if (el) {
        el.textContent = activo ? 'ngsw-worker.js Activo' : 'ngsw-worker.js Inactivo';
        el.className = activo ? 'diag-val ok' : 'diag-val';
    }
}

// ==========================================
// 2. GESTIÓN DE CONECTIVIDAD & SWEETALERT2
// ==========================================
function updateNetworkStatusUI(triggerSwal = false) {
    const isOnline = navigator.onLine && !simulatedOffline;
    const btn = document.getElementById('netStatusBtn');
    const text = document.getElementById('netStatusText');
    const notice = document.getElementById('connectionNotice');
    const title = document.getElementById('noticeTitle');
    const badge = document.getElementById('noticeBadge');
    const desc = document.getElementById('noticeDesc');
    const actionBtn = document.getElementById('btnToggleSimulateNet');
    const btnCheckoutText = document.getElementById('btnCheckoutText');
    const btnConfirmOrder = document.getElementById('btnConfirmOrder');
    const iconOnline = document.getElementById('iconWifiOnline');
    const iconOffline = document.getElementById('iconWifiOffline');

    if (isOnline) {
        if (btn) btn.className = 'status-pill status-online';
        if (text) text.textContent = 'En Línea';
        if (notice) {
            notice.className = 'connection-notice notice-online';
            if (title) title.textContent = 'Conexión Activa con Almacén Central';
            if (badge) badge.textContent = 'En Línea';
            if (desc) desc.textContent = 'Fuerza de ventas conectada a red. Precios y stock sincronizados en tiempo real mediante estrategia Freshness.';
            if (actionBtn) actionBtn.textContent = 'Simular Offline';
        }
        if (iconOnline) iconOnline.style.display = 'block';
        if (iconOffline) iconOffline.style.display = 'none';
        if (btnConfirmOrder) btnConfirmOrder.classList.remove('offline-mode');
        if (btnCheckoutText) btnCheckoutText.textContent = 'Confirmar Pedido a Central Backus';

        if (triggerSwal) {
            Toast.fire({
                icon: 'success',
                title: 'Conexión Activa',
                text: 'Sincronizado con Almacén Central Backus.'
            });
        }
    } else {
        if (btn) btn.className = 'status-pill status-offline';
        if (text) text.textContent = 'Sin Conexión';
        if (notice) {
            notice.className = 'connection-notice notice-offline';
            if (title) title.textContent = 'Modo Offline: Operando con Caché Local';
            if (badge) badge.textContent = 'Offline';
            if (desc) desc.textContent = 'Sin cobertura en ruta. Catálogo servido desde Cache Storage (Performance). Los pedidos se guardarán en IndexedDB.';
            if (actionBtn) actionBtn.textContent = 'Reconectar';
        }
        if (iconOnline) iconOnline.style.display = 'none';
        if (iconOffline) iconOffline.style.display = 'block';
        if (btnConfirmOrder) btnConfirmOrder.classList.add('offline-mode');
        if (btnCheckoutText) btnCheckoutText.textContent = 'Guardar Pedido en IndexedDB (Offline)';

        if (triggerSwal) {
            Toast.fire({
                icon: 'warning',
                title: 'Modo Offline Activado',
                text: 'El catálogo continuará disponible mediante caché local.'
            });
        }
    }

    renderProducts();
}

function toggleConnectivitySimulation() {
    simulatedOffline = !simulatedOffline;
    updateNetworkStatusUI(true);
    if (!simulatedOffline) {
        cargarDatos();
        sincronizarPedidosPendientes();
    }
}

document.getElementById('netStatusBtn').addEventListener('click', toggleConnectivitySimulation);
document.getElementById('btnToggleSimulateNet').addEventListener('click', toggleConnectivitySimulation);

window.addEventListener('online', () => {
    simulatedOffline = false;
    updateNetworkStatusUI(true);
    cargarDatos();
    sincronizarPedidosPendientes();
});

window.addEventListener('offline', () => {
    updateNetworkStatusUI(true);
});

// ==========================================
// 3. CARGA DE DATOS: PERFORMANCE VS FRESHNESS
// ==========================================
async function cargarDatos() {
    const t0 = performance.now();
    try {
        // Catalogo: Estrategia Performance
        const catRes = await fetch('/data/catalogo.json');
        catalogoProductos = await catRes.json();

        // Precios: Estrategia Freshness
        const precRes = await fetch('/data/precios.json');
        preciosActualizados = await precRes.json();

        const t1 = performance.now();
        const diff = Math.round(t1 - t0);
        const timeLbl = document.getElementById('diagTimeLabel');
        if (timeLbl) {
            timeLbl.textContent = `Latencia: ${diff} ms`;
        }

        renderProducts();
    } catch (err) {
        console.warn('Error cargando datos de red, usando respaldo local:', err);
        // Si hay error en red pero existe caché
        renderProducts();
    }
}

// ==========================================
// 4. RENDERIZADO DEL CATÁLOGO (MINIMALISTA)
// ==========================================
function getProductSvg(categoria) {
    if (categoria === 'Cerveza') {
        return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 11h1a3 3 0 0 1 0 6h-1"></path>
            <path d="M9 12v6"></path>
            <path d="M13 12v6"></path>
            <path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5s2-.5 3-.5 2 .5 3 .5 1.5-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.8 0-1.5-.5-2.5-.5Z"></path>
            <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"></path>
        </svg>`;
    } else if (categoria === 'Aguas') {
        return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>`;
    } else if (categoria === 'Gaseosas') {
        return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 2h10l-2 20H9L7 2z"></path>
            <path d="M7 8h10"></path>
            <path d="M8 14h8"></path>
        </svg>`;
    } else {
        return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>`;
    }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    const filtered = catalogoProductos.filter(prod => {
        const matchesCategory = activeCategory === 'TODAS' || prod.categoria.toLowerCase() === activeCategory.toLowerCase();
        const matchesSearch = prod.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              prod.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              `BCK-00${prod.id}`.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const countLabel = document.getElementById('productCountLabel');
    if (countLabel) {
        countLabel.textContent = `${filtered.length} productos`;
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color: #64748b;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin-bottom:12px;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <div style="font-weight:700; font-size:14px; color:#0f172a;">No se encontraron productos</div>
                <div style="font-size:12px; margin-top:4px;">Intenta cambiar el término de búsqueda o la categoría.</div>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(prod => {
        const infoDinamica = preciosActualizados.find(p => p.productoId === prod.id) || { precio: prod.precio, stock: prod.stock };
        const precioUnit = infoDinamica.precio.toFixed(2);
        const precioCaja = (infoDinamica.precio * 12).toFixed(2);
        const stockActual = infoDinamica.stock;
        const sku = `BCK-00${prod.id}`;
        const iconSvg = getProductSvg(prod.categoria);

        return `
            <article class="product-card" data-id="${prod.id}">
                <div class="product-icon-frame">
                    ${iconSvg}
                </div>
                
                <div class="product-info">
                    <div class="product-head">
                        <span class="product-sku">SKU: ${sku}</span>
                        <span class="product-cat-tag">${prod.categoria}</span>
                    </div>

                    <h4 class="product-name">${prod.nombre}</h4>
                    <p class="product-desc">Caja x 12 unidades • Retornable / No Retornable</p>

                    <div class="product-strategies">
                        <span class="strat-badge perf" title="Estrategia: Performance (Cache First, 1d)">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                            Caché: Performance
                        </span>
                        <span class="strat-badge fresh" title="Estrategia: Freshness (Network First, Timeout 3s)">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                            Red: Freshness (3s)
                        </span>
                    </div>

                    <div class="product-foot">
                        <div class="price-wrap">
                            <span class="price-unit">Precio Caja x 12</span>
                            <span class="price-amount">S/ ${precioCaja}</span>
                            <span class="stock-tag">Stock Central: ${stockActual} cajas</span>
                        </div>

                        <button class="btn-add-cart" onclick="agregarAlCarrito(${prod.id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            + Añadir Caja
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// ==========================================
// 5. GESTIÓN DEL CARRITO CON SWEETALERT2
// ==========================================
window.agregarAlCarrito = function(prodId) {
    const prod = catalogoProductos.find(p => p.id === prodId);
    if (!prod) return;

    const infoDinamica = preciosActualizados.find(p => p.productoId === prod.id) || { precio: prod.precio, stock: prod.stock };
    const precioCaja = Number((infoDinamica.precio * 12).toFixed(2));

    const itemExistente = carrito.find(item => item.id === prodId);
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({
            id: prod.id,
            nombre: prod.nombre,
            categoria: prod.categoria,
            precioUnitario: precioCaja,
            cantidad: 1
        });
    }

    actualizarResumenCarrito();

    // SweetAlert2 Toast
    Toast.fire({
        icon: 'success',
        title: 'Caja Añadida a la Preventa',
        text: `${prod.nombre} (x12)`
    });
};

function actualizarResumenCarrito() {
    const thumbWrapper = document.getElementById('thumbWrapper');
    const thumbBadge = document.getElementById('thumbBadge');
    const thumbItemsLabel = document.getElementById('thumbItemsLabel');
    const thumbTotalText = document.getElementById('thumbTotalText');

    const totalCajas = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const subtotal = carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);

    if (totalCajas > 0) {
        if (thumbWrapper) thumbWrapper.style.display = 'flex';
        if (thumbBadge) thumbBadge.textContent = totalCajas;
        if (thumbItemsLabel) thumbItemsLabel.textContent = `TOTAL PREVENTA (${totalCajas} CAJAS)`;
        if (thumbTotalText) thumbTotalText.textContent = `S/ ${subtotal.toFixed(2)}`;
    } else {
        if (thumbWrapper) thumbWrapper.style.display = 'none';
    }

    renderModalCartItems();
}

function renderModalCartItems() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    if (carrito.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px; color:#64748b; font-size:13px;">
                No hay cajas agregadas a la preventa.
            </div>
        `;
    } else {
        container.innerHTML = carrito.map(item => {
            const itemTotal = (item.precioUnitario * item.cantidad).toFixed(2);
            return `
                <div class="cart-item-row">
                    <div class="item-left">
                        <span class="item-name">${item.nombre}</span>
                        <span class="item-sub">S/ ${item.precioUnitario.toFixed(2)} por caja</span>
                    </div>

                    <div class="item-right">
                        <div class="stepper">
                            <button class="btn-step" onclick="modificarCantidad(${item.id}, -1)">−</button>
                            <span class="step-qty">${item.cantidad}</span>
                            <button class="btn-step" onclick="modificarCantidad(${item.id}, 1)">+</button>
                        </div>
                        <span class="item-price">S/ ${itemTotal}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    const subtotal = carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const subEl = document.getElementById('cartSubtotalText');
    const igvEl = document.getElementById('cartIgvText');
    const totEl = document.getElementById('cartTotalText');

    if (subEl) subEl.textContent = `S/ ${subtotal.toFixed(2)}`;
    if (igvEl) igvEl.textContent = `S/ ${igv.toFixed(2)}`;
    if (totEl) totEl.textContent = `S/ ${total.toFixed(2)}`;
}

window.modificarCantidad = function(id, delta) {
    const item = carrito.find(i => i.id === id);
    if (!item) return;

    item.cantidad += delta;
    if (item.cantidad <= 0) {
        carrito = carrito.filter(i => i.id !== id);
    }
    actualizarResumenCarrito();
};

// ==========================================
// 6. MODAL BOTTOM SHEET Y CONFIRMACIÓN
// ==========================================
const btnOpenCart = document.getElementById('btnOpenCart');
const modalOverlay = document.getElementById('cartModalOverlay');
const btnCloseCart = document.getElementById('btnCloseCartModal');
const btnConfirmOrder = document.getElementById('btnConfirmOrder');

if (btnOpenCart) {
    btnOpenCart.addEventListener('click', () => {
        renderModalCartItems();
        if (modalOverlay) modalOverlay.style.display = 'flex';
    });
}

if (btnCloseCart) {
    btnCloseCart.addEventListener('click', () => {
        if (modalOverlay) modalOverlay.style.display = 'none';
    });
}

if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });
}

// Confirmación de orden con SweetAlert2 Modal
if (btnConfirmOrder) {
    btnConfirmOrder.addEventListener('click', async () => {
        if (carrito.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Preventa Vacía',
                text: 'Agrega al menos una caja de producto antes de emitir la orden.',
                confirmButtonColor: '#0F172A'
            });
            return;
        }

        const bodegaInput = document.getElementById('bodegaNameInput');
        const bodega = bodegaInput ? bodegaInput.value.trim() : 'Bodega San Martín';
        const totalCajas = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        const subtotal = carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
        const total = (subtotal * 1.18).toFixed(2);
        const isOnline = navigator.onLine && !simulatedOffline;

        const { isConfirmed } = await Swal.fire({
            title: isOnline ? '¿Confirmar Preventa Backus?' : '¿Guardar Preventa en Modo Offline?',
            html: `
                <div style="text-align:left; font-size:13px; line-height:1.6; color:#334155;">
                    <div style="margin-bottom:8px;"><b>Cliente / Bodega:</b> ${bodega}</div>
                    <div style="margin-bottom:8px;"><b>Volumen Total:</b> ${totalCajas} cajas</div>
                    <div style="margin-bottom:12px;"><b>Total a Facturar:</b> <span style="font-size:16px; font-weight:800; color:#0F172A;">S/ ${total}</span></div>
                    <div style="padding:10px 12px; border-radius:6px; background:${isOnline ? '#F0FDF4' : '#FFFBEB'}; border:1px solid ${isOnline ? '#BBF7D0' : '#FDE68A'}; font-size:12px; color:${isOnline ? '#166534' : '#92400E'};">
                        ${isOnline ? 'Transmisión directa al ERP de Almacén Central Backus.' : 'Sin conexión disponible. La orden se almacenará en IndexedDB y se sincronizará automáticamente al detectar red.'}
                    </div>
                </div>
            `,
            icon: isOnline ? 'question' : 'info',
            showCancelButton: true,
            confirmButtonColor: '#0F172A',
            cancelButtonColor: '#64748B',
            confirmButtonText: isOnline ? 'Emitir Pedido' : 'Guardar en IndexedDB',
            cancelButtonText: 'Revisar'
        });

        if (isConfirmed) {
            const pedido = {
                id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
                bodega: bodega,
                items: [...carrito],
                totalCajas: totalCajas,
                totalMonto: Number(total),
                fecha: new Date().toISOString(),
                estado: isOnline ? 'SINCRONIZADO' : 'PENDIENTE_SINCRONIZACION'
            };

            await window.idbGuardarPedido(pedido);
            actualizarContadorIndexedDB();

            if (modalOverlay) modalOverlay.style.display = 'none';
            carrito = [];
            actualizarResumenCarrito();

            Swal.fire({
                icon: 'success',
                title: isOnline ? 'Preventa Transmitida con Éxito' : 'Preventa Guardada en IndexedDB',
                html: `
                    <div style="font-size:13px; color:#334155;">
                        <p>Código de Registro: <b>${pedido.id}</b></p>
                        <p style="margin-top:6px; font-size:12px; color:#64748B;">
                            ${isOnline ? 'Confirmación recibida de Central Backus.' : 'Guardado seguro en cola local. El sistema reintentará el envío en background.'}
                        </p>
                    </div>
                `,
                confirmButtonColor: '#0F172A'
            });
        }
    });
}

// ==========================================
// 7. BOTONES DE AUDITORÍA (SWEETALERT2 MODALS)
// ==========================================
document.getElementById('btnShowSwalDetails').addEventListener('click', () => {
    Swal.fire({
        title: 'Auditoría Runtime Caching (ngsw-config.json)',
        html: `
            <div style="text-align:left; font-size:12.5px; line-height:1.6; color:#334155;">
                <div style="background:#F0FDF4; border:1px solid #BBF7D0; padding:10px 12px; border-radius:8px; margin-bottom:10px;">
                    <div style="font-weight:700; color:#166534; font-size:13px;">1. Grupo Catálogo: Strategy "performance"</div>
                    <div style="color:#15803D; margin-top:3px;">
                        • URL: <code>/data/catalogo.json</code><br>
                        • MaxAge: 1 día | MaxSize: 20 entradas<br>
                        • <b>Función:</b> Cache-First agresivo. Disponibilidad inmediata para la fuerza de ventas en zonas sin cobertura.
                    </div>
                </div>

                <div style="background:#EFF6FF; border:1px solid #BFDBFE; padding:10px 12px; border-radius:8px;">
                    <div style="font-weight:700; color:#1E40AF; font-size:13px;">2. Grupo Precios: Strategy "freshness"</div>
                    <div style="color:#1D4ED8; margin-top:3px;">
                        • URL: <code>/data/precios.json</code><br>
                        • Timeout: 3 segundos | MaxAge: 1 hora<br>
                        • <b>Función:</b> Network-First. Prioriza consultar el servidor para tarifas frescas; si la red tarda más de 3s o está offline, usa la caché.
                    </div>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonColor: '#0F172A'
    });
});

document.getElementById('btnShowIdbList').addEventListener('click', async () => {
    const pedidos = await window.idbObtenerPedidos();
    if (pedidos.length === 0) {
        Swal.fire({
            title: 'Cola de Preventa en IndexedDB',
            text: 'No hay pedidos pendientes en la base de datos local "BackusVentasDB".',
            icon: 'info',
            confirmButtonColor: '#0F172A'
        });
        return;
    }

    const itemsHtml = pedidos.map(p => `
        <div style="border-bottom:1px solid #E2E8F0; padding:8px 0; text-align:left; font-size:12px;">
            <div style="display:flex; justify-content:space-between; font-weight:700;">
                <span>${p.id} - ${p.bodega}</span>
                <span style="color:${p.estado === 'SINCRONIZADO' ? '#166534' : '#92400E'};">${p.estado}</span>
            </div>
            <div style="color:#64748B;">Total: S/ ${p.totalMonto.toFixed(2)} (${p.totalCajas} cajas) • ${new Date(p.fecha).toLocaleTimeString()}</div>
        </div>
    `).join('');

    Swal.fire({
        title: `Órdenes en IndexedDB (${pedidos.length})`,
        html: `<div style="max-height:220px; overflow-y:auto;">${itemsHtml}</div>`,
        icon: 'info',
        confirmButtonColor: '#0F172A'
    });
});

document.getElementById('btnTestSwalOffline').addEventListener('click', async () => {
    await cargarDatos();
    Toast.fire({
        icon: 'info',
        title: 'Datos Refrescados',
        text: 'Estrategias de Service Worker ejecutadas exitosamente.'
    });
});

// ==========================================
// 8. FILTROS Y BÚSQUEDA
// ==========================================
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        if (clearSearchBtn) {
            clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
        }
        renderProducts();
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderProducts();
    });
}

document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-cat');
        renderProducts();
    });
});

async function actualizarContadorIndexedDB() {
    const countEl = document.getElementById('offlineOrdersLabel');
    if (!countEl) return;
    try {
        const pedidos = await window.idbObtenerPedidos();
        const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE_SINCRONIZACION').length;
        countEl.textContent = `IndexedDB: ${pendientes} Órdenes`;
    } catch (e) {
        console.warn('Error leyendo IndexedDB:', e);
    }
}

async function sincronizarPedidosPendientes() {
    try {
        const pedidos = await window.idbObtenerPedidos();
        const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE_SINCRONIZACION');
        if (pendientes.length > 0) {
            console.log(`[SYNC] Sincronizando ${pendientes.length} pedidos pendientes...`);
            for (const p of pendientes) {
                p.estado = 'SINCRONIZADO';
                await window.idbActualizarPedido(p);
            }
            actualizarContadorIndexedDB();
            Toast.fire({
                icon: 'success',
                title: 'Preventas Sincronizadas',
                text: `${pendientes.length} pedidos transmitidos al servidor central de Backus.`
            });
        }
    } catch (err) {
        console.warn('[SYNC] Error en sincronización:', err);
    }
}

// Soporte para automatización y captura de estados
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('offline') === 'true') {
    simulatedOffline = true;
}

// Inicialización
cargarDatos();
actualizarContadorIndexedDB();
updateNetworkStatusUI(false);

if (urlParams.get('cart') === 'true') {
    setTimeout(() => {
        agregarAlCarrito(1);
        agregarAlCarrito(2);
        if (modalOverlay) {
            renderModalCartItems();
            modalOverlay.style.display = 'flex';
        }
    }, 500);
}
