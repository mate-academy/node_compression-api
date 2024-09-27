'use strict';

const zlib = require('node:zlib');
const fs = require('fs');
const { Server } = require('node:http');
const formidable = require('formidable');

function createServer() {
  const server = new Server();

  server.on('request', async (req, res) => {
    if (req.url === '/compress' && req.method.toLowerCase() === 'post') {
      const form = new formidable.IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });

          return res.end('Error parsing form data');
        }

        const compressionType = fields.compressionType[0];
        const uploadedFile = files.file;

        const newFilePath =
          './public/compressed_files/' + uploadedFile[0].originalFilename;

        res.writeHead(200, { 'Content-Type': 'text/plain' });

        await fs.rename(uploadedFile[0].filepath, newFilePath, (e) => {
          if (e) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });

            return res.end('Error of writing file');
          }
        });

        if (!fs.existsSync(newFilePath)) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });

          return res.end('Compressed file not found');
        }

        const readStream = fs.createReadStream(newFilePath, 'utf8');

        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="yourfile.txt"',
        });

        let compressStream;

        switch (compressionType) {
          case 'gzip':
            compressStream = zlib.createGzip();
            break;
          case 'deflate':
            compressStream = zlib.createDeflate();
            break;
          case 'br':
            compressStream = zlib.createBrotliCompress();
            break;
          default:
            res.writeHead(400, { 'Content-Type': 'text/plain' });

            return res.end('Invalid compression type');
        }

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

        res.on('close', () => readStream.destroy());
      });
    } else if (req.url === '/compress') {
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
