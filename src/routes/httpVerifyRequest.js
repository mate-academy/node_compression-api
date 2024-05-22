const { methods } = require('../constants/methods');
const { response } = require('../constants/response');
const { text } = require('../constants/text');

function httpVerifyRequest(res, normalizedPath, method) {
  let result = true;

  res.setHeader('Content-Type', 'text/plain');

  if (normalizedPath !== '/compress') {
    res.statusCode = response[404].statusCode;

    res.end(response[404].messages.notFound);

    result = false;
  }

  if (method !== methods.post && normalizedPath === text.compress) {
    res.statusCode = response[400].statusCode;

    res.end(response[400].messages.notFound);

    result = false;
  }

  return result;
}

module.exports = { httpVerifyRequest };
