'use strict';

const http = require('http');
const fs = require('fs');
const zlib = require('zlib');
const formidable = require('formidable');
const compressors = {
  gzip: zlib.createGzip(),
  br: zlib.createBrotliCompress(),
  deflate: zlib.createDeflate(),
};
// const compressorExt = {
//   gzip: 'gz',
//   br: 'br',
//   deflate: 'dfl',
// };

function createServer() {
  const server = new http.Server();

  server.on('request', (req, res) => {
    if (req.url === '/' && req.method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      fs.createReadStream('./public/index.html').pipe(res);

      return;
    }

    if (req.url === '/compress' && req.method === 'GET') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');

      res.end('Requests to /compress need to be POST method');

      return;
    }

    if (req.url === '/compress' && req.method === 'POST') {
      const form = new formidable.IncomingForm({
        uploadDir: `__dirname/../uploads`,
        filename: (name, ext, part) => part.originalFilename,
      });

      form.parse(req, (err, { compressionType }, { file }) => {
        if (!file) {
          // eslint-disable-next-line no-console
          res.statusCode = 400;

          res.end('Missing file');

          return;
        }

        if (!compressionType) {
          // eslint-disable-next-line no-console
          res.statusCode = 400;
          res.end('Missing compression type');

          return;
        }

        if (!Object.keys(compressors).includes(compressionType[0])) {
          // eslint-disable-next-line no-console
          res.statusCode = 400;
          res.end('Unsupported compression type');

          return;
        }

        if (err) {
          // eslint-disable-next-line no-console
          console.error(err);
          res.end();

          return;
        }

        const selectedCompressionType = compressionType[0];
        const selectedFile = file[0];
        const selectedFilePath = selectedFile.filepath;
        const compressedFileName = `${selectedFile.originalFilename}.${selectedCompressionType}`;
        const fileReadStream = fs.createReadStream(selectedFilePath);
        const fileCompressorStream = fileReadStream.pipe(
          compressors[selectedCompressionType].on('error', (error) => {
            if (error) {
              res.statusCode = 400;
              res.end('Problem when compressing file');
            }
          }),
        );

        res.statusCode = 200;

        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${compressedFileName}`,
        );

        fileCompressorStream.pipe(res).on('error', (error) => {
          if (error) {
            res.statusCode = 400;
            res.end('something wrong');
          }
        });

        res.on('close', () => {
          fileReadStream.destroy();
        });
        res.end();
      });

      return;
    }

    res.statusCode = 404;
    res.end('Page not found');
  });

  // eslint-disable-next-line no-console
  server.on('error', (error) => console.log(error));

  return server;
}

module.exports = {
  createServer,
};
