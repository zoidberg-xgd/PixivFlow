#!/usr/bin/env node
/**
 * 简单的 HTTP 代理转发服务
 * 用于在 Docker 容器中访问只监听在 127.0.0.1 的代理
 * 
 * 使用方法：
 *   node scripts/proxy-forwarder.js 6154 127.0.0.1:6152
 * 
 * 然后在配置文件中使用 172.18.0.1:6154 作为代理
 */

const http = require('http');
const net = require('net');

const [listenPort, targetProxy] = process.argv.slice(2);

if (!listenPort || !targetProxy) {
  console.error('Usage: node proxy-forwarder.js <listen-port> <target-proxy>');
  console.error('Example: node proxy-forwarder.js 6154 127.0.0.1:6152');
  process.exit(1);
}

const [targetHost, targetPort] = targetProxy.split(':');

// Create HTTP server
const server = http.createServer();

// Handle CONNECT requests using 'connect' event
server.on('connect', (req, clientSocket, head) => {
  console.log(`[CONNECT] Request to ${req.url}`);
  
  // Parse target host and port
  const [targetHostName, targetPortNum] = req.url.split(':');
  
  // Create connection to target proxy
  const proxySocket = net.createConnection({
    host: targetHost,
    port: parseInt(targetPort, 10)
  }, () => {
    console.log(`[CONNECT] Connected to target proxy ${targetHost}:${targetPort}`);
    
    // Send CONNECT request to target proxy
    const connectRequest = `CONNECT ${req.url} HTTP/1.1\r\n` +
      `Host: ${req.url}\r\n` +
      Object.entries(req.headers)
        .filter(([key]) => key !== 'host' && key !== 'connection' && key !== 'proxy-connection')
        .map(([key, value]) => `${key}: ${value}\r\n`)
        .join('') +
      '\r\n';
    
    proxySocket.write(connectRequest);
    console.log(`[CONNECT] Sent CONNECT request to target proxy`);
  });

  // Handle response from target proxy
  let responseBuffer = Buffer.alloc(0);
  let responseParsed = false;
  
  proxySocket.on('data', (data) => {
    if (!responseParsed) {
      responseBuffer = Buffer.concat([responseBuffer, data]);
      const headerEnd = responseBuffer.indexOf('\r\n\r\n');
      if (headerEnd !== -1) {
        responseParsed = true;
        // Parse response (support both HTTP/1.0 and HTTP/1.1)
        const headers = responseBuffer.slice(0, headerEnd).toString();
        const statusLine = headers.split('\r\n')[0];
        // Match HTTP/1.0 or HTTP/1.1 status line
        const statusMatch = statusLine.match(/HTTP\/\d\.\d\s+(\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 200;
        
        console.log(`[CONNECT] Proxy response: ${statusLine} (status: ${statusCode})`);
        
        // Send response to client
        if (statusCode >= 200 && statusCode < 300) {
          // Send 200 Connection Established to client
          clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
          
          // Send remaining data (if any) to client
          const bodyStart = headerEnd + 4;
          if (bodyStart < responseBuffer.length) {
            const remainingData = responseBuffer.slice(bodyStart);
            if (!clientSocket.destroyed) {
              clientSocket.write(remainingData);
            }
          }
          
          // Send any head data that was already received
          if (head && head.length > 0) {
            proxySocket.write(head);
          }
          
          // Establish bidirectional tunnel
          // Remove data listener to avoid double processing
          proxySocket.removeAllListeners('data');
          
          // Pipe bidirectional data
          proxySocket.pipe(clientSocket, { end: false });
          clientSocket.pipe(proxySocket, { end: false });
          
          console.log(`[CONNECT] Tunnel established for ${req.url}`);
        } else {
          // Proxy returned error
          const errorBody = responseBuffer.slice(headerEnd + 4).toString();
          clientSocket.write(`HTTP/1.1 ${statusCode} Proxy Error\r\n\r\n${errorBody || 'Proxy Error'}`);
          proxySocket.destroy();
          clientSocket.destroy();
        }
      }
    }
  });

  proxySocket.on('error', (err) => {
    console.error(`[CONNECT] Proxy socket error: ${err.message}`);
    if (!clientSocket.destroyed) {
      clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      clientSocket.destroy();
    }
  });
  
  proxySocket.on('close', () => {
    console.log(`[CONNECT] Proxy socket closed for ${req.url}`);
    if (!clientSocket.destroyed) {
      clientSocket.destroy();
    }
  });

  clientSocket.on('error', (err) => {
    console.error(`[CONNECT] Client socket error: ${err.message}`);
    proxySocket.destroy();
  });
  
  clientSocket.on('close', () => {
    console.log(`[CONNECT] Client socket closed for ${req.url}`);
    proxySocket.destroy();
  });
});

// Handle regular HTTP requests
server.on('request', (clientReq, clientRes) => {
  console.log(`[HTTP] ${clientReq.method} ${clientReq.url}`);
  
  const options = {
    hostname: targetHost,
    port: parseInt(targetPort, 10),
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });

  proxyReq.on('error', (err) => {
    console.error(`[HTTP] Proxy request error: ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end('Bad Gateway');
    }
  });

  clientReq.pipe(proxyReq);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});

server.listen(parseInt(listenPort, 10), '0.0.0.0', () => {
  console.log(`Proxy forwarder listening on 0.0.0.0:${listenPort}, forwarding to ${targetProxy}`);
});
