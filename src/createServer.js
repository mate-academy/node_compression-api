'use strict';

const http = require('http');

const RouteResolver = require('./router/RouteResolver');
const NotFoundException = require('./exceptions/NotFoundException');

function createServer() {
  return http.createServer((req, res) => {
    try {
      const routeResolver = new RouteResolver(req, res);

      const controller = routeResolver.resolve();

      controller.index();
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.statusCode = error.statusCode;
        res.end(error.message);
      }
    }
  });
}

module.exports = {
  createServer,
};
