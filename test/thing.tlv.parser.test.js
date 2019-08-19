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
      assert.ok(!!app.thing, '物模型实例thing挂载失败')
    });

    it('should attach tlv object to application', () => {
      assert.ok(!!app.thing.tlv, 'tlv实例挂载失败')
    });

    it('should attach tlv object to application', () => {
      assert.ok(typeof app.thing.tlv.transfer === 'object', 'transfer实例挂载失败')
    });

    it('should attach tlv object to application', () => {
      assert.ok(!!app.thing.tlv.parser, 'parser实例挂载失败')
    });
  })

  describe('thing/tlv/parser', () => {
    it('boolean tlv binaray should be processed successfully', () => {
      const MOCK_TLV_METHOD = Buffer.from([0x03]) // method
      const MOCK_FUNCTION = parseInt('0001000000000001', 2) // dataType: boolean, messageType: property, resourceId: 1
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeInt16BE(MOCK_FUNCTION) // function
      const MOCK_TLV_BOOLEAN_VALUE = Buffer.from([0x01])
      const MOCK_TLV_CRC = Buffer.from([0x01, 0x02])
      const BUFFER_LENGTH = MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_TLV_BOOLEAN_VALUE.length + MOCK_TLV_CRC.length
      const MOCK_TLV_BINARY = Buffer.concat([MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_BOOLEAN_VALUE, MOCK_TLV_CRC], BUFFER_LENGTH)

      const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY)
      assert.ok(!!parsedValue, '布尔值物模型实例处理失败')
      assert(parsedValue.method === 'notify', 'method需为"notify"')
      assert.ok(typeof parsedValue.params === 'object', 'params需为对象')
      assert.ok(typeof parsedValue.params.property[1] === 'object', 'property需包含index为1的对象')
      assert(parsedValue.params.property[1].resource === 'common', 'resource需为"common"')
      assert(parsedValue.params.property[1].type === 'boolean', 'type需为"boolean"')
      assert.ok(parsedValue.params.property[1].value, 'value需为true')
      assert.ok(!!parsedValue.params.property[1].time, '需包含时间参数time')
    });
  })
});
