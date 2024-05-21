'use strict';

const http = require('http');
const url = require('url');
const { httpGetMainPage } = require('./routes/httpGetMainPage');
const { httpVerifyRequest } = require('./routes/httpVerifyRequest');
const { httpCompress } = require('./routes/httpComress');

function createServer() {
  return http.createServer(async (req, res) => {
    const method = req.method;
    const normalizedText = new url.URL(req.url, `http://${req.headers.host}`)
      .pathname;

    if (normalizedText === '/') {
      await httpGetMainPage(res);

      return;
    }

    const verifiedPath = httpVerifyRequest(res, normalizedText, method);

    if (!verifiedPath) {
      return;
    }

    if (method === 'POST' && normalizedText === '/compress') {
      await httpCompress(req, res);
    }
  });
}

module.exports = {
  createServer,
};
