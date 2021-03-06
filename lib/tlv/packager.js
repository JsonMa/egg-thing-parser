'use strict';

const thingAssert = require('thing-assert');
const TLV_OPERATION_LENGTH = Symbol('TLV#MethodLength');
const TLV_RESP_CODE_LENGTH = Symbol('TLV#ResponseCodeLength');
const TLV_FUNCTION_LENGTH = Symbol('TLV#FunctionLength');
const TLV_VALUE_FIXED_LENGTH = Symbol('TLV#ValueFixedLength');
const TLV_CRC_LENGTH = Symbol('TLV#CRCLength');
const TLV_VERSION_LENGTH = Symbol('TLV#VersionLength');
const TLV_MSGID_LENGTH = Symbol('TLV#MsgIdLength');
const ajv = require('ajv')();
const _ = require('lodash');

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
    this[TLV_OPERATION_LENGTH] = 1; // 1字节操作码
    this[TLV_RESP_CODE_LENGTH] = 1; // 1字节响应码
    this[TLV_FUNCTION_LENGTH] = 2; // 2字节功能点
    this[TLV_VALUE_FIXED_LENGTH] = 1; // 1字节功能值长度
    this[TLV_CRC_LENGTH] = 2; // 2字节校验码
  }

  /**
   * 数据封装参数校验
   *
   * @param {Object} data - 参数对象
   * @memberof Packager
   */
  verify(data) {
    if (!this.validate) this.validate = ajv.compile(this.app.thingSchema.packager);
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
    thingAssert(typeof params === 'object', `[Packager][package] - 参数错误，非对象类型: ${params}`, 400);
    if (!params.version) params.version = this.app.config.thingParser.protocol_version;
    this.verify(params);
    const {
      version,
      code,
      data = {},
      id,
      operations,
    } = params;
    let {
      code: operationCode,
      method,
      target,
      type,
      operation,
    } = operations;
    const {
      params: functionInfos = [],
      groupId,
    } = data;
    const hasMsgId = !!id;
    const isResponse = operation === 'response' || operationCode > 127;
    const isReadRequest = method === 'read' && type === 'device' && !isResponse;
    const isSubDeviceReadRequest = type === 'subDevice' && method === 'read' && !isResponse;
    if (isReadRequest) thingAssert(functionInfos.length === 1, '参数错误，直连设备READ求仅支持单功能点', 400); // 校验read 请求
    if (isSubDeviceReadRequest) thingAssert(functionInfos.length > 0, '缺少READ参数', 400); // 校验read 请求

    // 版本号
    const versionBuffer = Buffer.allocUnsafe(this[TLV_VERSION_LENGTH]);
    const versionNumber = parseInt(version.split('.')[0]);
    versionBuffer.writeUInt8(hasMsgId ? versionNumber + 128 : versionNumber);

    // 消息id
    const msgidBuffer = Buffer.allocUnsafe(hasMsgId ? this[TLV_MSGID_LENGTH] : 0);
    if (hasMsgId) msgidBuffer.writeUInt32BE(id);

    // 操作码
    const operationBuffer = Buffer.allocUnsafe(this[TLV_OPERATION_LENGTH]);
    if (!operationCode) {
      operationCode = this.getOperationValue(method, target, type, operation);
    }
    operationBuffer.writeUInt8(operationCode);

    // 响应码
    const responseCodeBuffer = Buffer.allocUnsafe(
      isResponse ? this[TLV_RESP_CODE_LENGTH] : 0
    );
    if (isResponse) {
      thingAssert(code >= 0, '参数错误，缺少响应码code', 400); // 响应码校验 todo:parser响应码
      responseCodeBuffer.writeUInt8(code);
    }

    // 功能点及功能点值信息
    let payloadLength = 0;
    let payloadBuffer = Buffer.allocUnsafe(0);

    functionInfos.forEach(functionInfo => {
      let functionPayloadLength;
      let functionPayload;
      const { subDeviceGroupId, subDeviceGroupParams } = functionInfo;
      if (subDeviceGroupId) {
        thingAssert(subDeviceGroupParams.length, '缺少子设备组合功能点参数', 400);
        let subDeviceGroupPayload = Buffer.allocUnsafe(0);
        subDeviceGroupParams.forEach(params => {
          const [ subDeviceFunctionLength, subDeviceFunctionPayload ] = this.commonFunctionProcessor(params);
          subDeviceGroupPayload = Buffer.concat([ subDeviceGroupPayload, subDeviceFunctionPayload ], subDeviceGroupPayload.length + subDeviceFunctionLength);
        });
        [ functionPayloadLength, functionPayload ] = this.groupFunctionProcessor(subDeviceGroupId, subDeviceGroupPayload);
      } else {
        [ functionPayloadLength, functionPayload ] = this.commonFunctionProcessor(functionInfo, isReadRequest);
      }
      payloadLength += functionPayloadLength;
      payloadBuffer = Buffer.concat([ payloadBuffer, functionPayload ], payloadLength);
    }); // 普通功能点数据

    if (groupId) {
      const [ groupPayloadLength, groupPayload ] = this.groupFunctionProcessor(groupId, payloadBuffer); // 组合功能点
      payloadLength = groupPayloadLength;
      payloadBuffer = groupPayload;
    } // 普通设备组合功能点

    // crc校验
    const crcBuffer = Buffer.allocUnsafe(this[TLV_CRC_LENGTH]);
    crcBuffer.writeUInt16BE(
      this.app.thing.crc.getCrc16(
        Buffer.concat(
          [
            versionBuffer,
            msgidBuffer,
            operationBuffer,
            responseCodeBuffer,
            payloadBuffer,
          ],
          this[TLV_VERSION_LENGTH] +
          msgidBuffer.length +
          this[TLV_OPERATION_LENGTH] +
          responseCodeBuffer.length +
          payloadLength
        )
      )
    );

    return Buffer.concat(
      [
        versionBuffer,
        msgidBuffer,
        operationBuffer,
        responseCodeBuffer,
        payloadBuffer,
        crcBuffer,
      ],
      this[TLV_VERSION_LENGTH] + msgidBuffer.length + this[TLV_OPERATION_LENGTH] + responseCodeBuffer.length + payloadLength + this[TLV_CRC_LENGTH]
    );
  }

  /**
   * 组合功能点处理函数
   *
   * @param {string} groupId       - 组合功能点id
   * @param {Buffer} payloadBuffer - 组合功能点payload
   * @return {Array} - payload
   * @memberof Packager
   */
  groupFunctionProcessor(groupId, payloadBuffer) {
    let groupPayloadLength = 0;
    let prefixBuffer = null;
    let groupPayload = Buffer.allocUnsafe(0);
    const functionBuffer = Buffer.allocUnsafe(this[TLV_FUNCTION_LENGTH]);
    functionBuffer.writeUInt16BE(groupId);
    const subBufferLength = payloadBuffer.length;
    groupPayloadLength += (functionBuffer.length + subBufferLength);
    thingAssert(subBufferLength <= 0x3fffffff, `[Packager][package] - 组合功能点长度错误，需要<=0x3fffffff字节"，实际为：${subBufferLength}字节`, 400);
    if (subBufferLength > 63 && subBufferLength <= 16383) {
      // eslint-disable-line
      prefixBuffer = Buffer.allocUnsafe(2);
      prefixBuffer.writeUInt16BE(subBufferLength + 16384);
    } else if (subBufferLength > 16383 && subBufferLength <= 4194303) {
      const totalLength = subBufferLength + 8388608;
      const firstByte = (totalLength & 0xff0000) >> 16; // eslint-disable-line
      const lastBytes = totalLength & 0x00ffff; // eslint-disable-line
      prefixBuffer = Buffer.allocUnsafe(3);
      prefixBuffer.writeUInt8(firstByte, 0);
      prefixBuffer.writeUInt16BE(lastBytes, 1);
    } else if (subBufferLength > 4194303) {
      prefixBuffer = Buffer.allocUnsafe(4);
      prefixBuffer.writeUInt32BE(subBufferLength + 3221225472);
    } else {
      prefixBuffer = Buffer.allocUnsafe(1);
      prefixBuffer.writeUInt8(subBufferLength);
    }
    groupPayloadLength += prefixBuffer.length;
    groupPayload = Buffer.concat(
      [ functionBuffer, prefixBuffer, payloadBuffer ],
      groupPayloadLength
    );
    return [ groupPayloadLength, groupPayload ];
  }

  /**
   * 普通功能点处理函数
   *
   * @param {object}   functionInfo            - 功能点信息
   * @param {boolean}  isReadRequest           - 是否read请求
   * @return {array} payload
   * @memberof Packager
   */
  commonFunctionProcessor(functionInfo, isReadRequest) {
    const {
      valueType,
      functionId,
      value,
    } = functionInfo;
    let functionPayload;
    let functionPayloadLength = 0;
    let functionPayloadBuffer = Buffer.allocUnsafe(0);
    const functionBuffer = Buffer.allocUnsafe(this[TLV_FUNCTION_LENGTH]);
    functionBuffer.writeUInt16BE(functionId);
    if (isReadRequest) {
      functionPayloadLength = this[TLV_FUNCTION_LENGTH];
      functionPayload = functionBuffer;
    } else {
      functionPayloadBuffer = this.app.thing.tlv.transfer[valueType].typeToBinary(value);
      functionPayloadLength = functionBuffer.length + functionPayloadBuffer.length;
      functionPayload = Buffer.concat([ functionBuffer, functionPayloadBuffer ], functionPayloadLength);
    }
    return [ functionPayloadLength, functionPayload ];
  }

  /**
   * method转
   *
   * @param {String} method    - 操作名
   * @param {String} target    - 操作对象
   * @param {String} type      - 设备类型
   * @param {String} operation - 操作
   * @memberof Packager
   * @return {Number} 操作码
   */
  getOperationValue(method, target, type, operation) {
    let methodCode = null;
    const targetCode = [ 'resource', 'system' ].indexOf(target);
    const typeCode = [ 'device', 'subDevice' ].indexOf(type);
    const operationCode = [ 'request', 'response' ].indexOf(operation);
    if (target === 'system') {
      const index = [ 'online', 'offline', 'deleteTopology' ].indexOf(method);
      if (index > -1) {
        methodCode = 0x1f - index;
      } else {
        methodCode = [
          'reset',
          'recovery',
          'register',
          'deregister',
          'enable',
          'disable',
          'label',
          'upgrade',
        ].indexOf(method);
      }
    } else {
      methodCode = [ 'read', 'write', 'notify' ].indexOf(method) + 1;
    }
    methodCode = _.padStart(methodCode.toString(2), 5, '0'); // 转换为二进制字符串
    return parseInt('' + operationCode + typeCode + targetCode + methodCode, 2);
  }
}

module.exports = Packager;
