'use strict';

const mock = require('egg-mock');

describe('test/thing-parser.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/thing-parser-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should attach ', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, thingParser')
      .expect(200);
  });
});
