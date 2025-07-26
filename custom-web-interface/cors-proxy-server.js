/**
 * Serveur proxy CORS pour Faraday
 * Ce serveur fait l'interface entre le frontend et l'API Faraday
 * en ajoutant les headers CORS nécessaires
 */

const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs');

// Configuration
const PROXY_PORT = 8082;
const FARADAY_BASE_URL = 'http://localhost:5985';
const STATIC_DIR = __dirname; // Servir les fichiers statiques depuis ce répertoire

// Types de contenu
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'text/plain';
}

function addCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRFToken, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'X-CSRFToken, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
}

function handleStaticFile(req, res, filePath) {
    // Servir les fichiers statiques
    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
        // Essayer index.html dans le répertoire
        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) {
            filePath = indexPath;
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Directory listing not allowed');
            return;
        }
    }

    const mimeType = getMimeType(filePath);
    const fileStream = fs.createReadStream(filePath);
    
    addCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': mimeType });
    fileStream.pipe(res);
}

function proxyToFaraday(req, res) {
    console.log(`🔄 Proxying: ${req.method} ${req.url}`);

    // Traiter les requêtes OPTIONS (preflight CORS)
    if (req.method === 'OPTIONS') {
        addCorsHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

    // Construire l'URL Faraday
    const faradayUrl = `${FARADAY_BASE_URL}${req.url}`;
    const parsedUrl = url.parse(faradayUrl);

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: req.method,
        headers: {
            ...req.headers,
            host: parsedUrl.host
        }
    };

    // Supprimer les headers problématiques
    delete options.headers.origin;
    delete options.headers.referer;

    const proxy = http.request(options, (faradayRes) => {
        // Ajouter les headers CORS
        addCorsHeaders(res);
        
        // Copier les headers de réponse de Faraday
        Object.keys(faradayRes.headers).forEach(key => {
            res.setHeader(key, faradayRes.headers[key]);
        });

        res.writeHead(faradayRes.statusCode);
        faradayRes.pipe(res);
    });

    proxy.on('error', (err) => {
        console.error('❌ Erreur proxy:', err.message);
        addCorsHeaders(res);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Proxy Error',
            message: 'Impossible de contacter le serveur Faraday',
            details: err.message
        }));
    });

    // Transférer le corps de la requête
    req.pipe(proxy);
}

// Créer le serveur
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log(`📥 ${req.method} ${pathname}`);

    // Routes API - proxy vers Faraday
    if (pathname.startsWith('/_api') || pathname.startsWith('/v3')) {
        proxyToFaraday(req, res);
        return;
    }

    // Routes statiques - servir les fichiers locaux
    let filePath = path.join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);
    
    // Sécurité - empêcher l'accès aux fichiers en dehors du répertoire
    if (!filePath.startsWith(STATIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access denied');
        return;
    }

    handleStaticFile(req, res, filePath);
});

// Gestion des erreurs du serveur
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PROXY_PORT} est déjà utilisé. Essayez de fermer l'autre serveur ou utilisez un autre port.`);
    } else {
        console.error('❌ Erreur du serveur:', err);
    }
});

// Démarrer le serveur
server.listen(PROXY_PORT, () => {
    console.log('🚀 Serveur proxy CORS Faraday démarré !');
    console.log(`📡 Proxy API: http://localhost:${PROXY_PORT}/_api/v3/`);
    console.log(`🌐 Interface web: http://localhost:${PROXY_PORT}`);
    console.log(`🔗 Faraday backend: ${FARADAY_BASE_URL}`);
    console.log('');
    console.log('ℹ️  Ce serveur:');
    console.log('   - Sert votre interface web personnalisée');
    console.log('   - Redirige les appels API vers Faraday avec les headers CORS');
    console.log('   - Gère l\'authentification automatiquement');
    console.log('');
    console.log('✅ Utilisez http://localhost:8082 pour accéder à votre interface');
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur proxy...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur proxy...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});
