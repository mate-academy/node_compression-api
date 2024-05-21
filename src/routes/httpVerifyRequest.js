function httpVerifyRequest(res, normalizedPath, method) {
  let result = true;

  res.setHeader('Content-Type', 'text/plain');

  if (normalizedPath !== '/compress') {
    res.statusCode = 404;

    res.end(`Page not found`);

    result = false;
  }

  if (method !== 'POST' && normalizedPath === '/compress') {
    res.statusCode = 400;

    res.end(`It should be POST request for "/compress"`);

    result = false;
  }

  return result;
}

module.exports = { httpVerifyRequest };
