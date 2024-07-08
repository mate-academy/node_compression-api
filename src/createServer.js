/* eslint-disable no-console */
'use strict';

const http = require('http');
const fs = require('fs');
const formidable = require('formidable');
const { getCompressedFile } = require('./getCompressedFile');
const { compressionTypes } = require('./compressionTypes');

function createServer() {
  const server = new http.Server();

  server.on('request', (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const form = new formidable.IncomingForm();

    if (url.pathname !== '/compress') {
      res.statusCode = 404;
      res.end('Trying to access a non-existing route!');

      return;
    }

    if (url.req.method !== 'POST') {
      res.statusCode = 400;
      res.end('Use POST request method instead!');

      return;
    }

    if (url.pathname === '/' && req.method === 'GET') {
      res.statusCode = 200;
      res.end('Ready!');

      return;
    }

    form.parse(req, (err, { compressionType: fields }, { file: files }) => {
      if (err || !fields || !files) {
        res.statusCode = 400;
        res.end('Bad request, form has errors');

        return;
      }

      const [compressionType] = fields;
      const [file] = files;

      if (!compressionTypes.includes(compressionType)) {
        res.statusCode = 404;
        res.end('Bad Request: Compression type not supported');

        return;
      }

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${file.originalFilename}.${compressionType}`,
      );

      const fileStream = fs.createReadStream(file.filepath);

      fileStream
        .on('error', (error) => {
          res.statusCode = 500;
          res.end('Internal Server Error: Failed to read file', error);
        })
        .pipe(getCompressedFile(compressionType))
        .on('error', (error) => {
          res.statusCode = 500;
          res.end('Internal Server Error: Failed to compress file', error);
        })
        .pipe(res)
        .on('error', (error) => {
          console.error('Error sending response:', error);
        });

      res.on('error', () => fileStream.destroy());
    });
  });

  return server;
}

module.exports = { createServer };
