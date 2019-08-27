'use strict';

const mock = require('egg-mock');
const assert = require('assert');
const chance = new require('chance')();

function getRandomDataType() {
  const index = chance.integer({
    min: 0,
    max: 6,
  });
  const dataTypeArray = [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string' ];
  return dataTypeArray[index];
}

function getRandomMethodType() {
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

function getRandomGroup() {
  const messageType = getRandomMessageType();
  const resourceId = getRandomResource('combine');
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
      value = chance.bool();
      break;
    case 'integer':
      value = chance.bool();
      break;
    case 'float':
      value = chance.bool();
      break;
    case 'buffer':
      value = chance.bool();
      break;
    case 'exception':
      value = chance.bool();
      break;
    case 'string':
      value = chance.bool();
      break;
    default:
      break;
  }
  return value;
}

function getRandomData() {
  const messageType = getRandomMessageType();
  const resourceType = getRandomResourceType();
  const resourceId = getRandomResource(resourceType);
  const valueType = getRandomDataType();
  const value = getRandomValue(valueType);
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
      const data = []; // 功能点数据
      const isGroupFunction = chance.bool();
      if (isGroupFunction) {
        group = getRandomGroup();
      }


      const jsonData = {
        version,
        method,
        group,
        data,
      };

      const packagedData = app.thing.tlv.packager.package(jsonData);
      assert(packagedData);
    });
  });
});
