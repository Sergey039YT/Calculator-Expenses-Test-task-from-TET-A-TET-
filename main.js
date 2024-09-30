import { readFile } from 'fs/promises';
import { createServer } from 'http';
import { gzip } from 'zlib';

const types = {
    txt: 'text/plain; charset=utf-8',
    html: 'text/html; charset=utf-8',
    css: 'text/css',
    js: 'application/javascript',
    webp: 'image/webp',
    ico: 'image/x-icon',
    svg: 'image/svg+xml',
    ttf: 'font/ttf'
};

createServer(function(req, res) {
    function send(code, headers, data) {
        if (req.headers['accept-encoding']?.includes('gzip')) {
            res.setHeader('Content-Encoding', 'gzip');
            res.writeHead(code, headers);
            gzip(data, (err, data) => res.end(data));
        }
        else res.writeHead(code, headers).end(data);
    }

    const url = new URL(req.url, 'http://127.0.0.1');
    let path = url.pathname;
    if (req.method !== 'GET') {
        res.writeHead(405).end();
        return;
    }
    if (!path.includes('/')||path==='/') path = '/index.html';
    let reqType = types[path.split('.').pop()] || types.txt;
    readFile('./src' + path).catch(() => (readFile('./public' + path))).then(function(data) {
        send(200, {
            'Content-Type': reqType,
            'Cache-Control': (reqType===types.js && path==='/chart.js') ? 'max-age=360000' : (reqType===types.svg ? 'max-age=3600' : 'no-cache')
        }, data);
    }, () => res.writeHead(500).end());
}).listen(3000);
