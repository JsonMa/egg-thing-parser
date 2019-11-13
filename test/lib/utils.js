'use strict';

const chance = new require('chance')();
const _ = require('lodash');
/**
 * 行业协议工具函数
 *
 * @class Utils
 */
class Utils {
  constructor(app) {
    this.app = app;
  }

  /**
   * 随机生成产品id
   *
   * @return {Number} - 产品id
   * @memberof Utils
   */
  getRandomPid() {
    const randomPid = chance.integer({
      min: 900000,
      max: 1000000,
    });
    return randomPid;
  }

  /**
   * 生成随机devkey
   *
   * @return {String} - devkey
   * @memberof Utils
   */
  getRandomDevkey() {
    const randomDevkey = chance.string({
      length: 10,
      pool: 'abcdefghijklmnopgrstuvwxyz0123456789',
    });
    return randomDevkey;
  }

  /**
   * 随机生成版本号字符串
   *
   * @return {String} - 版本号字符串
   * @memberof Utils
   */
  getRandomVersion() {
    const randomVersion = chance.integer({
      min: 1,
      max: 100,
    });
    return `${randomVersion}.0.0`;
  }

  /**
   * 随机生成消息id
   *
   * @param {Boolean} hasMsgId - 是否生成消息id
   * @return {Object|Number}   - 消息id
   * @memberof Utils
   */
  getRandomMsgId(hasMsgId) {
    return hasMsgId ?
      chance.integer({
        min: 1,
        max: 0xffffffff,
      }) :
      null;
  }
  /**
   * 随机生成资源id
   *
   * @param {String} type - 资源类型（static/combine/common）
   * @return {Number}     - 资源id
   * @memberof Utils
   */
  getRandomResourceId(type) {
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
   * 生成功能点id
   *
   * @param {String} valueType     - 数据类型
   * @param {String} messageType   - 消息类型
   * @param {Number} resourceId    - 资源类型
   * @return {Number} 功能点id
   * @memberof Utils
   */
  generateFunctionId(valueType, messageType, resourceId) {
    const dataTypeArray = [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string' ];
    valueType = dataTypeArray.indexOf(valueType) + 1;
    const messageTypeArray = [ 'reserve', 'custom', 'property', 'event' ];
    messageType = messageTypeArray.indexOf(messageType);
    const valueTypeBits = _.padStart(valueType.toString(2), 3, '0'); // exp: '011'
    const messageTypeBits = _.padStart(messageType.toString(2), 2, '0'); // exp: '01'
    const resourceIdBits = _.padStart(resourceId.toString(2), 11, '0'); // exp: '00000000011'
    return parseInt(`${valueTypeBits}${messageTypeBits}${resourceIdBits}`, 2);
  }

  async addThingModelFunction(pid, functiuonId, type, hasUpPermission, hasDownPermission) {
    let schema = {
      type: 'object',
      additionalProperties: false,
      properties: {},
    };
    let up = [];
    let down = [];
    hasUpPermission && up.push(functiuonId);
    hasDownPermission && down.push(functiuonId);
    const thingModelString = await this.app.redis.hget('thing_model', pid);
    if (!thingModelString) {
      if (type) {
        schema.properties[functiuonId] = {
          type,
        };
      }
    } else {
      const {
        schema: originalSchema,
        up: originalUp,
        down: originalDown,
      } = JSON.parse(thingModelString);
      if (type) {
        originalSchema.properties[functiuonId] = {
          type,
        };
        schema = originalSchema;
      }
      up = up.concat(originalUp);
      down = down.concat(originalDown);
    }
    await this.app.redis.hset('thing_model', pid, JSON.stringify({
      schema,
      up,
      down,
    }));
  }

  async deleteThingModelFunction(pid, functionId) {
    const thingModelString = await this.app.redis.hget('thing_model', pid);
    let {
      schema,
      up,
      down,
    } = JSON.parse(thingModelString);
    up = _.without(up, parseInt(functionId));
    down = _.without(down, parseInt(functionId));
    delete schema.properties[functionId];
    await this.app.redis.hset('thing_model', pid, JSON.stringify({
      schema,
      up,
      down,
    }));
  }

  async deleteThingModel(pid) {
    await this.app.redis.hdel('thing_model', pid);
  }
}

module.exports = Utils;
