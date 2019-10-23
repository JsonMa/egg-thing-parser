'use strict';

const thingAssert = require('thing-assert');
const TLV_METHOD_LENGTH = Symbol('TLV#MethodLength');
const TLV_FUNCTION_LENGTH = Symbol('TLV#FunctionLength');
const TLV_VALUE_FIXED_LENGTH = Symbol('TLV#ValueFixedLength');
const TLV_CRC_LENGTH = Symbol('TLV#CRCLength');
const TLV_VERSION_LENGTH = Symbol('TLV#VersionLength');
const TLV_MSGID_LENGTH = Symbol('TLV#MsgIdLength');
const ajv = require('ajv')();

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
    this[TLV_MSGID_LENGTH] = 4; // 4字节消息id
    this[TLV_METHOD_LENGTH] = 1; // 1字节操作码
    this[TLV_FUNCTION_LENGTH] = 2; // 2字节功能点
    this[TLV_VALUE_FIXED_LENGTH] = 1; // 1字节功能值长度
    this[TLV_CRC_LENGTH] = 2; // 2字节校验码
  }

  verify(data) {
    if (!this.validate) this.validate = ajv.compile(this.app.schema.packager);
    const result = this.validate(data);
    if (!result) thingAssert(false, JSON.stringify(this.validate.errors), 400); // 参数错误
  }
  /**
   * TLV数据拼装
   *
   * @param {Object} params                          - 参数
   * @param {String} params.version                  - 协议版本号
   * @param {String} params.msgId                    - 消息id
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
    thingAssert(typeof params === 'object', `[Packager][package] - TLV数据封装错误：data非object类型: ${params}`, 400);
    // ajv
    this.verify(params);
    const {
      version,
      method,
      groupId,
      data,
      id,
    } = params;
    const hasMsgId = !!id;
    // version
    const versionBuffer = Buffer.allocUnsafe(this[TLV_VERSION_LENGTH]);
    const versionNumber = parseInt(version.split('.')[0]);
    versionBuffer.writeUInt8(hasMsgId ? versionNumber + 128 : versionNumber);
    // msgid
    const msgidBuffer = Buffer.allocUnsafe(hasMsgId ? this[TLV_MSGID_LENGTH] : 0);
    if (hasMsgId) msgidBuffer.writeUInt32BE(id);
    // method
    const methodBuffer = Buffer.allocUnsafe(this[TLV_METHOD_LENGTH]);
    methodBuffer.writeUInt8(this.methodConvert(method));
    // payload
    let payloadLength = 0;
    let payloadBuffer = Buffer.allocUnsafe(0);
    // data
    data.forEach(item => {
      const {
        valueType,
        resourceId,
        value,
      } = item;
      // function
      const functionBuffer = Buffer.allocUnsafe(this[TLV_FUNCTION_LENGTH]);
      functionBuffer.writeUInt16BE(resourceId);
      // value，可独立构造下行的read命令
      if (method === 'read' && !value && !valueType) {
        payloadLength = functionBuffer.length;
        payloadBuffer = functionBuffer;
      } else {
        const valueBuffer = this.app.thing.tlv.transfer[valueType].typeToBinary(value);
        payloadLength += (functionBuffer.length + valueBuffer.length);
        payloadBuffer = Buffer.concat([ payloadBuffer, functionBuffer, valueBuffer ], payloadLength);
      }
    });
    // group
    if (groupId) {
      // 组合功能点
      const functionBuffer = Buffer.allocUnsafe(this[TLV_FUNCTION_LENGTH]);
      functionBuffer.writeUInt16BE(groupId);
      payloadLength += functionBuffer.length;
      // 确定payload长度
      const subBufferLength = payloadBuffer.length;
      let perfixBuffer;
      thingAssert(subBufferLength <= 0x3fffffff, `[Packager][package] - 组合功能点长度错误，需要<=0x3fffffff字节"，实际为：${subBufferLength}字节`, 400);
      if (subBufferLength > 63 && subBufferLength <= 16383) { // eslint-disable-line
        perfixBuffer = Buffer.allocUnsafe(2);
        perfixBuffer.writeUInt16BE(subBufferLength + 16384);
      } else if (subBufferLength > 16383 && subBufferLength <= 4194303) {
        const totalLength = subBufferLength + 8388608;
        const firstByte = (totalLength & 0xff0000) >> 16; // eslint-disable-line
        const lastBytes = totalLength & 0x00ffff; // eslint-disable-line
        perfixBuffer = Buffer.allocUnsafe(3);
        perfixBuffer.writeUInt8(firstByte, 0);
        perfixBuffer.writeUInt16BE(lastBytes, 1);
      } else if (subBufferLength > 4194303) {
        perfixBuffer = Buffer.allocUnsafe(4);
        perfixBuffer.writeUInt32BE(subBufferLength + 3221225472);
      } else {
        perfixBuffer = Buffer.allocUnsafe(1);
        perfixBuffer.writeUInt8(subBufferLength);
      }
      payloadLength += perfixBuffer.length;
      payloadBuffer = Buffer.concat([ functionBuffer, perfixBuffer, payloadBuffer ], payloadLength);
    }
    // crc
    const crcBuffer = Buffer.allocUnsafe(this[TLV_CRC_LENGTH]);
    crcBuffer.writeUInt16BE(this.app.thing.crc.getCrc16(Buffer.concat([ versionBuffer, msgidBuffer, methodBuffer, payloadBuffer ], this[TLV_VERSION_LENGTH] + this[TLV_METHOD_LENGTH] + msgidBuffer.length + payloadLength)));
    // tv buffer
    const tvBuffer = Buffer.concat([ versionBuffer, msgidBuffer, methodBuffer, payloadBuffer, crcBuffer ], this[TLV_VERSION_LENGTH] + msgidBuffer.length + this[TLV_METHOD_LENGTH] + payloadLength + this[TLV_CRC_LENGTH]);
    return tvBuffer;
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
}

module.exports = Packager;
