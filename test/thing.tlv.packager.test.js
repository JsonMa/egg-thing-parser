'use strict';

const mock = require('egg-mock');
const assert = require('assert');
const chance = new require('chance')();
const _ = require('lodash');

function getRandomDataType() {
  const index = chance.integer({
    min: 0,
    max: 5,
  });
  const dataTypeArray = [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'string' ];
  return dataTypeArray[index];
}

// function getRandomResourceMethod() {
//   const index = chance.integer({
//     min: 0,
//     max: 3,
//   });
//   const methodArray = [ 'read', 'write', 'notify' ];
//   return methodArray[index];
// }

function getRandomVersion() {
  const randomVersion = chance.integer({
    min: 1,
    max: 100,
  });
  return `${randomVersion}.0.0`;
}

function getRandomMsgId(hasMsgId) {
  return hasMsgId ? chance.integer({
    min: 1,
    max: 0xffffffff,
  }) : null;
}

function getRandomMessageType() {
  const index = chance.integer({
    min: 0,
    max: 1,
  });
  const messageTypeArray = [ 'property', 'event' ];
  return messageTypeArray[index];
}

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

function getRandomResourceType() {
  const index = chance.integer({
    min: 0,
    max: 2,
  });
  const resourceTypeArray = [ 'common', 'static', 'combine' ]; // 普通、组合、固定
  return resourceTypeArray[index];
}

// function getRandomGroup(messageType, groupId) {
//   if (!messageType) messageType = getRandomMessageType();
//   if (!groupId) groupId = generateFunction('buffer', messageType, getRandomResourceId('combine'));
//   return groupId;
// }

function getRandomValue(type) {
  let value = null;
  switch (type) {
    case 'boolean':
      value = chance.bool();
      break;
    case 'enum':
      value = chance.integer({
        min: 0,
        max: 255,
      });
      break;
    case 'integer':
      value = chance.integer({
        min: -256,
        max: -255,
      });
      break;
    case 'float':
      value = chance.floating({
        min: -256,
        max: 255,
      });
      break;
    case 'buffer':
      value = chance.string({
        pool: '0123456789abcdef',
        length: 10,
      });
      break;
    case 'string':
      value = chance.string({
        length: 255,
      });
      break;
    default:
      break;
  }
  return value;
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

/**
 * 生成功能点值
 *
 * @param {String} valueType     - 功能点值类型
 * @param {String} messageType   - 消息类型
 * @param {String} resourceType  - 资源类型
 * @param {Number} resourceId    - 资源id
 * @return {Object} - 数据
 */
function getRandomData(valueType, messageType, resourceType, resourceId) {
  if (!resourceType) resourceType = getRandomResourceType();
  if (!resourceId) resourceId = getRandomResourceId(resourceType); // 生成资源ID
  if (!messageType) messageType = getRandomMessageType(); // 生成消息类型
  if (!valueType) valueType = getRandomDataType(); // 生成数据类型
  const value = getRandomValue(valueType); // 生成数据值
  return {
    functionId: generateFunctionId(valueType, messageType, resourceId),
    valueType,
    value,
  };
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
  });
});
