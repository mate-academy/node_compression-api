'use strict';

const http = require('http');
const fs = require('fs');
const formidable = require('formidable');
const zlib = require('zlib');
const { pipeline } = require('stream');

const availableCompressions = ['br', 'gzip', 'deflate'];

const initCompression = (type) => {
  switch (type) {
    case 'br':
      return zlib.createBrotliCompress();
    case 'deflate':
      return zlib.createDeflate();
    default:
      return zlib.createGzip();
  }
};

function createServer() {
  const server = new http.Server();

  server.on('request', async (req, res) => {
    const url = new URL(req.url, `http:${req.headers.host}`);

    res.setHeader('Content-type', 'text/plain');

    if (url.pathname === '/') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');

      return fs.createReadStream('public/index.html').pipe(res);
    }

    if (url.pathname !== '/compress') {
      res.statusCode = 404;

      return res.end('Not found');
    }

    if (req.method !== 'POST') {
      res.statusCode = 400;

      return res.end('Invalid request method');
    }

    const form = new formidable.IncomingForm();

    try {
      const [fields, files] = await form.parse(req);
      const [targetType] = fields?.compressionType;
      const [targetFile] = files?.file;

      if (!targetType || !targetFile) {
        res.statusCode = 400;

        return res.end('Invalid form');
      }

      if (!availableCompressions.includes(targetType)) {
        res.statusCode = 400;

        return res.end('Invalid compression');
      }

      const fileStream = fs.createReadStream(targetFile.filepath);
      const compression = initCompression(targetType);

      res.statusCode = 200;

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${targetFile.originalFilename}.${targetType}`,
      );

      pipeline(fileStream, compression, res, (err) => {
        res.statusCode = 500;

        return res.end(String(err));
      });

      res.on('close', () => {
        fileStream.destroy();
      });
    } catch (err) {
      res.statusCode = err.httpCode || 400;

      return res.end(String(err));
    }
  });

  server.on('error', () => {});

  return server;
}

module.exports = {
  createServer,
};
