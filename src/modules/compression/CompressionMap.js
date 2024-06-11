/* eslint-disable max-len */
'use strict';

const zlib = require('zlib');

const CompressionMap = new Proxy({
  gzip: {
    createCompress: zlib.createGzip,
    ext: 'gz',
  },
  deflate: {
    createCompress: zlib.createDeflate,
    ext: 'deflate',
  },
  brotli: {
    createCompress: zlib.createBrotliCompress,
    ext: 'br',
  },
}, {
  get(target, format) {
    if (format in target) {
      return target[format];
    }

    throw new Error(`Unsupported compression type: ${format}`);
  },
});

module.exports = { CompressionMap };
