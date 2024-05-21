const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream');
const formidable = require('formidable');

async function httpCompress(req, res) {
  const form = new formidable.Formidable({});
  let fields;
  let files;

  try {
    [fields, files] = await form.parse(req);

    const compressionMethod = fields.compressionType[0];
    const filePath = files.file[0].filepath;
    const fileName = files.file[0].originalFilename;
    let extension;
    let compressionStream;

    const readFileStream = fs.createReadStream(filePath);

    const onError = (e) => {
      if (e) {
        res.statusCode = 503;
        res.end('Service unavailable');
      }
    };

    if (compressionMethod === 'deflate') {
      extension = 'dfl';
      compressionStream = zlib.createDeflate();
    } else if (compressionMethod === 'gzip') {
      extension = 'gz';
      compressionStream = zlib.createGzip();
    } else if (compressionMethod === 'br') {
      extension = 'br';
      compressionStream = zlib.createBrotliCompress();
    } else {
      res.statusCode = 400;
      res.end('Inappropriate encoding extension.');

      return;
    }

    res.statusCode = 200;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName}.${compressionMethod}`,
    );

    const writeFileStream = fs.createWriteStream(`${filePath}.${extension}`);

    compressionStream.pipe(writeFileStream);

    pipeline(readFileStream, compressionStream, res, onError);

    res.on('close', () => {
      readFileStream.destroy();
    });
  } catch (err) {
    res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
    res.end(String(err));
  }
}

module.exports = { httpCompress };
