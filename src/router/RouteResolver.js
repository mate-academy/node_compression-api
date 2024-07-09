'use strict';

const NotFoundException = require('../exceptions/NotFoundException');
const { IndexController, CompressController } = require('../controllers');

class RouteResolver {
  constructor(request, response) {
    this.request = request;
    this.response = response;

    this.routes = [
      {
        path: ['/', '/index.html'],
        method: 'GET',
        controller: IndexController,
        code: 404,
      },
      {
        path: ['/compress'],
        method: 'POST',
        controller: CompressController,
        code: 400,
      },
    ];

    const protocol = this.request.socket.encrypted ? 'https' : 'http';
    const hostName = `${protocol}://${this.request.headers.host}${this.request.url}`;

    this.parsedUrl = new URL(hostName);
  }
  resolve() {
    for (const route of this.routes) {
      if (route.path.includes(this.parsedUrl.pathname)) {
        if (route.method !== this.request.method) {
          throw new NotFoundException('Wrong method', route.code);
        }

        const ControllerName = route.controller;

        return new ControllerName(this.request, this.response);
      }
    }

    throw new NotFoundException('Route Not Found');
  }
}

module.exports = RouteResolver;
