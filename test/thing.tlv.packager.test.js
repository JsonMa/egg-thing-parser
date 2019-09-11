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

function getRandomMethod() {
  const index = chance.integer({
    min: 0,
    max: 4,
  });
  const methodArray = [ 'read', 'write', 'notify', 'reset', 'recovery' ];
  return methodArray[index];
}

function getRandomVersion() {
  const randomVersion = chance.integer({
    min: 1,
    max: 100,
  });
  return `${randomVersion}.0.0`;
}

function getRandomMessageType() {
  const index = chance.integer({
    min: 0,
    max: 3,
  });
  const messageTypeArray = [ 'system', 'device', 'property', 'event' ];
  return messageTypeArray[index];
}

function getRandomResource(type) {
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

function getRandomGroup(messageType, groupId) {
  if (!messageType) messageType = getRandomMessageType();
  if (!groupId) groupId = generateFunction('buffer', messageType, getRandomResource('combine'));
  return groupId;
}

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
 * 生成功能点buffer
 *
 * @param {Number} valueType     - 数据类型
 * @param {Number} messageType   - 消息类型
 * @param {Number} resourceId    - 资源值
 * @return {Buffer} function buffer
 * @memberof Packager
 */
function generateFunction(valueType, messageType, resourceId) {
  const dataTypeArray = [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string' ];
  valueType = dataTypeArray.indexOf(valueType) + 1;
  const messageTypeArray = [ 'system', 'device', 'property', 'event' ];
  messageType = messageTypeArray.indexOf(messageType);
  const valueTypeBits = _.padStart(valueType.toString(2), 3, '0'); // exp: '011'
  const messageTypeBits = _.padStart(messageType.toString(2), 2, '0'); // exp: '01'
  const resourceIdBits = _.padStart(resourceId.toString(2), 11, '0'); // exp: '00000000011'
  return parseInt(`${valueTypeBits}${messageTypeBits}${resourceIdBits}`, 2);
}

function getRandomData(valueType, messageType, resourceType) {
  if (!resourceType) resourceType = getRandomResourceType();
  const resourceId = getRandomResource(resourceType); // 生成资源ID
  if (!messageType) messageType = getRandomMessageType(); // 生成消息类型
  if (!valueType) valueType = getRandomDataType(); // 生成数据类型
  const value = getRandomValue(valueType); // 生成数据值
  return {
    resourceId: generateFunction(valueType, messageType, resourceId),
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

  describe('thing/tlv/packager', () => {
    it('group function data should be packaged successfully', () => {
      const version = getRandomVersion(); // 版本号
      const method = getRandomMethod(); // 操作码
      const data = [ getRandomData('string', 'property', 'common') ]; // 功能点数据
      const groupId = getRandomGroup('property');
      const jsonData = {
        version,
        method,
        groupId,
        data,
      };
      const packagedData = app.thing.tlv.packager.package(jsonData); // 打包生产tlv buffer
      assert(Buffer.isBuffer(packagedData));
      const parsedData = app.thing.tlv.parser.parse(packagedData); // 逆解析验证tlv buffer
      assert(parsedData.version === version, '版本号错误');
      assert(parsedData.data.method === method, 'method错误');
      assert(!!parsedData.time, '需包含时间参数time');
      assert.ok(typeof parsedData.data.params === 'object', 'params需为对象');
      assert.ok(typeof parsedData.data.params[groupId].value === 'object', '组合功能点解析失败');
      assert.ok(parsedData.data.params[groupId].value[data[0].resourceId].value === data[0].value, '功能点值错误');
    });
  });
});
