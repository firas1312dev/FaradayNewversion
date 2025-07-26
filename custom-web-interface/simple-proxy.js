const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8086;

// Configuration CORS permissive pour le développement
app.use(cors({
    origin: ['http://localhost:8888', 'http://127.0.0.1:8888'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRFToken']
}));

// Proxy vers l'API Faraday
app.use('/_api', createProxyMiddleware({
    target: 'http://localhost:5985',
    changeOrigin: true,
    secure: false,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxy: ${req.method} ${req.originalUrl} -> http://localhost:5985${req.originalUrl}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', message: err.message });
    }
}));

// Route de test
app.get('/health', (req, res) => {
    res.json({ status: 'CORS Proxy running', port: PORT });
});

app.listen(PORT, () => {
    console.log(`🔄 CORS Proxy running on http://localhost:${PORT}`);
    console.log(`🎯 Proxying requests to Faraday API on http://localhost:5985`);
    console.log(`✅ CORS enabled for http://localhost:8888`);
});
