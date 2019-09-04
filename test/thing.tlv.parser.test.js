'use strict';

const mock = require('egg-mock');
const assert = require('assert');
const chance = new require('chance')();

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

  describe('instance mounting', () => {
    it('should attach thing object to app', () => {
      assert.ok(!!app.thing, 'thing实例挂载失败');
    });

    it('should attach tlv object to pp.thing', () => {
      assert.ok(!!app.thing.tlv, 'tlv实例挂载失败');
    });

    it('should attach transfer object to app.thing.tlv', () => {
      assert.ok(typeof app.thing.tlv.transfer === 'object', 'transfer实例挂载失败');
    });

    it('should attach parser object to app.thing.tlv', () => {
      assert.ok(!!app.thing.tlv.parser, 'parser实例挂载失败');
    });
  });

  describe('thing/tlv/parser', () => {
    it('boolean tlv binary should be processed successfully', () => {
      const MOCK_BOOLEAN = chance.bool();
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method
      const MOCK_FUNCTION = parseInt('0011000000000001', 2); // dataType: boolean, message_type: property, resourceId: 1
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_BOOLEAN_VALUE = MOCK_BOOLEAN ? Buffer.from([ 0x01 ]) : Buffer.from([ 0x00 ]);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + 2 * MOCK_TLV_FUNCTION.length + 2 * MOCK_TLV_BOOLEAN_VALUE.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_BOOLEAN_VALUE, MOCK_TLV_FUNCTION, MOCK_TLV_BOOLEAN_VALUE ], BUFFER_LENGTH);

      const CRC_TOKEN = Buffer.allocUnsafe(2);
      const crcCode = app.thing.crc.getCrc16(MOCK_TLV_BINARY);
      CRC_TOKEN.writeUInt16BE(crcCode);
      const parsedValue = app.thing.tlv.parser.parse(Buffer.concat([ MOCK_TLV_BINARY, CRC_TOKEN ], BUFFER_LENGTH + 2));
      assert.ok(!!parsedValue, '布尔值物模型实例处理失败');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert(!!parsedValue.time, '需包含时间参数time');
      assert(parsedValue.data.method === 'notify', 'method需为"notify"');
      assert.ok(typeof parsedValue.data.params === 'object', 'params需为对象');
      assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION] === 'object', 'property需包含index为1的对象');
      assert(parsedValue.data.params[MOCK_FUNCTION].resource === 'common', 'resource需为"common"');
      assert(parsedValue.data.params[MOCK_FUNCTION].type === 'boolean', 'type需为"boolean"');
      assert(parsedValue.data.params[MOCK_FUNCTION].message === 'property', 'type需为"property"');
      assert.ok(parsedValue.data.params[MOCK_FUNCTION].value === MOCK_BOOLEAN, 'value需为true');
    });

    it('enum tlv binary should be processed successfully', () => {
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_ENUM = chance.integer({
        min: 0,
        max: 255,
      });
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
      const MOCK_FUNCTION = parseInt('0101000000000011', 2); // dataType: enum, message_type: property, resourceId: 3
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_ENUM_VALUE = Buffer.allocUnsafe(1);
      MOCK_TLV_ENUM_VALUE.writeUInt8(MOCK_ENUM);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_TLV_ENUM_VALUE.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_ENUM_VALUE ], BUFFER_LENGTH);

      const CRC_TOKEN = Buffer.allocUnsafe(2);
      const crcCode = app.thing.crc.getCrc16(MOCK_TLV_BINARY);
      CRC_TOKEN.writeUInt16BE(crcCode);
      const parsedValue = app.thing.tlv.parser.parse(Buffer.concat([ MOCK_TLV_BINARY, CRC_TOKEN ], BUFFER_LENGTH + 2));
      assert.ok(!!parsedValue, '枚举值物模型实例处理失败');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert(!!parsedValue.time, '需包含时间参数time');
      assert.ok(typeof parsedValue.data.params === 'object', 'params需为对象');
      assert(parsedValue.data.method === 'notify', 'method需为"notify"');
      assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION] === 'object', 'property需包含index为1的对象');
      assert(parsedValue.data.params[MOCK_FUNCTION].resource === 'common', 'resource需为"common"');
      assert(parsedValue.data.params[MOCK_FUNCTION].type === 'enum', 'type需为"boolean"');
      assert(parsedValue.data.params[MOCK_FUNCTION].message === 'property', 'type需为"property"');
      assert.ok(parsedValue.data.params[MOCK_FUNCTION].value === MOCK_ENUM, 'value需为true');
    });

    it('integer tlv binary should be processed successfully', () => {
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_INTEGER = chance.integer({
        min: -65536,
        max: 65535,
      });
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
      const MOCK_FUNCTION = parseInt('0111000000001111', 2); // dataType: integer, message_type: property, resourceId: 15
      const MOCK_TLV_FUNCTION = Buffer.alloc(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_INTEGER_VALUE = Buffer.alloc(4);
      MOCK_TLV_INTEGER_VALUE.writeInt32BE(MOCK_INTEGER);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_TLV_INTEGER_VALUE.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_INTEGER_VALUE ], BUFFER_LENGTH);

      const CRC_TOKEN = Buffer.allocUnsafe(2);
      const crcCode = app.thing.crc.getCrc16(MOCK_TLV_BINARY);
      CRC_TOKEN.writeUInt16BE(crcCode);
      const parsedValue = app.thing.tlv.parser.parse(Buffer.concat([ MOCK_TLV_BINARY, CRC_TOKEN ], BUFFER_LENGTH + 2));
      assert.ok(!!parsedValue, '整数值物模型实例处理失败');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert(!!parsedValue.time, '需包含时间参数time');
      assert(parsedValue.data.method === 'notify', 'method需为"notify"');
      assert.ok(typeof parsedValue.data.params === 'object', 'params需为对象');
      assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION] === 'object', 'property需包含index为1的对象');
      assert(parsedValue.data.params[MOCK_FUNCTION].resource === 'common', 'resource需为"common"');
      assert(parsedValue.data.params[MOCK_FUNCTION].type === 'integer', 'type需为"boolean"');
      assert(parsedValue.data.params[MOCK_FUNCTION].message === 'property', 'type需为"property"');
      assert.ok(parsedValue.data.params[MOCK_FUNCTION].value === MOCK_INTEGER, 'value需为true');
    });

    it('float tlv binary should be processed successfully', () => {
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_FLOAT = chance.floating({
        min: -65535,
        max: 65536,
      });
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
      const MOCK_FUNCTION = parseInt('1001000000011111', 2); // dataType: float, message_type: property, resourceId: 31
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_FLOAT_VALUE = Buffer.allocUnsafe(4);
      MOCK_TLV_FLOAT_VALUE.writeFloatBE(MOCK_FLOAT);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_TLV_FLOAT_VALUE.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_FLOAT_VALUE ], BUFFER_LENGTH);

      const CRC_TOKEN = Buffer.allocUnsafe(2);
      const crcCode = app.thing.crc.getCrc16(MOCK_TLV_BINARY);
      CRC_TOKEN.writeUInt16BE(crcCode);
      const parsedValue = app.thing.tlv.parser.parse(Buffer.concat([ MOCK_TLV_BINARY, CRC_TOKEN ], BUFFER_LENGTH + 2));
      assert.ok(!!parsedValue, '整数值物模型实例处理失败');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert(!!parsedValue.time, '需包含时间参数time');
      assert(parsedValue.data.method === 'notify', 'method需为"notify"');
      assert.ok(typeof parsedValue.data.params === 'object', 'params需为对象');
      assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION] === 'object', 'property需包含index为1的对象');
      assert(parsedValue.data.params[MOCK_FUNCTION].resource === 'common', 'resource需为"common"');
      assert(parsedValue.data.params[MOCK_FUNCTION].type === 'float', 'type需为"float"');
      assert(parsedValue.data.params[MOCK_FUNCTION].message === 'property', 'type需为"property"');
      assert.ok(parseInt(parsedValue.data.params[MOCK_FUNCTION].value) === parseInt(MOCK_FLOAT), 'value需为true');
    });

    it('exception tlv binary should be processed successfully', () => {
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_EXCEPTION = chance.integer({
        min: 1,
        max: 4294967295,
      });
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
      const MOCK_FUNCTION = parseInt('1101000000111111', 2); // dataType: exception, message_type: property, resourceId: 63
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_EXCEPTION_VALUE = Buffer.allocUnsafe(4);
      MOCK_TLV_EXCEPTION_VALUE.writeUInt32BE(MOCK_EXCEPTION);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_TLV_EXCEPTION_VALUE.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_EXCEPTION_VALUE ], BUFFER_LENGTH);

      const CRC_TOKEN = Buffer.allocUnsafe(2);
      const crcCode = app.thing.crc.getCrc16(MOCK_TLV_BINARY);
      CRC_TOKEN.writeUInt16BE(crcCode);
      const parsedValue = app.thing.tlv.parser.parse(Buffer.concat([ MOCK_TLV_BINARY, CRC_TOKEN ], BUFFER_LENGTH + 2));
      assert.ok(!!parsedValue, '整数值物模型实例处理失败');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert(!!parsedValue.time, '需包含时间参数time');
      assert(parsedValue.data.method === 'notify', 'method需为"notify"');
      assert.ok(typeof parsedValue.data.params === 'object', 'params需为对象');
      assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION] === 'object', 'property需包含index为63的对象');
      assert(parsedValue.data.params[MOCK_FUNCTION].resource === 'common', 'resource需为"common"');
      assert(parsedValue.data.params[MOCK_FUNCTION].type === 'exception', 'type需为"float"');
      assert(parsedValue.data.params[MOCK_FUNCTION].message === 'property', 'type需为"property"');
      assert.ok(parseInt(parsedValue.data.params[MOCK_FUNCTION].value, 2) === MOCK_EXCEPTION, 'value需为true');
    });

    describe('thing/tlv/parser/buffer', () => {
      it('buffer [common] tlv binary should be processed successfully', () => {
        const VERSION = Buffer.from([ 0x01 ]);
        const MOCK_BUFFER = chance.string({
          pool: '0123456789abcdef',
          length: 40,
        });
        const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
        const MOCK_FUNCTION = parseInt('1011000001111111', 2); // dataType: buffer, message_type: property, resourceId: 127
        const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
        const MOCK_TLV_BUFFER_VALUE = Buffer.from(MOCK_BUFFER);
        const BUFFER_VALUE_LENGTH = MOCK_TLV_BUFFER_VALUE.length;
        let MOCK_BUFFER_LENGTH = null;
        if (BUFFER_VALUE_LENGTH > 127) {
          MOCK_BUFFER_LENGTH = Buffer.allocUnsafe(2);
          MOCK_BUFFER_LENGTH.writeUInt16BE(BUFFER_VALUE_LENGTH | 128); // eslint-disable-line
        } else {
          MOCK_BUFFER_LENGTH = Buffer.allocUnsafe(1);
          MOCK_BUFFER_LENGTH.writeUInt8(BUFFER_VALUE_LENGTH);
        }
        const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_BUFFER_LENGTH.length + BUFFER_VALUE_LENGTH;
        const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_BUFFER_LENGTH, MOCK_TLV_BUFFER_VALUE ], BUFFER_LENGTH);

        const CRC_TOKEN = Buffer.allocUnsafe(2);
        const crcCode = app.thing.crc.getCrc16(MOCK_TLV_BINARY);
        CRC_TOKEN.writeUInt16BE(crcCode);
        const parsedValue = app.thing.tlv.parser.parse(Buffer.concat([ MOCK_TLV_BINARY, CRC_TOKEN ], BUFFER_LENGTH + 2));
        assert.ok(!!parsedValue, '整数值物模型实例处理失败');
        assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
        assert(parsedValue.data.method === 'notify', 'method需为"notify"');
        assert(!!parsedValue.time, '需包含时间参数time');
        assert.ok(typeof parsedValue.data.params === 'object', 'params需为对象');
        assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION] === 'object', 'property需包含index为63的对象');
        assert(parsedValue.data.params[MOCK_FUNCTION].resource === 'common', 'resource需为"common"');
        assert(parsedValue.data.params[MOCK_FUNCTION].type === 'buffer', 'type需为"buffer"');
        assert.ok(parsedValue.data.params[MOCK_FUNCTION].value === MOCK_TLV_BUFFER_VALUE.toString('hex'), 'value需为true');
      });

      it('buffer [combine] tlv binary should be processed successfully', () => {
        const VERSION = Buffer.from([ 0x01 ]);
        const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify

        // 外层功能点
        const MOCK_FUNCTION = parseInt('1011011011111111', 2); // dataType: buffer, message_type: property, resourceId: 1791
        const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function

        // 声明外层功能点长度
        let MOCK_BUFFER_LENGTH = null;

        // 内层功能点1
        const MOCK_INNER_FUNCTION = parseInt('0011000000000010', 2); // dataType: boolean, message_type: property, resourceId: 2
        const MOCK_INNER_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_INNER_TLV_FUNCTION.writeUInt16BE(MOCK_INNER_FUNCTION); // function

        // 内层功能点1值
        const MOCK_INNER_BOOLEAN_VALUE = Buffer.from([ 0x00 ]); // false
        const MOCK_INNER_BUFFER = Buffer.concat([ MOCK_INNER_TLV_FUNCTION, MOCK_INNER_BOOLEAN_VALUE ], 3);

        // 外层功能点值
        const MOCK_TLV_BUFFER_VALUE = MOCK_INNER_BUFFER;
        const BUFFER_VALUE_LENGTH = MOCK_TLV_BUFFER_VALUE.length;
        if (BUFFER_VALUE_LENGTH > 127) {
          MOCK_BUFFER_LENGTH = Buffer.allocUnsafe(2);
          MOCK_BUFFER_LENGTH.writeUInt16BE(BUFFER_VALUE_LENGTH | 128); // eslint-disable-line
        } else {
          MOCK_BUFFER_LENGTH = Buffer.allocUnsafe(1);
          MOCK_BUFFER_LENGTH.writeUInt8(BUFFER_VALUE_LENGTH);
        }
        const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_BUFFER_LENGTH.length + BUFFER_VALUE_LENGTH;
        const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_BUFFER_LENGTH, MOCK_TLV_BUFFER_VALUE ], BUFFER_LENGTH);

        const CRC_TOKEN = Buffer.allocUnsafe(2);
        const crcCode = app.thing.crc.getCrc16(MOCK_TLV_BINARY);
        CRC_TOKEN.writeUInt16BE(crcCode);
        const parsedValue = app.thing.tlv.parser.parse(Buffer.concat([ MOCK_TLV_BINARY, CRC_TOKEN ], BUFFER_LENGTH + 2));
        assert.ok(!!parsedValue, '整数值物模型实例处理失败');
        assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
        assert(parsedValue.data.method === 'notify', 'method需为"notify"');
        assert(!!parsedValue.time, '需包含时间参数time');
        assert.ok(typeof parsedValue.data.params === 'object', 'params需为对象');
        assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION] === 'object', 'property需包含index为63的对象');
        assert(parsedValue.data.params[MOCK_FUNCTION].resource === 'combine', 'resource需为"common"');
        assert(parsedValue.data.params[MOCK_FUNCTION].type === 'buffer', 'type需为"buffer"');
        assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION].value === 'object', 'value需为object');
      });
    });

    describe('thing/tlv/parser/string', () => {
      it('string [common] tlv binary should be processed successfully', () => {
        const VERSION = Buffer.from([ 0x01 ]);
        const MOCK_STRING = chance.string();
        const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
        const MOCK_FUNCTION = parseInt('1111000011111111', 2); // dataType: string, message_type: property, resourceId: 255
        const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
        const MOCK_TLV_EXCEPTION_VALUE = Buffer.from(MOCK_STRING);
        const STRING_VALUE_LENGTH = MOCK_TLV_EXCEPTION_VALUE.length;
        let MOCK_STRING_LENGTH = null;
        if (STRING_VALUE_LENGTH > 127) {
          MOCK_STRING_LENGTH = Buffer.allocUnsafe(2);
          MOCK_STRING_LENGTH.writeUInt16BE(STRING_VALUE_LENGTH | 128); // eslint-disable-line
        } else {
          MOCK_STRING_LENGTH = Buffer.allocUnsafe(1);
          MOCK_STRING_LENGTH.writeUInt8(STRING_VALUE_LENGTH);
        }
        const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + STRING_VALUE_LENGTH + MOCK_STRING_LENGTH.length;
        const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_STRING_LENGTH, MOCK_TLV_EXCEPTION_VALUE ], BUFFER_LENGTH);
        const CRC_TOKEN = Buffer.allocUnsafe(2);
        const crcCode = app.thing.crc.getCrc16(MOCK_TLV_BINARY);
        CRC_TOKEN.writeUInt16BE(crcCode);
        const parsedValue = app.thing.tlv.parser.parse(Buffer.concat([ MOCK_TLV_BINARY, CRC_TOKEN ], BUFFER_LENGTH + 2));

        assert.ok(!!parsedValue, '整数值物模型实例处理失败');
        assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
        assert(!!parsedValue.time, '需包含时间参数time');
        assert(parsedValue.data.method === 'notify', 'method需为"notify"');
        assert.ok(typeof parsedValue.data.params === 'object', 'params需为对象');
        assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION] === 'object', 'property需包含index为63的对象');
        assert(parsedValue.data.params[MOCK_FUNCTION].resource === 'common', 'resource需为"common"');
        assert(parsedValue.data.params[MOCK_FUNCTION].type === 'string', 'type需为"string"');
        assert.ok(parsedValue.data.params[MOCK_FUNCTION].value === MOCK_STRING, 'value需为true');
      });

      it('string [json] tlv binary should be processed successfully', () => {
        const VERSION = Buffer.from([ 0x01 ]);
        const MOCK_JSON = {
          name: chance.name(),
          age: chance.age(),
          gender: chance.gender(),
        };
        const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
        const MOCK_FUNCTION = parseInt('1111111111111111', 2); // dataType: string, message_type: static, resourceId: 2047
        const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
        const MOCK_TLV_STRING_VALUE = Buffer.from(JSON.stringify(MOCK_JSON));
        const STRING_VALUE_LENGTH = MOCK_TLV_STRING_VALUE.length;
        let MOCK_STRING_LENGTH = null;
        if (STRING_VALUE_LENGTH > 127) {
          MOCK_STRING_LENGTH = Buffer.allocUnsafe(2);
          MOCK_STRING_LENGTH.writeUInt16BE(STRING_VALUE_LENGTH | 128); // eslint-disable-line
        } else {
          MOCK_STRING_LENGTH = Buffer.allocUnsafe(1);
          MOCK_STRING_LENGTH.writeUInt8(STRING_VALUE_LENGTH);
        }
        const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + STRING_VALUE_LENGTH + MOCK_STRING_LENGTH.length;
        const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_STRING_LENGTH, MOCK_TLV_STRING_VALUE ], BUFFER_LENGTH);

        const CRC_TOKEN = Buffer.allocUnsafe(2);
        const crcCode = app.thing.crc.getCrc16(MOCK_TLV_BINARY);
        CRC_TOKEN.writeUInt16BE(crcCode);
        const parsedValue = app.thing.tlv.parser.parse(Buffer.concat([ MOCK_TLV_BINARY, CRC_TOKEN ], BUFFER_LENGTH + 2));
        assert.ok(!!parsedValue, '整数值物模型实例处理失败');
        assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
        assert(parsedValue.data.method === 'notify', 'method需为"notify"');
        assert(!!parsedValue.time, '需包含时间参数time');
        assert.ok(typeof parsedValue.data.params === 'object', 'params需为对象');
        assert.ok(typeof parsedValue.data.params[MOCK_FUNCTION] === 'object', 'property需包含index为63的对象');
        assert(parsedValue.data.params[MOCK_FUNCTION].resource === 'static', 'resource需为"common"');
        assert(parsedValue.data.params[MOCK_FUNCTION].type === 'string', 'type需为"string"');
        assert.deepStrictEqual(JSON.parse(parsedValue.data.params[MOCK_FUNCTION].value), MOCK_JSON, 'value需为true');
      });
    });
  });
});
