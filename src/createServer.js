'use strict';

const http = require('http');
const fs = require('fs');
const { createGzip, createBrotliCompress, createDeflate } = require('zlib');
const formidable = require('formidable');
const compressors = {
  gzip: createGzip(),
  br: createBrotliCompress(),
  deflate: createDeflate(),
};

function createServer() {
  const server = new http.Server();

  server.on('request', (req, res) => {
    if (req.url === '/' && req.method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');

      res.end(`
        <div style="display: flex; flex-direction: column; align-items: center; font-family: Arial, Helvetica, sans-serif;">
          <h1>Form</h1>
          <form
            action="/compress"
            method="POST"
            enctype="multipart/form-data"
            style="display: flex; flex-direction: column; gap: 20px;"
          >
            <label for="file">Select a file:</label>
            <input id="file" type="file" name="file" />
            <label for="compressionType">Select compression type:</label>
            <select id="compressionType" name="compressionType">
              <option value="" selected>---</option>
              <option value="gzip">gzip</option>
              <option value="deflate">deflate</option>
              <option value="br">br</option>
            </select>
            <button type="submit">Compress</button>
          </form>
        </div>
      `);

      return;
    }

    if (req.url === '/compress' && req.method === 'GET') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');

      res.end('Requests to /compress need to be POST method');

      return;
    }

    if (req.url === '/compress' && req.method === 'POST') {
      const form = new formidable.IncomingForm();

      form.parse(req, (err, { compressionType }, { file }) => {
        if (!file) {
          // eslint-disable-next-line no-console
          console.error('missing file');
          res.statusCode = 400;
          res.end('Missing file');

          return;
        }

        if (!compressionType) {
          // eslint-disable-next-line no-console
          console.error('missing compression type');
          res.statusCode = 400;
          res.end('Missing compression type');

          return;
        }

        if (!Object.keys(compressors).includes(compressionType[0])) {
          // eslint-disable-next-line no-console
          console.error('Unsupported compression type');
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

        const compressedFile = fileReadStream
          .on('error', () => {
            res.statusCode = 404;
            res.end('Cannot read file');
          })
          .pipe(compressors[selectedCompressionType])
          .on('error', () => {
            res.statusCode = 400;
            res.end('Something wrong with compression');
          });

        res.statusCode = 200;

        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${compressedFileName}`,
        );
        compressedFile.pipe(res);

        res.on('close', () => {
          fileReadStream.destroy();
        });
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
