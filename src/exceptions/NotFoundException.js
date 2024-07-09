'use strict';

class NotFoundException extends Error {
  constructor(message, statusCode = 404) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = NotFoundException;
