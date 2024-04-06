/* eslint-disable no-console */
'use strict';

const http = require('http');
const fs = require('fs');
const zlib = require('zlib');
const formidable = require('formidable');

const compressionTypes = ['gzip', 'deflate', 'br'];

function getCompressedFile(compressionType) {
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
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname === '/' && req.method === 'GET') {
      res.setHeader('content-type', 'plain/text');
      res.statusCode = 200;
      res.end('Done');

      return;
    }

    if (pathname !== '/compress') {
      res.setHeader('content-type', 'plain/text');
      res.statusCode = 404;
      res.end('ERROR: non-existent endpoint');

      return;
    }

    if (req.method !== 'POST') {
      res.setHeader('content-type', 'plain/text');
      res.statusCode = 400;
      res.end('ERROR: change request method');

      return;
    }

    const form = new formidable.IncomingForm();

    form.parse(req, (error, { compressionType: cTypes }, { file: files }) => {
      if (error || !cTypes || !files) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        res.end('ERROR');

        return;
      }

      const [compressionType] = cTypes;
      const [file] = files;

      if (!compressionTypes.includes(compressionType)) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        res.end('ERROR: compression type not supported');

        return;
      }

      const compressed = getCompressedFile(compressionType);

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${file.originalFilename}.${compressionType}`,
      );

      const fileStream = fs.createReadStream(file.filepath);

      fileStream
        .on('error', (err) => console.log(err))
        .pipe(compressed)
        .on('error', (err) => console.log(err))
        .pipe(res)
        .on('error', (err) => console.log(err));

      res.on('close', () => fileStream.destroy());
    });
  });

  return server;
}

module.exports = { createServer };
