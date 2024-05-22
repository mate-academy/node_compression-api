const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream');
const formidable = require('formidable');
const { response } = require('../constants/response');

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
        res.statusCode = response[503].statusCode;
        res.end(response[503].messages.service);
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
      res.statusCode = response[400].statusCode;
      res.end(response[400].messages.encoding);

      return;
    }

    res.statusCode = response[200].statusCode;

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
    res.writeHead(err.httpCode || response[400].statusCode, {
      'Content-Type': 'text/plain',
    });
    res.end(String(err));
  }
}

module.exports = { httpCompress };
