'use strict';

const mock = require('egg-mock');
const assert = require('assert');
const chance = new require('chance')();
const _ = require('lodash');

/**
 * 生成随机版本号
 *
 * @return {String} - 版本号
 */
function getRandomVersion() {
  const randomVersion = chance.integer({
    min: 1,
    max: 100,
  });
  return `${randomVersion}.0.0`;
}

/**
 * 生成随机消息id
 *
 * @param {Boolean} hasMsgId - 是否需要生成消息id
 * @return {Number} - 消息id
 */
function getRandomMsgId(hasMsgId) {
  return hasMsgId ? chance.integer({
    min: 1,
    max: 0xffffffff,
  }) : null;
}

/**
 * 生成resourceId
 *
 * @param {String} type  - 资源类型
 * @return {Number} - resourceId
 */
function getRandomResourceId(type) {
  let min = null;
  let max = null;
  switch (type) {
    case 'static':
      min = 0x700;
      max = 0x7ff;
      break;
    case 'combine':
      min = 0x500;
      max = 0x6ff;
      break;
    default:
      min = 0;
      max = 0x4ff;
      break;
  }
  const resourceId = chance.integer({
    min,
    max,
  });
  return resourceId;
}

/**
 * 生成功能点Id
 *
 * @param {Number} valueType     - 数据类型
 * @param {Number} messageType   - 消息类型
 * @param {Number} resourceId    - 资源值
 * @return {Buffer} function buffer
 * @memberof Packager
 */
function generateFunctionId(valueType, messageType, resourceId) {
  const dataTypeArray = [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string' ];
  valueType = dataTypeArray.indexOf(valueType) + 1;
  const messageTypeArray = [ 'reserve', 'custom', 'property', 'event' ];
  messageType = messageTypeArray.indexOf(messageType);
  const valueTypeBits = _.padStart(valueType.toString(2), 3, '0'); // exp: '011'
  const messageTypeBits = _.padStart(messageType.toString(2), 2, '0'); // exp: '01'
  const resourceIdBits = _.padStart(resourceId.toString(2), 11, '0'); // exp: '00000000011'
  return parseInt(`${valueTypeBits}${messageTypeBits}${resourceIdBits}`, 2);
}

describe('test/thing/tlv/packager.test.js', () => {
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
    it('should attach packager object to app.thing.tlv', () => {
      assert.ok(!!app.thing.tlv.packager, 'packager实例挂载失败');
    });
  });

  describe('thing/tlv/packager/request', () => {
    it('assembel read request buffer', () => {
      const version = getRandomVersion(); // 版本号
      const id = getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request', // 操作类型
        type: 'device', // 设备类型
        target: 'resource', // 操作对象 'resource'
        method: 'read', // 操作名
      };
      const functionId = generateFunctionId('string', 'property', getRandomResourceId());
      const packagedBufferPadyload = app.thing.tlv.packager.package({
        version,
        ...id ? {
          id,
        } : null,
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
      } = app.thing.tlv.parser.parse(packagedBufferPadyload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(data.params)[0]), '组合功能点解析失败');
    });

    it('assembel write request buffer', () => {
      const version = getRandomVersion(); // 版本号
      const id = getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request', // 操作类型
        type: 'device', // 设备类型
        target: 'resource', // 操作对象 'resource'
        method: 'write', // 操作名
      };
      const functionId = generateFunctionId('string', 'property', getRandomResourceId());
      const packagedBufferPadyload = app.thing.tlv.packager.package({
        version,
        ...id ? {
          id,
        } : null,
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
      } = app.thing.tlv.parser.parse(packagedBufferPadyload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionId, parseInt(Object.keys(params)[0]), '组合功能点解析失败');
      assert.deepEqual('string-test', params[functionId].value, '组合功能点解析失败');
    });

    it('assembel register response buffer', () => {
      const version = getRandomVersion(); // 版本号
      const id = getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'response',
        type: 'device',
        target: 'system',
        method: 'register',
      };
      const functionProductId = generateFunctionId('string', 'custom', 1);
      const functionDeviceId = generateFunctionId('string', 'custom', 2);
      const functionToken = generateFunctionId('string', 'custom', 3);
      const functionBrokerAddress = generateFunctionId('string', 'custom', 4);
      const packagedBufferPadyload = app.thing.tlv.packager.package({
        version,
        ...id ? {
          id,
        } : null,
        operations,
        code: 0,
        data: {
          params: [{
            functionId: functionProductId,
            valueType: 'string',
            value: 'test-pid',
          }, {
            functionId: functionDeviceId,
            valueType: 'string',
            value: 'test-device-id',
          }, {
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
        operations: parsedOperations,
        time,
        data: {
          params,
        },
      } = app.thing.tlv.parser.parse(packagedBufferPadyload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(operations, parsedOperations, 'operations解析错误');
      assert.deepEqual(functionProductId, parseInt(Object.keys(params)[0]), '产品id功能点解析失败');
      assert.deepEqual(functionDeviceId, parseInt(Object.keys(params)[1]), '设备sn功能点解析失败');
      assert.deepEqual(functionToken, parseInt(Object.keys(params)[2]), 'token功能点解析失败');
      assert.deepEqual(functionBrokerAddress, parseInt(Object.keys(params)[3]), 'broker地址功能点解析失败');
      assert.deepEqual('test-pid', params[functionProductId].value, '产品id功能点值解析失败');
      assert.deepEqual('test-device-id', params[functionDeviceId].value, '设备sn功能点值解析失败');
      assert.deepEqual('test-token', params[functionToken].value, 'token功能点值解析失败');
      assert.deepEqual('test-broker-address', params[functionBrokerAddress].value, 'broker地址功能点值解析失败');
    });
  });
});
