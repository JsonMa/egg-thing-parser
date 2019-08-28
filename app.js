'use strict';

const path = require('path');

module.exports = app => {
  app.beforeStart(async () => {
    app.loader.loadToApp(path.join(__dirname, './lib'), 'thing', {
      initializer: File => {
        return new File(app);
      },
    });
    app.loader.loadToApp(path.join(__dirname, './app/schema'), 'schema');
  });
};
