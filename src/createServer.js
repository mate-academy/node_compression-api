'use strict';

const http = require('http');
const zlib = require('zlib');
const formidable = require('formidable');
const fs = require('fs');

const compressionTypes = ['gzip', 'deflate', 'br'];

function handleCompressFile(compressionType) {
  switch (compressionType) {
    case 'gzip':
      return zlib.createGzip();
    case 'deflate':
      return zlib.createDeflate();
    case 'br':
      return zlib.createBrotliCompress();
    default:
      return null;
  }
}

function createServer() {
  const server = new http.Server();

  server.on('request', (req, res) => {
    const form = new formidable.IncomingForm();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname === '/' && req.method === 'GET') {
      res.statusCode = 200;
      res.end('Ready');

      return;
    }

    if (pathname !== '/compress') {
      res.statusCode = 404;
      res.end('Trying to access a non-existing route');

      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 400;
      res.end('Use POST request method instead');

      return;
    }

    form.parse(req, (error, { compressionType: fields }, { file: files }) => {
      if (error || !files || !fields) {
        res.statusCode = 400;
        res.end('Bad request');

        return;
      }

      const [compressionType] = fields;
      const [file] = files;

      if (!compressionTypes.includes(compressionType)) {
        res.statusCode = 400;
        res.end('Compression type not supported');

        return;
      }

      const compressedFile = handleCompressFile(compressionType);

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${file.originalFilename}.${compressionType}`,
      );

      const fileStream = fs.createReadStream(file.filepath);

      fileStream
        .on('error', (err) => {
          res.statusCode = 500;
          res.end('Failed to read file', err);
        })
        .pipe(compressedFile)
        .on('error', (err) => {
          res.statusCode = 500;
          res.end('Failed to compress file', err);
        })
        .pipe(res)
        .on('error', (err) => {
          // eslint-disable-next-line no-console
          console.error('Error sending response:', err);
        });

      res.on('close', () => fileStream.destroy());
    });
  });

  return server;
}

module.exports = {
  createServer,
};
