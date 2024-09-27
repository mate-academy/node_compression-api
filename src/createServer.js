'use strict';

const zlib = require('node:zlib');
const fs = require('fs');
const { Server } = require('node:http');
const formidable = require('formidable');

function createServer() {
  const server = new Server();

  server.on('request', async (req, res) => {
    if (req.url === '/compress' && req.method === 'GET') {
      res.writeHead(400, { 'Content-Type': 'text/plain' });

      return res.end(
        'You are trying to send a form by using GET method, use POST instead',
      );
    }

    if (req.url === '/compress' && req.method === 'POST') {
      const form = new formidable.IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });

          return res.end('Error parsing form data');
        }

        const compressionType = fields.compressionType[0];
        const uploadedFile = files.file;

        if (!uploadedFile) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });

          return res.end('No file provided');
        }

        let compressStream;
        const fileName = uploadedFile[0].originalFilename;
        const filePath = uploadedFile[0].filepath;
        let newFileName;

        switch (compressionType) {
          case 'gzip':
            newFileName = fileName + '.gz';
            compressStream = zlib.createGzip();
            break;
          case 'deflate':
            newFileName = fileName + '.dfl';
            compressStream = zlib.createDeflate();
            break;
          case 'br':
            newFileName = fileName + '.br';
            compressStream = zlib.createBrotliCompress();
            break;
          default:
            res.writeHead(400, { 'Content-Type': 'text/plain' });

            return res.end('Invalid compression type');
        }

        if (!fs.existsSync(filePath)) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });

          return res.end('File not found');
        }

        const readStream = fs.createReadStream(filePath, 'utf8');

        readStream
          .on('error', () => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error reading compressed file');
          })
          .pipe(compressStream)
          .on('error', () => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error reading compressed file');
          })
          .pipe(res)
          .on('error', () => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error reading compressed file');
          });

        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${newFileName}"`,
        });

        res.on('close', () => readStream.destroy());
      });
    } else if (req.url === '/') {
      const FORM_PAGE = './public/index.html';

      if (!fs.existsSync(FORM_PAGE)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');

        return;
      }

      const readStream = fs.createReadStream(FORM_PAGE, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      readStream.pipe(res);

      readStream.on('error', () => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading file');
      });

      res.on('close', () => readStream.destroy());
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('URL Not Found');
    }
  });

  server.on('error', () => {});

  return server;
}

module.exports = {
  createServer,
};
