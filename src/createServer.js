'use strict';

const http = require('http');
const url = require('url');
const { httpGetMainPage } = require('./routes/httpGetMainPage');
const { httpVerifyRequest } = require('./routes/httpVerifyRequest');
const { httpCompress } = require('./routes/httpCompress');
const { text } = require('./constants/text');
const { methods } = require('./constants/methods');

function createServer() {
  return http.createServer(async (req, res) => {
    const method = req.method;
    const normalizedText = new url.URL(req.url, `http://${req.headers.host}`)
      .pathname;

    if (normalizedText === text.root) {
      await httpGetMainPage(res);

      return;
    }

    const verifiedPath = httpVerifyRequest(res, normalizedText, method);

    if (!verifiedPath) {
      return;
    }

    if (method === methods.post && normalizedText === text.compress) {
      await httpCompress(req, res);
    }
  });
}

module.exports = {
  createServer,
};
