'use strict';

const mock = require('egg-mock');
const assert = require('assert');
const Utils = require('./lib/utils');
describe('test/thing/tlv/packager.test.js', () => {
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

  describe('instance mounting', () => {
    it('should attach packager object to app.thing.tlv', () => {
      assert.ok(!!app.thing.tlv.packager, 'packager实例挂载失败');
    });
  });

  describe('thing/tlv/packager/request', () => {
    it('assembel system request buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'system',
        method: 'reset',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
      }); // tlv数据封装
      assert.deepStrictEqual(payload.readUInt8(), parseInt(version) + 0x80, '版本号错误');
      assert.deepStrictEqual(payload.readUInt32BE(1), id, '消息id错误');
      assert.deepStrictEqual(payload.readUInt8(5), 0x20, '操作码错误');
    });

    it('assembel system response buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'response',
        type: 'device',
        target: 'system',
        method: 'reset',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        code: 0x00,
      }); // tlv数据封装
      const {
        version: parsedVersion,
        id: parsedId,
        operations: parsedOperations,
        time,
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.code, 0xa0, '响应码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
    });

    it('assembel notify request buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request', // 操作类型
        type: 'device', // 设备类型
        target: 'resource', // 操作对象 'resource'
        method: 'notify', // 操作名
      };
      const groupId = utils.generateFunctionId('buffer', 'property', utils.getRandomResourceId('combine'));
      const functionId = utils.generateFunctionId('exception', 'property', utils.getRandomResourceId());
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        data: {
          groupId,
          params: [{
            functionId,
            valueType: 'exception',
            value: 5,
          }],
        },
      }); // tlv数据封装
      const {
        version: parsedVersion,
        id: parsedId,
        operations: parsedOperations,
        time,
        data,
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.code, 3, '响应码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(groupId, parseInt(Object.keys(data.params)[0]), '功能点解析失败');
    });

    it('assembel event notify request buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request', // 操作类型
        type: 'device', // 设备类型
        target: 'resource', // 操作对象 'resource'
        method: 'notify', // 操作名
      };
      const groupId = utils.generateFunctionId('buffer', 'event', utils.getRandomResourceId('combine'));
      const functionId = utils.generateFunctionId('string', 'event', utils.getRandomResourceId());
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        data: {
          groupId,
          params: [{
            functionId,
            valueType: 'string',
            value: JSON.stringify({
              event: 'event-test',
            }),
          }],
        },
      }); // tlv数据封装
      const {
        version: parsedVersion,
        id: parsedId,
        operations: parsedOperations,
        time,
        data,
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.code, 3, '响应码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(groupId, parseInt(Object.keys(data.params)[0]), '功能点解析失败');
    });

    it('assembel read request buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request', // 操作类型
        type: 'device', // 设备类型
        target: 'resource', // 操作对象 'resource'
        method: 'read', // 操作名
      };
      const functionId = utils.generateFunctionId('string', 'property', utils.getRandomResourceId());
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        data: {
          params: [{
            functionId,
          }],
        },
      }); // tlv数据封装
      const {
        version: parsedVersion,
        id: parsedId,
        operations: parsedOperations,
        time,
        data,
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.code, 1, '响应码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(data.params)[0]), '功能点解析失败');
    });

    it('assembel read response buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        code: 129,
      };
      const functionId = utils.generateFunctionId('boolean', 'property', 1);
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        code: 0,
        data: {
          params: [{
            functionId,
            valueType: 'boolean',
            value: true,
          }],
        },
      }); // tlv数据封装
      const {
        version: parsedVersion,
        id: parsedId,
        operations: parsedOperations,
        time,
        code,
        data,
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(code, 0, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, operations.code, '操作码错误');
      assert.deepEqual(functionId, parseInt(Object.keys(data.params)[0]), '功能点解析失败');
    });

    it('assembel write request buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request', // 操作类型
        type: 'device', // 设备类型
        target: 'resource', // 操作对象 'resource'
        method: 'write', // 操作名
      };
      const functionId = utils.generateFunctionId('string', 'property', utils.getRandomResourceId());
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        data: {
          params: [{
            functionId,
            valueType: 'string',
            value: 'string-test',
          }],
        },
      }); // tlv数据封装
      const {
        version: parsedVersion,
        id: parsedId,
        operations: parsedOperations,
        time,
        data: {
          params,
        },
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.code, 2, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '功能点解析失败');
      assert.deepEqual('string-test', params[functionId].value, '功能点解析失败');
    });

    it('assembel write response buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'response', // 操作类型
        type: 'device', // 设备类型
        target: 'resource', // 操作对象 'resource'
        method: 'write', // 操作名
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        code: 0,
      }); // tlv数据封装
      const {
        version: parsedVersion,
        id: parsedId,
        operations: parsedOperations,
        code,
        time,
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(code, 0, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 0x82, '操作码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
    });

    it('assembel non-tls register response buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'response',
        type: 'device',
        target: 'system',
        method: 'register',
      };
      const functionProductId = utils.generateFunctionId('string', 'custom', 1);
      const functionDeviceId = utils.generateFunctionId('string', 'custom', 2);
      const functionToken = utils.generateFunctionId('string', 'custom', 3);
      const functionBrokerAddress = utils.generateFunctionId('string', 'custom', 4);
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        code: 0,
        data: {
          params: [{
            functionId: functionProductId,
            valueType: 'string',
            value: 'test-pid',
          },
          {
            functionId: functionDeviceId,
            valueType: 'string',
            value: 'test-device-id',
          },
          {
            functionId: functionToken,
            valueType: 'string',
            value: 'test-token',
          },
          {
            functionId: functionBrokerAddress,
            valueType: 'string',
            value: 'test-broker-address',
          },
          ],
        },
      }); // tlv数据封装
      const {
        version: parsedVersion,
        id: parsedId,
        code,
        operations: parsedOperations,
        time,
        data: {
          params,
        },
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(code, 0, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 162, '响应码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionProductId, parseInt(Object.keys(params)[0]), '产品id功能点解析失败');
      assert.deepEqual(functionDeviceId, parseInt(Object.keys(params)[1]), '设备sn功能点解析失败');
      assert.deepEqual(functionToken, parseInt(Object.keys(params)[2]), 'token功能点解析失败');
      assert.deepEqual(functionBrokerAddress, parseInt(Object.keys(params)[3]), 'broker地址功能点解析失败');
      assert.deepEqual('test-pid', params[functionProductId].value, '产品id功能点值解析失败');
      assert.deepEqual('test-device-id', params[functionDeviceId].value, '设备sn功能点值解析失败');
      assert.deepEqual('test-token', params[functionToken].value, 'token功能点值解析失败');
      assert.deepEqual(
        'test-broker-address',
        params[functionBrokerAddress].value,
        'broker地址功能点值解析失败'
      );
    });

    it('assembel tls register response buffer', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'response',
        type: 'device',
        target: 'system',
        method: 'register',
      };
      const functionProductId = utils.generateFunctionId('string', 'custom', 1);
      const functionDeviceId = utils.generateFunctionId('string', 'custom', 2);
      const functionToken = utils.generateFunctionId('string', 'custom', 3);
      const functionBrokerAddress = utils.generateFunctionId('string', 'custom', 4);
      const functionCRT = utils.generateFunctionId('buffer', 'custom', 5);
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
        code: 0,
        data: {
          params: [{
            functionId: functionProductId,
            valueType: 'string',
            value: 'test-pid',
          },
          {
            functionId: functionDeviceId,
            valueType: 'string',
            value: 'test-device-id',
          },
          {
            functionId: functionToken,
            valueType: 'string',
            value: 'test-token',
          },
          {
            functionId: functionBrokerAddress,
            valueType: 'string',
            value: 'test-broker-address',
          },
          {
            functionId: functionCRT,
            valueType: 'buffer',
            value: Buffer.from('test-crt'),
          },
          ],
        },
      }); // tlv数据封装
      const {
        version: parsedVersion,
        id: parsedId,
        operations: parsedOperations,
        time,
        code,
        data: {
          params,
        },
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      const functions = Object.keys(params);
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(code, 0, '响应码错误');
      assert.deepStrictEqual(parsedOperations.code, 162, '响应码错误');
      delete parsedOperations.code;
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert(functions.includes(functionProductId.toString()), '产品id功能点解析失败');
      assert(functions.includes(functionDeviceId.toString()), '设备sn功能点解析失败');
      assert(functions.includes(functionToken.toString()), 'token功能点解析失败');
      assert(functions.includes(functionBrokerAddress.toString()), 'broker地址功能点解析失败');
      assert(functions.includes(functionCRT.toString()), '证书功能点解析失败');
      assert.deepEqual('test-pid', params[functionProductId].value, '产品id功能点值解析失败');
      assert.deepEqual('test-device-id', params[functionDeviceId].value, '设备sn功能点值解析失败');
      assert.deepEqual('test-token', params[functionToken].value, 'token功能点值解析失败');
      assert.deepEqual(
        'test-broker-address',
        params[functionBrokerAddress].value,
        'broker地址功能点值解析失败'
      );
      assert.deepEqual(
        Buffer.from('test-crt').toString('hex'),
        params[functionCRT].value,
        '证书功能点值解析失败'
      );
    });
  });
});
