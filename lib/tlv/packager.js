'use strict';

const assert = require('assert');
const TLV_METHOD_LENGTH = Symbol('TLV#MethodLength');
const TLV_FUNCTION_LENGTH = Symbol('TLV#FunctionLength');
const TLV_VALUE_FIXED_LENGTH = Symbol('TLV#ValueFixedLength');
const TLV_CRC_LENGTH = Symbol('TLV#CRCLength');
const TLV_VERSION_LENGTH = Symbol('TLV#VersionLength');
const _ = require('lodash');
const {
  crc16ccitt,
} = require('crc');

/**
 * @class Packager
 */
class Packager {
  /**
   *Creates an instance of Packager.
   *
   * @param {Object} app - egg application
   * @memberof Parser
   */
  constructor(app) {
    this.app = app;
    this[TLV_VERSION_LENGTH] = 1; // 1字节版本号
    this[TLV_METHOD_LENGTH] = 1; // 1字节操作码
    this[TLV_FUNCTION_LENGTH] = 2; // 2字节功能点
    this[TLV_VALUE_FIXED_LENGTH] = 1; // 1字节功能值长度
    this[TLV_CRC_LENGTH] = 2; // 2字节校验码
  }

  /**
   * TLV数据拼装
   *
   * @param {Object} params                          - 参数
   * @param {String} params.version                  - 协议版本号
   * @param {String} params.method                   - 操作码
   * @param {Object} params.groupId                  - 组合功能点id
   * @param {Object} params.groupId.messageType      - 组合功能点消息类型
   * @param {Object} params.groupId.resourceId       - 组合功能点资源id
   * @param {Object} params.groupId                  - 组合功能点id
   * @param {Object} params.data                     - data
   * @param {Object} params.data[index]              - 功能点
   * @param {Object} params.data[index].messageType  - 消息类型
   * @param {Object} params.data[index].valueType    - 功能点数据类型
   * @param {Object} params.data[index].value        - 功能点值
   * @memberof Packager
   * @return {Buffer} buffer
   */
  package(params) {
    assert(typeof params === 'object', `[Packager][package] - TLV数据封装错误：data非object类型: ${params}`);
    // TODO ajv验证
    const {
      version,
      method,
      groupId,
      data,
    } = params;
    // version
    const versionBuffer = Buffer.allocUnsafe(this[TLV_VERSION_LENGTH]);
    versionBuffer.writeUInt8(parseInt(version.split('.')[0]));
    // method
    const methodBuffer = Buffer.allocUnsafe(this[TLV_METHOD_LENGTH]);
    methodBuffer.writeUInt8(this.methodConvert(method));
    // payload
    let payloadLength = 0;
    let payloadBuffer = Buffer.allocUnsafe(0);
    // data
    Object.keys(data).forEach(key => {
      const {
        messageType,
        valueType,
        value,
      } = data[key];
      // function
      const functionBuffer = this.generateFunctionBuffer(this.valueTypeConvert(valueType), this.messageTypeConvert(messageType), key);
      // value
      const valueBuffer = this.app.tlv.transfer[valueType].typeToBinary(value);
      payloadLength += (functionBuffer.length + valueBuffer.length);
      payloadBuffer = Buffer.concat([ payloadBuffer, functionBuffer, valueBuffer ], payloadLength);
    });
    // group
    if (groupId) {
      // 组合功能点
      const functionBuffer = this.generateFunctionBuffer(5, this.messageTypeConvert(groupId.messageType), groupId.resourceId);
      payloadLength += functionBuffer.length;
      payloadBuffer = Buffer.concat([ functionBuffer, payloadBuffer ], payloadLength);
    }
    // crc
    const crcBuffer = Buffer.allocUnsafe(this[TLV_CRC_LENGTH]);
    crcBuffer.writeUInt16BE(crc16ccitt(Buffer.concat([ versionBuffer, methodBuffer, payloadBuffer ], this[TLV_VERSION_LENGTH] + this[TLV_METHOD_LENGTH] + payloadLength)));
    // tv buffer
    const tvBuffer = Buffer.concat([ versionBuffer, methodBuffer, payloadBuffer, crcBuffer ], this[TLV_VERSION_LENGTH] + this[TLV_METHOD_LENGTH] + payloadLength + this[TLV_CRC_LENGTH]);
    return this.packageSplit(tvBuffer);
  }

  /**
   * method转
   *
   * @param {String} method - 操作码code
   * @memberof Packager
   * @return {Number} 操作码
   */
  methodConvert(method) {
    let code = null;
    switch (method) {
      case 'read':
        code = 0x01;
        break;
      case 'write':
        code = 0x02;
        break;
      case 'notify':
        code = 0x03;
        break;
      case 'reset':
        code = 0x04;
        break;
      case 'recovery':
        code = 0x05;
        break;
      default:
        throw new Error(`[Packager][methodConvert] - 操作码转换失败，未知的操作码：${method}`);
    }
    return code;
  }

  /**
   * value type转换
   *
   * @param {String} type   - 数据类型
   * @return {Number} 数据索引index
   * @memberof Packager
   */
  valueTypeConvert(type) {
    const valueArray = [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string' ];
    return valueArray.indexOf(type) + 1;
  }

  /**
   * message type转换
   *
   * @param {String} type  - 消息类型
   * @return {Number} 消息类型index
   * @memberof Packager
   */
  messageTypeConvert(type) {
    const messageArray = [ 'system', 'device', 'property', 'event' ];
    return messageArray.indexOf(type);
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
  generateFunctionBuffer(valueType, messageType, resourceId) {
    const functionBuffer = Buffer.allocUnsafe(this[TLV_FUNCTION_LENGTH]);
    const valueTypeBits = _.padStart(valueType.toString(2), 3, '0'); // exp: '011'
    const messageTypeBits = _.padStart(messageType.toString(2), 11, '0'); // exp: '01'
    const resourceIdBits = _.padStart(resourceId.toString(2), 11, '0'); // exp: '00000000011'
    functionBuffer.writeUInt16BE(parseInt(`${valueTypeBits}${messageTypeBits}${resourceIdBits}`, 2));
    return functionBuffer;
  }
}

module.exports = Packager;
