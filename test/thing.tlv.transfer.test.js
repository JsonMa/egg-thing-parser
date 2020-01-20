'use strict';

const mock = require('egg-mock');
const assert = require('assert');
const chance = new require('chance')();

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

  describe('thing/tlv/transfer', () => {
    it('transfer binary to boolean', () => {
      const errorArray = [];
      const correctTrueBooleanBuffer = Buffer.from([ 0x01 ], 'hex');
      const correctFalseBooleanBuffer = Buffer.from([ 0x00 ], 'hex');
      const incorrectBooleanBuffer1 = Buffer.from([ 0x01, 0x02 ], 'hex');
      const incorrectBooleanBuffer2 = Buffer.from([ 0x03 ], 'hex');
      const incorrectBooleanBuffer3 = 'NOT BUFFER';
      const correctTrueBoolean = app.thing.tlv.transfer.boolean.binaryToType(correctTrueBooleanBuffer);
      const correctFalseBoolean = app.thing.tlv.transfer.boolean.binaryToType(correctFalseBooleanBuffer);
      [ incorrectBooleanBuffer1, incorrectBooleanBuffer2, incorrectBooleanBuffer3 ].forEach(booleanBuffer => {
        try {
          app.thing.tlv.transfer.boolean.binaryToType(booleanBuffer);
        } catch (error) {
          errorArray.push(booleanBuffer);
        }
      });
      assert.deepStrictEqual(correctTrueBoolean, true, '布尔值错误');
      assert.deepStrictEqual(correctFalseBoolean, false, '布尔值错误');
      assert.deepStrictEqual(errorArray.length, 3, '捕获的布尔值错误数量错误');
    });

    it('transfer boolean to binary', () => {
      const booleanTrueBuffer = app.thing.tlv.transfer.boolean.typeToBinary(true);
      assert.deepStrictEqual(booleanTrueBuffer.readInt8(), 1, '布尔值错误');
      const booleanFalseBuffer = app.thing.tlv.transfer.boolean.typeToBinary(false);
      assert.deepStrictEqual(booleanFalseBuffer.readInt8(), 0, '布尔值错误');
      let error = null;
      try {
        app.thing.tlv.transfer.boolean.typeToBinary('true');
      } catch (err) {
        error = err;
      }
      assert.deepStrictEqual(error.status, 400, '布尔值错误');
    });

    it('transfer binary to json', () => {
      let jsonError = null;
      const correctJsonBuffer = Buffer.from(JSON.stringify({ key: 'json-test' }));
      const incorrectJsonBuffer = Buffer.from("{ key: 'test' }");
      const correctJson = app.thing.tlv.transfer.json.binaryToType(correctJsonBuffer);
      try {
        app.thing.tlv.transfer.json.binaryToType(incorrectJsonBuffer);
      } catch (error) {
        jsonError = error;
      }
      assert.deepStrictEqual(correctJson.key, 'json-test', 'json值错误');
      assert.deepStrictEqual(jsonError.status, 400, 'json值错误');
    });

    it('transfer json to binary', () => {
      const rawJson = { key: 'json-test' };
      const smallJsonString = JSON.stringify({ key: 'json-test' });
      const bigJsonString = JSON.stringify({ key: chance.string({
        length: 200,
        pool: 'abcdefghijklmnopgrstuvwxyz0123456789',
      }) });
      const rawJsonBuffer = app.thing.tlv.transfer.json.typeToBinary(rawJson);
      const smallJsonBuffer = app.thing.tlv.transfer.json.typeToBinary(smallJsonString);
      const bigJsonBuffer = app.thing.tlv.transfer.json.typeToBinary(bigJsonString);
      assert.deepStrictEqual(rawJsonBuffer.slice(1, rawJsonBuffer.length).toString(), smallJsonString, 'json值错误');
      assert.deepStrictEqual(smallJsonBuffer.slice(1, smallJsonBuffer.length).toString(), smallJsonString, 'json值错误');
      assert.deepStrictEqual(bigJsonBuffer.slice(2, bigJsonBuffer.length).toString(), bigJsonString, 'json值错误');
    });
  });
});
