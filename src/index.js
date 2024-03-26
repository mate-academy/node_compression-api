/* eslint-disable no-console */
/* Don't change code below */

'use strict';

const { createServer } = require('./createServer');

console.log(createServer instanceof Function);

createServer().listen(5700, () => {
  console.log('Server started! 🚀');
  console.log('Available at http://localhost:5700');
});
