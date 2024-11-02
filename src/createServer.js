/* eslint-disable no-console */
/* eslint-disable curly */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const server = new http.Server();
const path = require('node:path');
const { formidable, errors: formidableErrors } = require('formidable');
const zlib = require('node:zlib');

function createServer() {
  return server.on('request', async (req, res) => {
    if (req.url === '/favicon.ico') {
      res.statusCode = 200;
      res.end('');

      return;
    }

    if (req.url === '/compress' && req.method === 'GET') {
      res.statusCode = 400;
      res.end('');

      return;
    }

    if (req.url === '/' && req.method === 'GET') {
      const normalizePath = path.resolve(__dirname, 'index.html');

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');

      const fileStream = fs.createReadStream(normalizePath);

      fileStream.pipe(res).on('error', () => {});

      fileStream.on('error', (err) => {
        res.statusCode = 500;
        res.end(`Server error ${err}`);
      });

      res.on('close', () => fileStream.destroy());
    }

    if (req.method === 'POST' && req.url === '/compress') {
      const gzip = zlib.createGzip();
      const br = zlib.createBrotliCompress();
      const deflate = zlib.createDeflate();

      const form = formidable({});
      let fields;
      let files;

      try {
        [fields, files] = await form.parse(req);
      } catch (err) {
        if (err.code === formidableErrors.maxFieldsExceeded) {
        }
        res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
        res.end(String(err));

        return;
      }

      const compressionType = fields.compressionType[0];
      let compressionData;
      let extension;

      switch (compressionType) {
        case 'gzip':
          compressionData = gzip;
          extension = '.gz';
          break;
        case 'deflate':
          compressionData = deflate;
          extension = '.dfl';
          break;
        case 'br':
          compressionData = br;
          extension = '.br';
          break;
        default:
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end();

          return;
      }

      res.writeHead(
        200,
        'Content-Disposition',
        `attachment; filename=file${extension}`,
      );

      const filePath = files.file[0].filepath;

      if (!fs.existsSync(filePath)) {
        console.log('FILE NOT FOUND');
        res.statusCode = 404;
        res.end('File not found!');
      }

      console.log(filePath);

      const fileStream = fs.createReadStream(filePath);

      fileStream.pipe(compressionData.pipe(res));

      // res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end();

      return;
    }

    if (req.url !== '/') {
      res.statusCode = 404;
      res.end();
    }
  });
}

module.exports = {
  createServer,
};
