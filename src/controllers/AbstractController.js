'use strict';

class AbstractController {
  constructor(request, response) {
    this.request = request;
    this.response = response;
  }
}

module.exports = AbstractController;
