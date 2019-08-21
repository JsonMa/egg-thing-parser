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

  describe('Instance Mounting', () => {
    it('should attach tlv object to application', () => {
      assert.ok(!!app.thing, '物模型实例thing挂载失败');
    });

    it('should attach tlv object to application', () => {
      assert.ok(!!app.thing.tlv, 'tlv实例挂载失败');
    });

    it('should attach tlv object to application', () => {
      assert.ok(typeof app.thing.tlv.transfer === 'object', 'transfer实例挂载失败');
    });

    it('should attach tlv object to application', () => {
      assert.ok(!!app.thing.tlv.parser, 'parser实例挂载失败');
    });
  });

  describe('thing/tlv/parser', () => {
    it('boolean tlv binary should be processed successfully', () => {
      const MOCK_BOOLEAN = chance.bool();
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method
      const MOCK_FUNCTION = parseInt('0011000000000001', 2); // dataType: boolean, messageType: property, resourceId: 1
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_BOOLEAN_VALUE = MOCK_BOOLEAN ? Buffer.from([ 0x01 ]) : Buffer.from([ 0x00 ]);
      const MOCK_TLV_CRC = Buffer.from([ 0x01, 0x02 ]);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + 2 * MOCK_TLV_FUNCTION.length + 2 * MOCK_TLV_BOOLEAN_VALUE.length + MOCK_TLV_CRC.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_BOOLEAN_VALUE, MOCK_TLV_FUNCTION, MOCK_TLV_BOOLEAN_VALUE, MOCK_TLV_CRC ], BUFFER_LENGTH);

      const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY);
      assert.ok(!!parsedValue, '布尔值物模型实例处理失败');
      assert(parsedValue.method === 'notify', 'method需为"notify"');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert.ok(typeof parsedValue.params === 'object', 'params需为对象');
      assert.ok(typeof parsedValue.params.property[1] === 'object', 'property需包含index为1的对象');
      assert(parsedValue.params.property[1].resource === 'common', 'resource需为"common"');
      assert(parsedValue.params.property[1].type === 'boolean', 'type需为"boolean"');
      assert.ok(parsedValue.params.property[1].value === MOCK_BOOLEAN, 'value需为true');
      assert.ok(!!parsedValue.params.property[1].time, '需包含时间参数time');
    });

    it('enum tlv binary should be processed successfully', () => {
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_ENUM = chance.integer({
        min: 0,
        max: 255,
      });
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
      const MOCK_FUNCTION = parseInt('0101000000000011', 2); // dataType: enum, messageType: property, resourceId: 3
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_ENUM_VALUE = Buffer.allocUnsafe(1);
      MOCK_TLV_ENUM_VALUE.writeUInt8(MOCK_ENUM);
      const MOCK_TLV_CRC = Buffer.from([ 0x01, 0x02 ]);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_TLV_ENUM_VALUE.length + MOCK_TLV_CRC.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_ENUM_VALUE, MOCK_TLV_CRC ], BUFFER_LENGTH);

      const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY);
      assert.ok(!!parsedValue, '枚举值物模型实例处理失败');
      assert(parsedValue.method === 'notify', 'method需为"notify"');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert.ok(typeof parsedValue.params === 'object', 'params需为对象');
      assert.ok(typeof parsedValue.params.property[3] === 'object', 'property需包含index为1的对象');
      assert(parsedValue.params.property[3].resource === 'common', 'resource需为"common"');
      assert(parsedValue.params.property[3].type === 'enum', 'type需为"boolean"');
      assert.ok(parsedValue.params.property[3].value === MOCK_ENUM, 'value需为true');
      assert.ok(!!parsedValue.params.property[3].time, '需包含时间参数time');
    });

    it('integer tlv binary should be processed successfully', () => {
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_INTEGER = chance.integer({
        min: -65535,
        max: 65536,
      });
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
      const MOCK_FUNCTION = parseInt('0111000000001111', 2); // dataType: integer, messageType: property, resourceId: 15
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_INTEGER_VALUE = Buffer.allocUnsafe(4);
      MOCK_TLV_INTEGER_VALUE.writeInt32BE(MOCK_INTEGER);
      const MOCK_TLV_CRC = Buffer.from([ 0x01, 0x02 ]);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_TLV_INTEGER_VALUE.length + MOCK_TLV_CRC.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_INTEGER_VALUE, MOCK_TLV_CRC ], BUFFER_LENGTH);

      const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY);
      assert.ok(!!parsedValue, '整数值物模型实例处理失败');
      assert(parsedValue.method === 'notify', 'method需为"notify"');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert.ok(typeof parsedValue.params === 'object', 'params需为对象');
      assert.ok(typeof parsedValue.params.property[15] === 'object', 'property需包含index为1的对象');
      assert(parsedValue.params.property[15].resource === 'common', 'resource需为"common"');
      assert(parsedValue.params.property[15].type === 'integer', 'type需为"boolean"');
      assert.ok(parsedValue.params.property[15].value === MOCK_INTEGER, 'value需为true');
      assert.ok(!!parsedValue.params.property[15].time, '需包含时间参数time');
    });

    it('float tlv binary should be processed successfully', () => {
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_FLOAT = chance.floating({
        min: -65535,
        max: 65536,
      });
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
      const MOCK_FUNCTION = parseInt('1001000000011111', 2); // dataType: float, messageType: property, resourceId: 31
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_FLOAT_VALUE = Buffer.allocUnsafe(4);
      MOCK_TLV_FLOAT_VALUE.writeFloatBE(MOCK_FLOAT);
      const MOCK_TLV_CRC = Buffer.from([ 0x01, 0x02 ]);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_TLV_FLOAT_VALUE.length + MOCK_TLV_CRC.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_FLOAT_VALUE, MOCK_TLV_CRC ], BUFFER_LENGTH);

      const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY);
      assert.ok(!!parsedValue, '整数值物模型实例处理失败');
      assert(parsedValue.method === 'notify', 'method需为"notify"');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert.ok(typeof parsedValue.params === 'object', 'params需为对象');
      assert.ok(typeof parsedValue.params.property[31] === 'object', 'property需包含index为1的对象');
      assert(parsedValue.params.property[31].resource === 'common', 'resource需为"common"');
      assert(parsedValue.params.property[31].type === 'float', 'type需为"float"');
      assert.ok(parseInt(parsedValue.params.property[31].value) === parseInt(MOCK_FLOAT), 'value需为true');
      assert.ok(!!parsedValue.params.property[31].time, '需包含时间参数time');
    });

    it('exception tlv binary should be processed successfully', () => {
      const VERSION = Buffer.from([ 0x01 ]);
      const MOCK_EXCEPTION = chance.integer({
        min: 0,
        max: 4294967295,
      });
      const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
      const MOCK_FUNCTION = parseInt('1101000000111111', 2); // dataType: exception, messageType: property, resourceId: 63
      const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
      MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
      const MOCK_TLV_EXCEPTION_VALUE = Buffer.allocUnsafe(4);
      MOCK_TLV_EXCEPTION_VALUE.writeUInt32BE(MOCK_EXCEPTION);
      const MOCK_TLV_CRC = Buffer.from([ 0x01, 0x02 ]);
      const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_TLV_EXCEPTION_VALUE.length + MOCK_TLV_CRC.length;
      const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_TLV_EXCEPTION_VALUE, MOCK_TLV_CRC ], BUFFER_LENGTH);

      const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY);
      assert.ok(!!parsedValue, '整数值物模型实例处理失败');
      assert(parsedValue.method === 'notify', 'method需为"notify"');
      assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
      assert.ok(typeof parsedValue.params === 'object', 'params需为对象');
      assert.ok(typeof parsedValue.params.property[63] === 'object', 'property需包含index为63的对象');
      assert(parsedValue.params.property[63].resource === 'common', 'resource需为"common"');
      assert(parsedValue.params.property[63].type === 'exception', 'type需为"float"');
      assert.ok(parseInt(parsedValue.params.property[63].value, 2) === MOCK_EXCEPTION, 'value需为true');
      assert.ok(!!parsedValue.params.property[63].time, '需包含时间参数time');
    });

    describe('thing/tlv/parser/buffer', () => {
      it('buffer [common] tlv binary should be processed successfully', () => {
        const VERSION = Buffer.from([ 0x01 ]);
        const MOCK_BUFFER = chance.string({
          pool: '0123456789abcdef',
          length: 40,
        });
        const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
        const MOCK_FUNCTION = parseInt('1011000001111111', 2); // dataType: buffer, messageType: property, resourceId: 127
        const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
        const MOCK_TLV_BUFFER_VALUE = Buffer.from(MOCK_BUFFER);
        const MOCK_TLV_CRC = Buffer.from([ 0x01, 0x02 ]);
        const BUFFER_VALUE_LENGTH = MOCK_TLV_BUFFER_VALUE.length;
        const MOCK_BUFFER_LENGTH = Buffer.allocUnsafe(2);
        MOCK_BUFFER_LENGTH.writeUInt16BE(BUFFER_VALUE_LENGTH);
        const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_BUFFER_LENGTH.length + BUFFER_VALUE_LENGTH + MOCK_TLV_CRC.length;
        const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_BUFFER_LENGTH, MOCK_TLV_BUFFER_VALUE, MOCK_TLV_CRC ], BUFFER_LENGTH);

        const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY);
        assert.ok(!!parsedValue, '整数值物模型实例处理失败');
        assert(parsedValue.method === 'notify', 'method需为"notify"');
        assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
        assert.ok(typeof parsedValue.params === 'object', 'params需为对象');
        assert.ok(typeof parsedValue.params.property[127] === 'object', 'property需包含index为63的对象');
        assert(parsedValue.params.property[127].resource === 'common', 'resource需为"common"');
        assert(parsedValue.params.property[127].type === 'buffer', 'type需为"buffer"');
        assert.ok(parsedValue.params.property[127].value === MOCK_TLV_BUFFER_VALUE.toString('hex'), 'value需为true');
        assert.ok(!!parsedValue.params.property[127].time, '需包含时间参数time');
      });

      it('buffer [combine] tlv binary should be processed successfully', () => {
        const VERSION = Buffer.from([ 0x01 ]);
        const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
        const MOCK_TLV_CRC = Buffer.from([ 0x01, 0x02 ]); // crc校验

        // 外层功能点
        const MOCK_FUNCTION = parseInt('1011011011111111', 2); // dataType: buffer, messageType: property, resourceId: 1791
        const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function

        // 声明外层功能点长度
        const MOCK_BUFFER_LENGTH = Buffer.allocUnsafe(2);

        // 内层功能点1
        const MOCK_INNER_FUNCTION = parseInt('0011000000000010', 2); // dataType: boolean, messageType: property, resourceId: 2
        const MOCK_INNER_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_INNER_TLV_FUNCTION.writeUInt16BE(MOCK_INNER_FUNCTION); // function

        // 内层功能点1值
        const MOCK_INNER_BOOLEAN_VALUE = Buffer.from([ 0x00 ]); // false
        const MOCK_INNER_BUFFER = Buffer.concat([ MOCK_INNER_TLV_FUNCTION, MOCK_INNER_BOOLEAN_VALUE ], 3);

        // 外层功能点值
        const MOCK_TLV_BUFFER_VALUE = MOCK_INNER_BUFFER;
        const BUFFER_VALUE_LENGTH = MOCK_TLV_BUFFER_VALUE.length;
        MOCK_BUFFER_LENGTH.writeUInt16BE(BUFFER_VALUE_LENGTH);

        const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + MOCK_BUFFER_LENGTH.length + BUFFER_VALUE_LENGTH + MOCK_TLV_CRC.length;
        const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_BUFFER_LENGTH, MOCK_TLV_BUFFER_VALUE, MOCK_TLV_CRC ], BUFFER_LENGTH);

        const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY);
        assert.ok(!!parsedValue, '整数值物模型实例处理失败');
        assert(parsedValue.method === 'notify', 'method需为"notify"');
        assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
        assert.ok(typeof parsedValue.params === 'object', 'params需为对象');
        assert.ok(typeof parsedValue.params.property[1791] === 'object', 'property需包含index为63的对象');
        assert(parsedValue.params.property[1791].resource === 'combine', 'resource需为"common"');
        assert(parsedValue.params.property[1791].type === 'buffer', 'type需为"buffer"');
        assert.ok(Array.isArray(parsedValue.params.property[1791].value), 'value需为true');
        assert.ok(!!parsedValue.params.property[1791].time, '需包含时间参数time');
      });
    });

    describe('thing/tlv/parser/string', () => {
      it('string [common] tlv binary should be processed successfully', () => {
        const VERSION = Buffer.from([ 0x01 ]);
        const MOCK_STRING = chance.string();
        const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
        const MOCK_FUNCTION = parseInt('1111000011111111', 2); // dataType: string, messageType: property, resourceId: 255
        const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
        const MOCK_TLV_EXCEPTION_VALUE = Buffer.from(MOCK_STRING);
        const MOCK_TLV_CRC = Buffer.from([ 0x01, 0x02 ]);
        const STRING_VALUE_LENGTH = MOCK_TLV_EXCEPTION_VALUE.length;
        const MOCK_STRING_LENGTH = Buffer.allocUnsafe(2);
        MOCK_STRING_LENGTH.writeUInt16BE(STRING_VALUE_LENGTH);
        const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + STRING_VALUE_LENGTH + MOCK_STRING_LENGTH.length + MOCK_TLV_CRC.length;
        const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_STRING_LENGTH, MOCK_TLV_EXCEPTION_VALUE, MOCK_TLV_CRC ], BUFFER_LENGTH);

        const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY);
        assert.ok(!!parsedValue, '整数值物模型实例处理失败');
        assert(parsedValue.method === 'notify', 'method需为"notify"');
        assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
        assert.ok(typeof parsedValue.params === 'object', 'params需为对象');
        assert.ok(typeof parsedValue.params.property[255] === 'object', 'property需包含index为63的对象');
        assert(parsedValue.params.property[255].resource === 'common', 'resource需为"common"');
        assert(parsedValue.params.property[255].type === 'string', 'type需为"string"');
        assert.ok(parsedValue.params.property[255].value === MOCK_STRING, 'value需为true');
        assert.ok(!!parsedValue.params.property[255].time, '需包含时间参数time');
      });

      it('string [json] tlv binary should be processed successfully', () => {
        const VERSION = Buffer.from([ 0x01 ]);
        const MOCK_JSON = {
          name: chance.name(),
          age: chance.age(),
          gender: chance.gender(),
        };
        const MOCK_TLV_METHOD = Buffer.from([ 0x03 ]); // method:notify
        const MOCK_FUNCTION = parseInt('1111111111111111', 2); // dataType: string, messageType: static, resourceId: 2047
        const MOCK_TLV_FUNCTION = Buffer.allocUnsafe(2);
        MOCK_TLV_FUNCTION.writeUInt16BE(MOCK_FUNCTION); // function
        const MOCK_TLV_EXCEPTION_VALUE = Buffer.from(JSON.stringify(MOCK_JSON));
        const MOCK_TLV_CRC = Buffer.from([ 0x01, 0x02 ]);
        const STRING_VALUE_LENGTH = MOCK_TLV_EXCEPTION_VALUE.length;
        const MOCK_STRING_LENGTH = Buffer.allocUnsafe(2);
        MOCK_STRING_LENGTH.writeUInt16BE(STRING_VALUE_LENGTH);
        const BUFFER_LENGTH = VERSION.length + MOCK_TLV_METHOD.length + MOCK_TLV_FUNCTION.length + STRING_VALUE_LENGTH + MOCK_STRING_LENGTH.length + MOCK_TLV_CRC.length;
        const MOCK_TLV_BINARY = Buffer.concat([ VERSION, MOCK_TLV_METHOD, MOCK_TLV_FUNCTION, MOCK_STRING_LENGTH, MOCK_TLV_EXCEPTION_VALUE, MOCK_TLV_CRC ], BUFFER_LENGTH);

        const parsedValue = app.thing.tlv.parser.parse(MOCK_TLV_BINARY);
        assert.ok(!!parsedValue, '整数值物模型实例处理失败');
        assert(parsedValue.method === 'notify', 'method需为"notify"');
        assert(parsedValue.version === '1.0.0', '版本号需为"1.0.0"');
        assert.ok(typeof parsedValue.params === 'object', 'params需为对象');
        assert.ok(typeof parsedValue.params.event[2047] === 'object', 'property需包含index为63的对象');
        assert(parsedValue.params.event[2047].resource === 'static', 'resource需为"common"');
        assert(parsedValue.params.event[2047].type === 'string', 'type需为"string"');
        assert.deepStrictEqual(JSON.parse(parsedValue.params.event[2047].value), MOCK_JSON, 'value需为true');
        assert.ok(!!parsedValue.params.event[2047].time, '需包含时间参数time');
      });
    });
  });
});
