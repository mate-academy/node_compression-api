const fs = require('fs');
const path = require('path');

async function httpGetMainPage(res) {
  const indexFile = path.join(__dirname, '..', '..', 'public', 'index.html');

  await fs.readFile(indexFile, (err, data) => {
    res.setHeader('Content-Type', 'text/html');

    if (err) {
      res.statusCode = 503;

      res.end('Service Unavailable');

      return;
    }

    res.statusCode = 200;
    res.end(data);
  });
}

module.exports = { httpGetMainPage };
