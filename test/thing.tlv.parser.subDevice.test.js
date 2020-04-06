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

    it('offline payload', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'subDevice',
        target: 'system',
        method: 'offline',
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
            value: '39068_offline_test',
          }, {
            functionId: pidFunctionId,
            valueType: 'string',
            value: '39069',
          }, {
            functionId: snFunctionId,
            valueType: 'string',
            value: '39069_offline_test',
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
      assert.deepStrictEqual(parsedOperations.code, 126, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert(params.length === 2, '参数错误');
      assert.deepStrictEqual(params[0][pidFunctionId], '39068', '参数错误');
      assert.deepStrictEqual(params[0][snFunctionId], '39068_offline_test', '参数错误');
      assert.deepStrictEqual(params[1][pidFunctionId], '39069', '参数错误');
      assert.deepStrictEqual(params[1][snFunctionId], '39069_offline_test', '参数错误');
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
      const commonFunctionId5 = utils.generateFunctionId('string', 'property', 8);
      const currentTimeStamp = Date.now().toString();
      const subDeviceGroupId = utils.generateFunctionId('buffer', 'property', utils.getRandomResourceId('combine'));
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
            subDeviceGroupId,
            subDeviceGroupParams: [{
              functionId: commonFunctionId1,
              valueType: 'integer',
              value: 39068,
            }, {
              functionId: commonFunctionId5,
              valueType: 'string',
              value: '39068_sub_string',
            }],
          }, {
            functionId: timeFunctionId,
            valueType: 'string',
            value: currentTimeStamp,
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
            value: currentTimeStamp,
          }, {
            functionId: commonFunctionId4,
            valueType: 'integer',
            value: 39069,
          }, {
            functionId: timeFunctionId,
            valueType: 'string',
            value: currentTimeStamp,
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
      assert.deepStrictEqual(params[0][subDeviceGroupId].value[commonFunctionId1].value, 39068, '参数值错误');
      assert.deepStrictEqual(params[0][subDeviceGroupId].value[commonFunctionId5].value, '39068_sub_string', '参数值错误');
      assert(params[0][commonFunctionId3].time, '缺少时间参数');
      assert.deepStrictEqual(params[0][commonFunctionId3].value, '39068-string-test', '参数值错误');
      assert.deepStrictEqual(params[1][59393].value, '39069', '产品id错误');
      assert.deepStrictEqual(params[1][59394].value, '39069_register_test', '设备sn错误');
      assert.deepStrictEqual(params[1][commonFunctionId2].value, '39069-string-test', '参数值错误');
      assert.deepStrictEqual(params[1][commonFunctionId2].time, currentTimeStamp, '参数值时间戳错误');
      assert.deepStrictEqual(params[1][commonFunctionId4].value, 39069, '参数值错误');
      assert.deepStrictEqual(params[1][commonFunctionId4].time, currentTimeStamp, '参数值时间戳错误');
    });

    it('write request payload', () => {
      const writeFunctionId = utils.generateFunctionId('boolean', 'property', 1);
      const pidFunctionId = utils.generateFunctionId('string', 'custom', 1);
      const snFunctionId = utils.generateFunctionId('string', 'custom', 2);
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'subDevice',
        target: 'resource',
        method: 'write',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        data: {
          params: [
            {
              functionId: pidFunctionId,
              valueType: 'string',
              value: '39098',
            },
            {
              functionId: snFunctionId,
              valueType: 'string',
              value: '39098_test_sn',
            }, {
              functionId: writeFunctionId,
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
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.code, 66, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepStrictEqual(params[0][pidFunctionId].functionId, pidFunctionId, '产品ID功能点错误');
      assert.deepStrictEqual(params[0][snFunctionId].functionId, snFunctionId, '设备SN功能点错误');
      assert.deepStrictEqual(params[0][writeFunctionId].value, false, '子设备功能值错误');
    });

    it('write group request payload', () => {
      const writeFunctionId = utils.generateFunctionId('boolean', 'property', 1);
      const subDeviceGroupId = utils.generateFunctionId('buffer', 'property', utils.getRandomResourceId('combine'));
      const pidFunctionId = utils.generateFunctionId('string', 'custom', 1);
      const snFunctionId = utils.generateFunctionId('string', 'custom', 2);
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'subDevice',
        target: 'resource',
        method: 'write',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        data: {
          params: [
            {
              functionId: pidFunctionId,
              valueType: 'string',
              value: '39098',
            },
            {
              functionId: snFunctionId,
              valueType: 'string',
              value: '39098_test_sn',
            }, {
              subDeviceGroupId,
              subDeviceGroupParams: [{
                functionId: writeFunctionId,
                valueType: 'boolean',
                value: false,
              }],
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
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.code, 66, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepStrictEqual(params[0][pidFunctionId].functionId, pidFunctionId, '产品ID功能点错误');
      assert.deepStrictEqual(params[0][snFunctionId].functionId, snFunctionId, '设备SN功能点错误');
      assert.deepStrictEqual(params[0][subDeviceGroupId].value[0].value, false, '子设备组合功能点子功能值错误');
    });

    it('write response payload', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const pidFunctionId = utils.generateFunctionId('string', 'custom', 1);
      const snFunctionId = utils.generateFunctionId('string', 'custom', 2);
      const operations = {
        operation: 'response',
        type: 'subDevice',
        target: 'resource',
        method: 'write',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        code: 0,
        data: {
          params: [
            {
              functionId: pidFunctionId,
              valueType: 'string',
              value: '39098',
            },
            {
              functionId: snFunctionId,
              valueType: 'string',
              value: '39098_test_sn',
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
      assert(code === 0, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 194, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepStrictEqual(params[0][pidFunctionId].functionId, pidFunctionId, '子设备产品ID错误');
      assert.deepStrictEqual(params[0][snFunctionId].functionId, snFunctionId, '子设备SN错误');
    });

    it('read request payload', () => {
      const pidFunctionId = utils.generateFunctionId('string', 'custom', 1);
      const snFunctionId = utils.generateFunctionId('string', 'custom', 2);
      const readFunctionId = utils.generateFunctionId('integer', 'custom', 3);
      const readFunctionValue = utils.generateFunctionId('string', 'property', 1);
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'subDevice',
        target: 'resource',
        method: 'read',
      };
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
            functionId: readFunctionValue,
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
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.code, 65, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepStrictEqual(params[0][pidFunctionId], '39068', '子设备产品ID错误');
      assert.deepStrictEqual(params[0][snFunctionId], '39068_register_test', '子设备SN错误');
      assert.deepStrictEqual(params[0][readFunctionValue], null, '子设备READ功能点错误');
    });

    it('read response payload', () => {
      const pidFunctionId = utils.generateFunctionId('string', 'custom', 1);
      const snFunctionId = utils.generateFunctionId('string', 'custom', 2);
      const readFunctionId = utils.generateFunctionId('integer', 'custom', 3);
      const readFunctionValue = utils.generateFunctionId('string', 'property', 1);
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'response',
        type: 'subDevice',
        target: 'resource',
        method: 'read',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        code: 0,
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
            functionId: readFunctionId,
            valueType: 'integer',
            value: readFunctionValue,
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        code,
        data: {
          params,
        },
        time,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.code, 193, '操作码错误');
      assert.deepStrictEqual(code, 0, '响应码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepStrictEqual(params[0][pidFunctionId].functionId, pidFunctionId, '子设备产品ID错误');
      assert.deepStrictEqual(params[0][snFunctionId].functionId, snFunctionId, '子设备SN错误');
      assert.deepStrictEqual(params[0][readFunctionId].functionId, readFunctionId, '子设备READ功能点错误');
      assert.deepStrictEqual(params[0][readFunctionId].value, readFunctionValue, '子设备READ功能点值错误');
    });

    it('read group response payload', () => {
      const pidFunctionId = utils.generateFunctionId('string', 'custom', 1);
      const snFunctionId = utils.generateFunctionId('string', 'custom', 2);
      const readFunctionId = utils.generateFunctionId('boolean', 'property', 1);
      const subDeviceGroupId = utils.generateFunctionId('buffer', 'property', utils.getRandomResourceId('combine'));
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'response',
        type: 'subDevice',
        target: 'resource',
        method: 'read',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        code: 0,
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
            subDeviceGroupId,
            subDeviceGroupParams: [{
              functionId: readFunctionId,
              valueType: 'boolean',
              value: true,
            }],
          }],
        },
      });
      const {
        version: parsedVersion,
        operations: parsedOperations,
        data: {
          params,
        },
        code,
        time,
      } = app.thing.tlv.parser.parse(payload);
      assert(parsedVersion === version, '版本号错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(code, 0, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 193, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepStrictEqual(params[0][subDeviceGroupId].functionId, subDeviceGroupId, '子设备产品组合功能点ID错误');
      assert.deepStrictEqual(params[0][subDeviceGroupId].value[0].functionId, readFunctionId, '子设备组合功能点子功能错误');
      assert.deepStrictEqual(params[0][subDeviceGroupId].value[0].value, true, '子设备组合功能点子功能值错误');
    });
  });
});
