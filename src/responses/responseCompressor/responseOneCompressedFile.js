'use strict';

const fs = require('fs');
const { setContentAttachment } = require('../../helpers/setContentAttachment');
const { CompressionMap } = require('../../modules/compression/CompressionMap');

function responseOneCompressedFile(response, files, compressFormat) {
  const file = fs.createReadStream(files[0].filepath);
  const compressedFile = CompressionMap[compressFormat].createCompress();
  const fileName = files[0].originalFilename;

  setContentAttachment(response, `${fileName}.${CompressionMap[compressFormat].ext}`);
  response.on('close', () => compressedFile.destroy());

  file.pipe(compressedFile).pipe(response);
}

module.exports = { responseOneCompressedFile };
