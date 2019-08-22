'use strict';

const mock = require('egg-mock');
const assert = require('assert');

describe('test/thing/tlv/parser.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/thing-parser-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  describe('Instance Mounting', () => {
    it('should attach tlv object to application', () => {
      assert.ok(!!app.thing.crc, '物模型实例thing挂载失败');
    });
  });

  describe('crc verify', () => {
    it('getCrc16 should be successfully', () => {
      const code = app.thing.crc.getCrc16(Buffer.from('0103200100670000000000', 'hex'));
      assert.ok(code.toString(16) === 'caff', '物模型实例thing挂载失败');
    });
  });
});
