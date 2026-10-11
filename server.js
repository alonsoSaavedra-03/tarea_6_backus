// Backus Ventas PWA - Servidor Node.js / Express
// Taller Práctico 2: PWA con Angular 19 y Runtime Caching
// Puerto por defecto: 8080 (o process.env.PORT)

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// BASE DE DATOS EN MEMORIA DE PEDIDOS DE PREVENTA
let PEDIDOS_VENTAS = [];

// GET: Catálogo académico
app.get('/data/catalogo.json', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'data', 'catalogo.json');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'Catálogo no encontrado' });
    }
});

// GET: Precios y stock dinámicos
app.get('/data/precios.json', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'data', 'precios.json');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'Precios no encontrados' });
    }
});

// POST: Registrar pedido de preventa
app.post('/api/v1/pedidos', (req, res) => {
    const { uuid_local, cliente_bodega, total, items } = req.body;
    const nuevoPedido = {
        id_pedido: 'PED-BK-' + Date.now(),
        uuid_local: uuid_local || 'loc-' + Math.random().toString(36).substring(2, 6),
        cliente_bodega: cliente_bodega || 'Bodega San Martín',
        total: parseFloat(total) || 0,
        items: items || [],
        creado_en: new Date().toISOString(),
        status: 'CONFIRMADO_CENTRAL'
    };
    PEDIDOS_VENTAS.unshift(nuevoPedido);
    console.log(`[Backus Central] Nueva preventa registrada: ${nuevoPedido.id_pedido} - Total: S/ ${nuevoPedido.total}`);
    res.status(201).json(nuevoPedido);
});

// GET: Listar pedidos
app.get('/api/v1/pedidos', (req, res) => {
    res.json(PEDIDOS_VENTAS);
});

// Fallback PWA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
if (!process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log('================================================================');
        console.log('BACKUS VENTAS PWA - SERVIDOR ANGULAR 19 & RUNTIME CACHING');
        console.log('================================================================');
        console.log(`Servidor PWA activo en: http://localhost:${PORT}`);
        console.log(`App Preventa:          http://localhost:${PORT}/`);
        console.log(`Portal de Evaluacion:  http://localhost:${PORT}/portal.html`);
        console.log(`Evidencias DevTools:   http://localhost:${PORT}/devtools.html`);
        console.log('================================================================');
    });
}

module.exports = app;
