// IndexedDB Manager para Backus Ventas PWA
const DB_NAME = 'BackusVentasDB';
const DB_VERSION = 1;
const STORE_PEDIDOS = 'pedidos_offline';

function openBackusDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_PEDIDOS)) {
                db.createObjectStore(STORE_PEDIDOS, { keyPath: 'uuid_local' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbGuardarPedido(pedido) {
    const db = await openBackusDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PEDIDOS, 'readwrite');
        const store = tx.objectStore(STORE_PEDIDOS);
        const req = store.put(pedido);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function idbObtenerPedidosPendientes() {
    const db = await openBackusDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PEDIDOS, 'readonly');
        const store = tx.objectStore(STORE_PEDIDOS);
        const req = store.getAll();
        req.onsuccess = () => {
            const list = req.result || [];
            resolve(list.filter(p => p.status === 'PENDIENTE_SYNC'));
        };
        req.onerror = () => reject(req.error);
    });
}

async function idbMarcarPedidoSincronizado(uuidLocal) {
    const db = await openBackusDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PEDIDOS, 'readwrite');
        const store = tx.objectStore(STORE_PEDIDOS);
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
