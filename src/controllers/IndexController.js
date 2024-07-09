'use strict';

const fs = require('fs');
const AbstractController = require('./AbstractController');

class IndexController extends AbstractController {
  index() {
    fs.readFile(`./public/index.html`, (err, data) => {
      if (!err) {
        this.response.statusCode = 200;
        this.response.setHeader('Content-Type', 'text/html; charset=utf-8');
        this.response.end(data);

        return;
      }

      this.response.statusCode = 404;
      this.response.end('File not found');
    });
  }
}

module.exports = IndexController;
