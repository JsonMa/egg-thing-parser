'use strict';

const mock = require('egg-mock');
const assert = require('assert');
const chance = new require('chance')();

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
  const resourceTypeArray = [ 'common', 'static', 'combine' ];
  return resourceTypeArray[index];
}

function getRandomGroup(messageType, resourceId) {
  if (!messageType) messageType = getRandomMessageType();
  if (!resourceId) resourceId = getRandomResource('combine');
  return {
    messageType,
    resourceId,
  };
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
      value = chance.string();
      break;
    default:
      break;
  }
  return value;
}

function getRandomData(messageType, valueType, resourceType, resourceId) {
  if (!messageType) messageType = getRandomMessageType();
  if (!resourceType) resourceType = getRandomResourceType();
  if (!resourceId) resourceId = getRandomResource(resourceType);
  if (!valueType) valueType = getRandomDataType();
  const value = getRandomValue(valueType);
  return {
    messageType,
    resourceId,
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
    it('json data should be packaged successfully', () => {
      const version = getRandomVersion(); // 版本号
      const method = getRandomMethod(); // 操作码
      let group = null; // 组合功能点信息
      const data = [ getRandomData('system', 'boolean', 'common', 1), getRandomData('system', 'string', 'common', 2) ]; // 功能点数据
      const isGroupFunction = true;
      if (isGroupFunction) {
        group = getRandomGroup('system', 1280);
      }

      const jsonData = {
        version: '1.0.0',
        method: 'write',
        ...group ? {
          group,
        } : {},
        data,
      };

      const packagedData = app.thing.tlv.packager.package(jsonData);
      assert(Buffer.isBuffer(packagedData));
      const parsedData = app.thing.tlv.parser.parse(packagedData);
      assert(typeof parsedData === 'object');
      assert(parsedData.version === version, '版本号错误');
      assert(parsedData.data.method === method, 'method错误');
      assert(!!parsedData.time, '需包含时间参数time');
      assert.ok(typeof parsedData.data.params === 'object', 'params需为对象');
      assert.ok(typeof parsedData.data.params[data[0].resourceId] === 'object', '未找到功能点信息');
      assert.ok(parsedData.data.params[data[0].resourceId].value === data[0].value, '功能点值错误');
      assert.ok(parsedData.data.params[data[0].resourceId].type === data[0].valueType, '功能点类型错误');
      assert.ok(parsedData.data.params[data[0].resourceId].message_type === data[0].messageType, '消息类型错误');
    });
  });
});
