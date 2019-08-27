'use strict';

const mock = require('egg-mock');
const assert = require('assert');

describe('test/thing/crc.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/thing-parser-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  describe('instance mounting', () => {
    it('should attach tlv object to application', () => {
      assert.ok(!!app.thing, '物模型实例thing挂载失败');
    });

    it('should attach crc object to application', () => {
      assert.ok(!!app.thing.crc, 'crc实例挂载失败');
    });
  });

  describe('crc ccitt false', () => {
    it('should get correct crc code', () => {
      const buffer = Buffer.from('0103d03fdfb7e0e8', 'hex');
      const crcCode = app.thing.crc.getCrc16(buffer);
      assert.deepEqual(crcCode.toString('16'), '8da');
    });
  });
});
