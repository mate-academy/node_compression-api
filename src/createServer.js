/* eslint-disable no-console */
/* eslint-disable curly */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { formidable } = require('formidable');
const {
  createGzip,
  createBrotliCompress,
  createDeflate,
} = require('node:zlib');

function createServer() {
  const server = new http.Server();

  server.on('request', async (req, res) => {
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

      return;
    }

    if (req.method === 'POST' && req.url === '/compress') {
      const form = formidable({});
      let fields, files;

      try {
        [fields, files] = await form.parse(req);
      } catch (err) {
        res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
        res.end(String(err));

        return;
      }

      const compressionType = Array.isArray(fields.compressionType)
        ? fields.compressionType[0]
        : fields.compressionType;

      const filePath = Array.isArray(files.file)
        ? files.file[0].filepath
        : files.file;
      const fileName = Array.isArray(files.file)
        ? files.file[0].originalFilename
        : files.file;

      if (!filePath || !fileName || !compressionType) {
        res.statusCode = 400;
        res.end();

        return;
      }

      if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        res.end('File not found!');

        return;
      }

      let compressionData, extension;

      switch (compressionType) {
        case 'gzip':
          compressionData = createGzip();
          res.setHeader('Content-Encoding', 'gz');
          extension = 'gzip';
          break;
        case 'deflate':
          compressionData = createDeflate();
          res.setHeader('Content-Encoding', '.dfl');
          extension = 'deflate';
          break;
        case 'br':
          compressionData = createBrotliCompress();
          res.setHeader('Content-Encoding', '.br');
          extension = 'br';
          break;
        default:
          res.statusCode = 400;
          res.end();

          return;
      }

      const fileStream = fs.createReadStream(filePath);

      res.statusCode = 200;

      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename=${fileName}.${extension}`,
      });
      console.log(fields, files, req.method, compressionType);

      fileStream
        .pipe(compressionData)
        .pipe(res)
        .on('error', (err) => {
          res.statusCode = 500;
          res.end(`Stream error: ${err.message}`);
        });

      return;
    }

    if (req.url !== '/') {
      res.statusCode = 404;
      res.end();
    }
  });

  return server;
}

module.exports = {
  createServer,
};
