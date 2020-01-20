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

  afterEach(mock.restore);

  describe('thing/tlv/operations', () => {
    it('reset operation', () => {
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
      const {
        version: parsedVersion,
        id: parsedId,
        operations: parsedOperations,
        time,
      } = app.thing.tlv.parser.parse(payload); // tlv数据解析
      assert(parsedVersion === version, '版本号错误');
      assert(id === parsedId, '消息id错误');
      assert(time && typeof time === 'number', '需包含时间戳');
      assert.deepStrictEqual(parsedOperations.method, 'reset', '操作码错误');
    });

    it('recovery operation', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'system',
        method: 'recovery',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
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
      assert.deepStrictEqual(parsedOperations.method, 'recovery', '操作码错误');
    });

    it('deregister operation', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'system',
        method: 'deregister',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
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
      assert.deepStrictEqual(parsedOperations.method, 'deregister', '操作码错误');
    });

    it('enable operation', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'system',
        method: 'enable',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
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
      assert.deepStrictEqual(parsedOperations.method, 'enable', '操作码错误');
    });

    it('disable operation', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'system',
        method: 'disable',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
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
      assert.deepStrictEqual(parsedOperations.method, 'disable', '操作码错误');
    });

    it('label operation', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'system',
        method: 'label',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
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
      assert.deepStrictEqual(parsedOperations.method, 'label', '操作码错误');
    });

    it('upgrade operation', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'system',
        method: 'upgrade',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
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
      assert.deepStrictEqual(parsedOperations.method, 'upgrade', '操作码错误');
    });

    it('register operation', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'system',
        method: 'register',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
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
      assert.deepStrictEqual(parsedOperations.method, 'register', '操作码错误');
    });

    it('deleteTopology operation', () => {
      const version = utils.getRandomVersion(); // 版本号
      const id = utils.getRandomMsgId(true); // 消息id
      const operations = {
        operation: 'request',
        type: 'device',
        target: 'system',
        method: 'deleteTopology',
      };
      const payload = app.thing.tlv.packager.package({
        version,
        id,
        operations,
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
      assert.deepStrictEqual(parsedOperations.method, 'deleteTopology', '操作码错误');
    });
  });
});
