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

  after(() => app.close());
  afterEach(mock.restore);

  describe('thing/tlv/subDevice/parser', () => {
    it('register payload', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'subDevice',
        target: 'system',
        method: 'register',
      };
      const pidFunctionId = utils.generateFunctionId('string', 'custom', 1);
      const snFunctionId = utils.generateFunctionId('string', 'custom', 2);
      const registerCodeFunctionId = utils.generateFunctionId('string', 'custom', 3);
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        data: {
          params: [{
            functionId: pidFunctionId,
            valueType: 'string',
            value: '39068',
          }, {
            functionId: snFunctionId,
            valueType: 'string',
            value: '39068_register_test',
          }, {
            functionId: registerCodeFunctionId,
            valueType: 'string',
            value: '39068_register_code_test',
          }, {
            functionId: pidFunctionId,
            valueType: 'string',
            value: '39069',
          }, {
            functionId: snFunctionId,
            valueType: 'string',
            value: '39069_register_test',
          }, {
            functionId: registerCodeFunctionId,
            valueType: 'string',
            value: '39069_register_code_test',
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
      assert.deepStrictEqual(parsedOperations.code, 0x62, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert(params.length === 2, '参数错误');
      assert.deepStrictEqual(params[0][pidFunctionId], '39068', '参数错误');
      assert.deepStrictEqual(params[0][snFunctionId], '39068_register_test', '参数错误');
      assert.deepStrictEqual(params[0][registerCodeFunctionId], '39068_register_code_test', '参数错误');
      assert.deepStrictEqual(params[1][pidFunctionId], '39069', '参数错误');
      assert.deepStrictEqual(params[1][snFunctionId], '39069_register_test', '参数错误');
      assert.deepStrictEqual(params[1][registerCodeFunctionId], '39069_register_code_test', '参数错误');
    });

    it('online payload', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'subDevice',
        target: 'system',
        method: 'online',
      };
      const pidFunctionId = utils.generateFunctionId('string', 'custom', 1);
      const snFunctionId = utils.generateFunctionId('string', 'custom', 2);
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        data: {
          params: [{
            functionId: pidFunctionId,
            valueType: 'string',
            value: '39068',
          }, {
            functionId: snFunctionId,
            valueType: 'string',
            value: '39068_online_test',
          }, {
            functionId: pidFunctionId,
            valueType: 'string',
            value: '39069',
          }, {
            functionId: snFunctionId,
            valueType: 'string',
            value: '39069_online_test',
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
      assert.deepStrictEqual(parsedOperations.code, 0x7f, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert(params.length === 2, '参数错误');
      assert.deepStrictEqual(params[0][pidFunctionId], '39068', '参数错误');
      assert.deepStrictEqual(params[0][snFunctionId], '39068_online_test', '参数错误');
      assert.deepStrictEqual(params[1][pidFunctionId], '39069', '参数错误');
      assert.deepStrictEqual(params[1][snFunctionId], '39069_online_test', '参数错误');
    });

    it('notify payload', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'subDevice',
        target: 'resource',
        method: 'notify',
      };
      const pidFunctionId = utils.generateFunctionId('string', 'custom', 1);
      const snFunctionId = utils.generateFunctionId('string', 'custom', 2);
      const timeFunctionId = utils.generateFunctionId('string', 'custom', 3);
      const commonFunctionId1 = utils.generateFunctionId('integer', 'property', 4);
      const commonFunctionId2 = utils.generateFunctionId('string', 'property', 5);
      const commonFunctionId3 = utils.generateFunctionId('string', 'property', 6);
      const commonFunctionId4 = utils.generateFunctionId('integer', 'property', 7);
      const groupId = utils.generateFunctionId('buffer', 'property', utils.getRandomResourceId('combine'));
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        data: {
          params: [{
            functionId: pidFunctionId,
            valueType: 'string',
            value: '39068',
          }, {
            functionId: snFunctionId,
            valueType: 'string',
            value: '39068_register_test',
          }, {
            groupId,
            params: [{
              functionId: commonFunctionId1,
              valueType: 'integer',
              value: 39068,
            }],
          }, {
            functionId: timeFunctionId,
            valueType: 'string',
            value: Date.now().toString(),
          }, {
            functionId: commonFunctionId3,
            valueType: 'string',
            value: '39068-string-test',
          }, {
            functionId: pidFunctionId,
            valueType: 'string',
            value: '39069',
          }, {
            functionId: snFunctionId,
            valueType: 'string',
            value: '39069_register_test',
          }, {
            functionId: commonFunctionId2,
            valueType: 'string',
            value: '39069-string-test',
          }, {
            functionId: timeFunctionId,
            valueType: 'string',
            value: Date.now().toString(),
          }, {
            functionId: commonFunctionId4,
            valueType: 'integer',
            value: 39069,
          }, {
            functionId: timeFunctionId,
            valueType: 'string',
            value: Date.now().toString(),
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
      assert.deepStrictEqual(parsedOperations.code, 0x43, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert(params.length === 2, '参数错误');
      assert.deepStrictEqual(params[0][59393].value, '39068', '产品id错误');
      assert.deepStrictEqual(params[0][59394].value, '39068_register_test', '设备sn错误');
      assert.deepStrictEqual(params[0][commonFunctionId1].value, 39068, '参数值错误');
      assert(params[0][commonFunctionId1].time, '参数值时间戳错误');
      assert.deepStrictEqual(params[0][commonFunctionId3].value, '39068-string-test', '参数值错误');
      assert.deepStrictEqual(params[1][59393].value, '39069', '产品id错误');
      assert.deepStrictEqual(params[1][59394].value, '39069_register_test', '设备sn错误');
      assert.deepStrictEqual(params[1][commonFunctionId2].value, '39069-string-test', '参数值错误');
      assert(params[1][commonFunctionId2].time, '参数值时间戳错误');
      assert.deepStrictEqual(params[1][commonFunctionId4].value, 39069, '参数值错误');
      assert(params[1][commonFunctionId4].time, '参数值时间戳错误');
    });
  });
});
