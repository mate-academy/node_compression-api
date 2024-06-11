'use strict';

const fs = require('fs');
const archiver = require('archiver');
const { setContentAttachment } = require('../../helpers/setContentAttachment');
const { CompressionMap } = require('../../modules/compression/CompressionMap');

function responseCompressedFiles(response, files, compressFormat) {
  const archive = archiver('zip');

  response.on('close', () => archive.destroy());
  setContentAttachment(response, `${files.length}-files.zip`);

  files.forEach((file) => {
    const newExt = CompressionMap[compressFormat].ext;
    const fileStream = fs.createReadStream(file.filepath);
    const compressStream = CompressionMap[compressFormat].createCompress();

    fileStream.pipe(compressStream);

    archive.append(compressStream, {
      name: `${file.originalFilename}.${newExt}`,
    });
  });

  archive.pipe(response);
  archive.finalize();
}

module.exports = { responseCompressedFiles };
