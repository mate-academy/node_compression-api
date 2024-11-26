/* eslint-disable no-console */
'use strict';

const http = require('http');
const zlib = require('zlib');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

function createServer() {
  const server = http.createServer();

  server.on('request', (req, res) => {
    console.log(`Request method: ${req.method}, URL: ${req.url}`);

    if (req.method === 'GET' && req.url === '/') {
      const filePath = path.resolve(__dirname, '../public', 'index.html');

      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error('Error loading form:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading form');

          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
    } else if (req.method === 'GET' && req.url === '/public/request.js') {
      const filePath = path.resolve(__dirname, '..', 'public', 'request.js');

      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error('Error loading script:', err);
          res.statusCode = 404;
          res.end('Not Found');

          return;
        }

        res.setHeader('Content-Type', 'text/javascript');
        res.end(data);
      });
    } else if (req.method === 'GET' && req.url === '/compress') {
      res.statusCode = 400;
      res.end('Method not allowed');
    } else if (req.method === 'POST' && req.url === '/compress') {
      const chunks = [];

      req.on('data', (chunk) => chunks.push(chunk));

      req.on('end', () => {
        const data = Buffer.concat(chunks);

        if (data.length === 0) {
          res.statusCode = 400;
          res.end('No file provided');

          return;
        }

        const boundaryMatch = req.headers['content-type']?.match(
          /boundary=(?:"([^"]+)"|([^;]+))/i,
        );

        if (!boundaryMatch) {
          res.statusCode = 400;
          res.end('Invalid content type');

          return;
        }

        const boundary = boundaryMatch[1] || boundaryMatch[2];
        const parts = data.toString().split(`--${boundary}`);

        let compressionType;
        let fileName;

        for (const part of parts) {
          if (part.includes('name="compressionType"')) {
            compressionType = part.split('\r\n\r\n')[1]?.trim();
          }

          if (part.includes('filename=')) {
            const filenameMatch = part.match(/filename="([^"]+)"/);

            if (filenameMatch) {
              fileName = filenameMatch[1];
            }
          }
        }

        if (!compressionType || !fileName) {
          res.statusCode = 400;
          res.end('Missing required fields');

          return;
        }

        let compressionStream;

        switch (compressionType) {
          case 'gzip':
            compressionStream = zlib.createGzip();
            break;
          case 'deflate':
            compressionStream = zlib.createDeflate();
            break;
          case 'br':
            compressionStream = zlib.createBrotliCompress();
            break;
          default:
            res.statusCode = 400;
            res.end('Unsupported compression type');

            return;
        }

        const compressionExt = {
          gzip: '.gzip',
          deflate: '.deflate',
          br: '.br',
        }[compressionType];

        res.statusCode = 200;

        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${fileName}${compressionExt}`,
        );
        res.setHeader('Content-Type', 'application/octet-stream');

        const fileContent = parts
          .find((part) => part.includes('filename='))
          ?.split('\r\n\r\n')[1]
          ?.trim();

        if (!fileContent) {
          res.statusCode = 400;
          res.end('No file content');

          return;
        }

        const fileStream = Readable.from(Buffer.from(fileContent));

        fileStream
          .pipe(compressionStream)
          .pipe(res)
          .on('error', (err) => {
            console.error('Stream error:', err);
            res.statusCode = 500;
            res.end('Server error');
          });
      });
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  return server;
}

module.exports = {
  createServer,
};
