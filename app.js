'use strict';

const path = require('path');
const fileMountMap = [{
  path: './lib',
  keyword: 'thing',
}, {
  path: './app/schema',
  keyword: 'schema',
}];

module.exports = app => {
  app.beforeStart(async () => {
    fileMountMap.forEach(item => {
      app.loader.loadToApp(path.join(__dirname, item.path), item.keyword, {
        initializer: File => {
          return new File(app);
        },
      });
    });
  });
};
