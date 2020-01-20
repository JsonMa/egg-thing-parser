'use strict';

const mock = require('egg-mock');
const assert = require('assert');
const Utils = require('./lib/utils');

describe('test/thing/tlv/parser.test.js', () => {
  let app;
  const utils = new Utils(app);
  before(() => {
    app = mock.app({
      baseDir: 'apps/thing-parser-test',
    });
    return app.ready();
  });

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

    it('should catch error parser msg', () => {
      const illegalBuffer = Buffer.from([ 0x81, 0x00, 0x01, 0x02 ]);
      let error = null;
      try {
        app.thing.tlv.parser.parse(illegalBuffer);
      } catch (err) {
        error = err;
      }
      assert.deepStrictEqual(error.status, 401, '错误码有误');
    });

    it('boolean notify request tlv', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'resource',
        method: 'notify',
      };
      const functionId = utils.generateFunctionId('boolean', 'property', utils.getRandomResourceId());
      const payload = app.thing.tlv.packager.package({
        version,
        ...(id ? {
          id,
        } :
          null),
        operations,
        code: 0,
        data: {
          params: [{
            functionId,
            valueType: 'boolean',
            value: false,
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        data: {
          params,
        },
        time,
        code,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert(code === null, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
      assert.deepEqual(params[functionId].value, false, '功能点值解析失败');
    });

    it('boolean notify request with static tlv', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'resource',
        method: 'notify',
      };
      const functionId = utils.generateFunctionId('boolean', 'property', utils.getRandomResourceId());
      const staticFunctionId = utils.generateFunctionId('boolean', 'property', 0x70f);
      const payload = app.thing.tlv.packager.package({
        version,
        ...(id ? {
          id,
        } :
          null),
        operations,
        code: 0,
        data: {
          params: [{
            functionId,
            valueType: 'boolean',
            value: false,
          }, {
            functionId: staticFunctionId,
            valueType: 'boolean',
            value: true,
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        data: {
          params,
        },
        time,
        code,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert(code === null, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
      assert.deepEqual(params[functionId].value, false, '功能点值解析失败');
      assert.deepEqual(params[staticFunctionId].value, true, '功能点值解析失败');
    });

    it('enum notify request tlv', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'resource',
        method: 'notify',
      };
      const functionId = utils.generateFunctionId('enum', 'property', utils.getRandomResourceId());
      const payload = app.thing.tlv.packager.package({
        version,
        ...(id ? {
          id,
        } :
          null),
        operations,
        code: 0,
        data: {
          params: [{
            functionId,
            valueType: 'enum',
            value: 5,
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        data: {
          params,
        },
        time,
        code,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert(code === null, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
      assert.deepEqual(params[functionId].value, 5, '功能点值解析失败');
    });

    it('integer notify request tlv', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'resource',
        method: 'notify',
      };
      const functionId = utils.generateFunctionId('integer', 'property', utils.getRandomResourceId());
      const payload = app.thing.tlv.packager.package({
        version,
        ...(id ? {
          id,
        } :
          null),
        operations,
        code: 0,
        data: {
          params: [{
            functionId,
            valueType: 'integer',
            value: 0xffff,
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        data: {
          params,
        },
        time,
        code,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert(code === null, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
      assert.deepEqual(params[functionId].value, 0xffff, '功能点值解析失败');
    });

    it('float notify request tlv', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'resource',
        method: 'notify',
      };
      const functionId = utils.generateFunctionId('float', 'property', utils.getRandomResourceId());
      const payload = app.thing.tlv.packager.package({
        version,
        ...(id ? {
          id,
        } :
          null),
        operations,
        code: 0,
        data: {
          params: [{
            functionId,
            valueType: 'float',
            value: 234.56,
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        data: {
          params,
        },
        time,
        code,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert(code === null, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
      assert.deepEqual(params[functionId].value.toFixed(2), '234.56', '功能点值解析失败');
    });

    it('exception notify request tlv', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'resource',
        method: 'notify',
      };
      const functionId = utils.generateFunctionId('exception', 'property', utils.getRandomResourceId());
      const payload = app.thing.tlv.packager.package({
        version,
        ...(id ? {
          id,
        } :
          null),
        operations,
        code: 0,
        data: {
          params: [{
            functionId,
            valueType: 'exception',
            value: 5,
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        data: {
          params,
        },
        time,
        code,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert(code === null, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
      assert.deepEqual(params[functionId].value, '0,2', '功能点值解析失败');
    });

    it('small buffer notify request tlv', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'resource',
        method: 'notify',
      };
      const functionId = utils.generateFunctionId('buffer', 'property', utils.getRandomResourceId());
      const smallBuffer = utils.getFixedLengthBuffer(200);
      const payload = app.thing.tlv.packager.package({
        version,
        ...(id ? {
          id,
        } :
          null),
        operations,
        code: 0,
        data: {
          params: [{
            functionId,
            valueType: 'buffer',
            value: smallBuffer,
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        data: {
          params,
        },
        time,
        code,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert(code === null, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
      assert.deepEqual(params[functionId].value, smallBuffer.toString('hex'), '功能点值解析失败');
    });

    it('middle buffer notify request tlv', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'resource',
        method: 'notify',
      };
      const functionId = utils.generateFunctionId('buffer', 'property', utils.getRandomResourceId());
      const middleBuffer = utils.getFixedLengthBuffer(40000);
      const payload = app.thing.tlv.packager.package({
        version,
        ...(id ? {
          id,
        } :
          null),
        operations,
        code: 0,
        data: {
          params: [{
            functionId,
            valueType: 'buffer',
            value: middleBuffer,
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        data: {
          params,
        },
        time,
        code,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert(code === null, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
      assert.deepEqual(params[functionId].value, middleBuffer.toString('hex'), '功能点值解析失败');
    });

    describe('thing/tlv/parser/string', () => {
      it('string notify request tlv', () => {
        const version = utils.getRandomVersion(); // 版本号
        const id = utils.getRandomMsgId(); // 消息id
        const operations = {
          operation: 'request',
          type: 'device',
          target: 'resource',
          method: 'notify',
        };
        const functionId = utils.generateFunctionId('string', 'property', utils.getRandomResourceId());
        const payload = app.thing.tlv.packager.package({
          version,
          ...(id ? {
            id,
          } :
            null),
          operations,
          code: 0,
          data: {
            params: [{
              functionId,
              valueType: 'string',
              value: 'string-test',
            }],
          },
        });
        const {
          version: parsedVersion,
          operations: parsedOperations,
          data: {
            params,
          },
          time,
          code,
        } = app.thing.tlv.parser.parse(payload);
        assert(parsedVersion === version, '版本号错误');
        assert(time && typeof time === 'number', '需包含时间戳');
        assert(code === null, '响应码错误');
        assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
        delete parsedOperations.code;
        assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
        assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
        assert.deepEqual(params[functionId].value, 'string-test', '功能点值解析失败');
      });

      it('json string notify request tlv', () => {
        const version = utils.getRandomVersion(); // 版本号
        const id = utils.getRandomMsgId(); // 消息id
        const operations = {
          operation: 'request',
          type: 'device',
          target: 'resource',
          method: 'notify',
        };
        const functionId = utils.generateFunctionId('string', 'event', utils.getRandomResourceId());
        const payload = app.thing.tlv.packager.package({
          version,
          ...(id ? {
            id,
          } :
            null),
          operations,
          code: 0,
          data: {
            params: [{
              functionId,
              valueType: 'string',
              value: JSON.stringify({
                event: 'event-test',
              }),
            }],
          },
        });
        const {
          version: parsedVersion,
          operations: parsedOperations,
          data: {
            params,
          },
          time,
          code,
        } = app.thing.tlv.parser.parse(payload);
        assert(parsedVersion === version, '版本号错误');
        assert(time && typeof time === 'number', '需包含时间戳');
        assert(code === null, '响应码错误');
        assert.deepStrictEqual(parsedOperations.code, 0x03, '操作码错误');
        delete parsedOperations.code;
        assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
        assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点ID解析失败');
        assert.deepEqual(params[functionId].value, {
          event: 'event-test',
        }, '功能点值解析失败');
      });
    });
  });
});
