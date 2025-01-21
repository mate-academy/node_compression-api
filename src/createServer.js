'use strict';

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const mime = require('mime-types');
const { pipeline } = require('node:stream');
const formidable = require('formidable');
const zlib = require('node:zlib');

const compressionMethods = {
  gzip: { method: zlib.createGzip, ext: '.gzip' },
  deflate: { method: zlib.createDeflate, ext: '.deflate' },
  br: { method: zlib.createBrotliCompress, ext: '.br' },
};

function createServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);

    if (req.method === 'POST' && url.pathname === '/compress') {
      const form = new formidable.IncomingForm();

      form.parse(req, (err, fields, files) => {
        if (err) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });

          return res.end('Error parsing the form');
        }

        // Переконуємося, що отримали коректні дані
        const file = files.file ? files.file[0] : null;
        const compressionType = fields.compressionType
          ? fields.compressionType[0]
          : null;

        if (!file) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });

          return res.end('No file provided');
        }

        if (!compressionType || !compressionMethods[compressionType]) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });

          return res.end('Invalid or unsupported compression type');
        }

        const { method, ext } = compressionMethods[compressionType];
        const compressedFileName = path.basename(file.originalFilename) + ext;

        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename=${compressedFileName}`,
        });

        const readStream = fs.createReadStream(file.filepath);
        const compressStream = method();

        pipeline(readStream, compressStream, res, () => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error');
          }
        });

        res.on('close', () => {
          readStream.destroy();
        });
      });
    } else if (req.method === 'GET') {
      if (url.pathname === '/compress') {
        res.statusCode = 400;
        res.end();

        return;
      }

      const requestedPath = url.pathname.slice(1);
      const realPath = path.join('public', requestedPath || 'index.html');

      if (!fs.existsSync(realPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });

        return res.end('Not Found');
      }

      const mimeType = mime.contentType(path.extname(realPath)) || 'text/plain';

      res.writeHead(200, { 'Content-Type': mimeType });

      const fileStream = fs.createReadStream(realPath);

      pipeline(fileStream, res, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Server Error');
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return server;
}

module.exports = {
  createServer,
};
