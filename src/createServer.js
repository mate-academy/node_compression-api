/* eslint-disable no-console */
'use strict';

const { Server } = require('http');
const { pipeline } = require('stream');
const fs = require('fs');
// const mime = require('mime-types');
// const path = require('path');
const zlib = require('zlib');
const formidable = require('formidable');

function createServer() {
  const server = new Server();

  server.on('request', (req, res) => {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      fs.createReadStream('./public/index.html').pipe(res);

      return;
    }

    if (req.url === '/compress' && req.method === 'POST') {
      const form = new formidable.IncomingForm();

      const compressionTypes = {
        gzip: zlib.createGzip,
        br: zlib.createBrotliCompress,
        deflate: zlib.createDeflate,
      };

      form.parse(req, (err, fields, files) => {
        const compressionType = fields.compressionType;
        const file = files.file;

        if (
          !compressionType ||
          !file ||
          err ||
          !compressionTypes.hasOwnProperty(compressionType)
        ) {
          res.statusCode = 400;
          res.end('Invalid form data');

          return;
        }

        res.setHeader('Content-encoding', compressionType);

        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${file[0].originalFilename}.${compressionType[0]}`,
        );

        console.log(compressionType);
        console.log(file);

        const fileStream = fs.createReadStream(file[0].filepath);
        const compressionStream = compressionTypes[compressionType[0]]();

        // fileStream
        //   .on('error', () => {})
        //   .pipe(compressionStream)
        //   .on('error', () => {})
        //   .pipe(res)
        //   .on('error', () => {});

        pipeline(fileStream, compressionStream, res, (error) => {
          if (error) {
            // eslint-disable-next-line no-console
            console.error('Pipeline failed', error);
          }
        });

        res.on('close', () => fileStream.destroy());

        res.statusCode = 200;
        res.end('Form received and logged');
      });
    } else {
      res.statusCode = 404;

      res.end();
    }
  });

  server.on('error', (error) => {
    console.error('Server error:', error.message);
  });

  server.on('close', () => console.log('Server is closed'));

  return server;
}

module.exports = {
  createServer,
};
