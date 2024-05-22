const fs = require('fs');
const path = require('path');
const { response } = require('../constants/response');

async function httpGetMainPage(res) {
  const indexFile = path.join(__dirname, '..', '..', 'public', 'index.html');

  await fs.readFile(indexFile, (err, data) => {
    res.setHeader('Content-Type', 'text/html');

    if (err) {
      res.statusCode = response[503].statusCode;

      res.end(response[503].messages.service);

      return;
    }

    res.statusCode = response[200].statusCode;
    res.end(data);
  });
}

module.exports = { httpGetMainPage };
