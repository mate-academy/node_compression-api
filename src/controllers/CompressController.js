'use strict';

const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream');
const formidable = require('formidable');

const AbstractController = require('./AbstractController');

class CompressController extends AbstractController {
  index() {
    const form = new formidable.IncomingForm();

    form.uploadDir = '/tmp';
    form.keepExtensions = true;

    // eslint-disable-next-line max-len
    form.parse(
      this.request,
      (err, { compressionType: fields }, { file: files }) => {
        if (err || !fields || !files) {
          this.response.writeHead(400, { 'Content-Type': 'text/plain' });
          this.response.end('Error uploading file');

          return;
        }

        const [compressionType] = fields;
        const [file] = files;

        if (!['gzip', 'deflate', 'br'].includes(compressionType)) {
          this.response.statusCode = 400;
          this.response.end('Compression type not supported');

          return;
        }

        const fileStream = fs.createReadStream(file.filepath);
        let gzipStream;

        switch (compressionType) {
          case 'deflate':
            gzipStream = zlib.createDeflate();
            break;
          case 'br':
            gzipStream = zlib.createBrotliCompress();
            break;
          default:
            gzipStream = zlib.createGzip();
        }

        pipeline(fileStream, gzipStream, this.response, () => {
          this.response.statusCode = 500;
          this.response.end('Server Error');
        });

        this.response.on('close', () => {
          fileStream.destroy();
        });

        this.response.on('error', () => fileStream.destroy());
        this.response.statusCode = 200;

        this.response.setHeader(
          'Content-Disposition',
          `attachment; filename=${file.originalFilename}.${compressionType}`,
        );
      },
    );
  }
}

module.exports = CompressController;
