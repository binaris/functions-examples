const fs = require('fs');

// Promisify file read
exports.read = (filename) => {
  return new Promise((resolve,reject) => {
    fs.readFile(filename, (error, data) => {
      if(error) {
        reject(error);
      }
      resolve(data);
    });
  });
};

// Promisify file write
exports.write = (filename, data) => {
  return new Promise((resolve,reject) => {
    fs.writeFile(filename, data, error => {
      if(error) {
        reject(error);
      }
      resolve();
    });
  });
};
