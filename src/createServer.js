/* eslint-disable no-console */
'use strict';

const formidable = require('formidable');
const http = require('http');
const fs = require('fs');
const zlib = require('zlib');

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
    const pathName = url.pathname;

    if (pathName === '/' && req.method === 'GET') {
      res.setHeader('Content-type', 'plain/text');
      res.statusCode = 200;
      res.end('Done');

      return;
    }

    if (pathName !== '/compress') {
      res.setHeader('Content-type', 'plain/text');
      res.statusCode = 404;
      res.end('Non-existen endpoint');

      return;
    }

    if (req.method !== 'POST') {
      res.setHeader('Content-type', 'plain/text');
      res.statusCode = 400;
      res.end(`Don't try to do this! Use only POST`);

      return;
    }

    const form = new formidable.IncomingForm();

    form.parse(
      req,
      (error, { compressionType: cType }, { file: uploadedFile }) => {
        if (error || !cType || !uploadedFile) {
          res.writeHead(400, { 'Content-type': 'text/plain' });
          res.end('ERROR');

          return;
        }

        const [compressionType] = cType;
        const [file] = uploadedFile;

        if (!compressionTypes.includes(compressionType)) {
          res.writeHead(400, { 'Content-type': 'text/plain' });
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
      },
    );
  });

  server.on('error', () => {});

  return server;
}

module.exports = {
  createServer,
};
