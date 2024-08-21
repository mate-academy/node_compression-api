/* eslint-disable no-console */
'use strict';

const http = require('http');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const { pipeline } = require('stream');

function createServer() {
  return http.createServer((req, res) => {
    const urlNormalized = new URL(req.url, `http://${req.headers.host}`);
    const form = new formidable.IncomingForm();
    const compressors = {
      gzip: zlib.createGzip(),
      deflate: zlib.createDeflate(),
      br: zlib.createBrotliCompress(),
    };

    if (!fs.existsSync(urlNormalized)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });

      return res.end('Trying access a non-existent endpoint');
    }

    if (urlNormalized.pathname === '/compress' && req.method === 'POST') {
      form.parse(req, (error, { compressionType }, { file }) => {
        if (error || !compressionType || !file) {
          res.writeHead(400, { 'Content-type': 'text/plain' });

          return res.end('Form is invalid');
        }

        if (!Object.keys(compressors).includes(compressionType)) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });

          return res.end('Unsupported compression type');
        }

        const fStream = fs.createReadStream(file[0].filepath);

        res.writeHead(200, {
          'Content-Disposition': `attachment; filename=${file[0].originalFilename}.${compressionType}`,
        });

        pipeline(fStream, compressors[compressionType], res, (err) => {
          res.writeHead(400, { 'Contrnt-Type': 'text/plain' });

          return res.end('Something went wrong', err);
        });
      });

      return;
    }

    if (urlNormalized.pathname === '/compress' && req.method === 'GET') {
      res.writeHead(400, { 'Content-Type': 'text/plain' });

      return res.end('only POST method is not allowed');
    }

    if (urlNormalized.pathname === '/') {
      const html = fs.createReadStream(path.resolve('src', 'index.html'));

      res.setHeader('Content-Type', 'text/html');
      html.pipe(res);

      return;
    }

    res.statusCode = 404;
    res.end('Bad request');
  });
}

module.exports = {
  createServer,
};
