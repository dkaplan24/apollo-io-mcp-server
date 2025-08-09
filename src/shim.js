// Lightweight HTTP shim to satisfy Scout's HTTP MCP flow
const http = require('http');
const { spawn } = require('child_process');

// Start the MCP SSE server on an internal port
const INTERNAL_PORT = 9000;
const PUBLIC_PORT = Number(process.env.PORT || 8080);

// Launch: mcp-proxy --port 9000 --path /sse node dist/index.js
const child = spawn('npx', ['mcp-proxy', '--port', String(INTERNAL_PORT), '--path', '/sse', 'node', 'dist/index.js'], {
  stdio: 'inherit',
  env: process.env,
});

// Very basic proxy for SSE and a /register handler
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/register') {
    // Minimal MCP HTTP response: tell client where the SSE lives
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ url: '/sse' }));
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/sse')) {
    // Proxy the SSE stream from the internal server
    const options = {
      hostname: '127.0.0.1',
      port: INTERNAL_PORT,
      path: '/sse',
      method: 'GET',
      headers: req.headers,
    };
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end('Proxy error: ' + err.message);
    });
    proxyReq.end();
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
});

// Start public HTTP server
server.listen(PUBLIC_PORT, () => {
  console.log(`HTTP shim listening on ${PUBLIC_PORT} (POST /register, GET /sse)`);
});

// Clean shutdown
process.on('SIGTERM', () => { child.kill('SIGTERM'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { child.kill('SIGINT'); server.close(() => process.exit(0)); });
