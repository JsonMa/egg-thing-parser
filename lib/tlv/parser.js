'use strict';

const thingAssert = require('thing-assert');
const THING_METHOD_LENGTH = Symbol('THING#MethodLength');
const THING_RESP_CODE_LENGTH = Symbol('THING#RespCodeLength');
const THING_FUNCTION_LENGTH = Symbol('THING#FunctionLength');
const THING_VALUE_FIXED_LENGTH = Symbol('THING#ValueFixedLength');
const THING_CRC_LENGTH = Symbol('THING#CRCLength');
const THING_FIXED_PAYLOAD_LENGTH = Symbol('THING#FixedPayloadLength');
const THING_VERSION_LENGTH = Symbol('THING#VersionLength');
const THING_MSGID_LENGTH = Symbol('THING#MsgIdLength');
const _ = require('lodash');

/**
 * @class Parser
 */
class Parser {
  /**
   *Creates an instance of Parser.
   *
   * @param {Object} app - egg application
   * @memberof Parser
   */
  constructor(app) {
    this.app = app;
    this[THING_VERSION_LENGTH] = 1; // 1字节版本号
    this[THING_MSGID_LENGTH] = 4; // 4字节消息id
    this[THING_METHOD_LENGTH] = 1; // 1字节操作码
    this[THING_RESP_CODE_LENGTH] = 1; // 1字节响应码
    this[THING_FUNCTION_LENGTH] = 2; // 2字节功能点
    this[THING_VALUE_FIXED_LENGTH] = 1; // 1字节功能值长度 ?
    this[THING_FIXED_PAYLOAD_LENGTH] = this[THING_FUNCTION_LENGTH]; // 2字节(功能点+值组合的最小长度)
    this[THING_CRC_LENGTH] = 2; // 2字节校验位
  }

  /**
   * 物模型数据解析
   *
   * @param {Buffer} buffer - thing model buffer
   * @return {Object}       - 物模型数据
   */
  parse(buffer) {
    let id = 0; // 消息id
    thingAssert(Buffer.isBuffer(buffer), `[Parser][parse] - 数据非buffer类型: ${buffer}`, 400); // 数据类型校验
    thingAssert(buffer.length, '[Parser][parse] - 数据错误，长度不能为0', 401); // 数据长度非零校验

    // 版本号及消息标识校验
    const versionMsgIdValue = buffer.readUIntBE(0, this[THING_VERSION_LENGTH]);
    thingAssert(versionMsgIdValue !== 0 && versionMsgIdValue !== 128, '[Parser][parse] - 版本号不能为0', 400); // 首字节校验

    // 数据长度合法校验
    const hasMsgId = versionMsgIdValue > 128; // 是否包含消息id
    const bufferLength = buffer.length;
    const baseLengthRequired = hasMsgId ? 8 : 4; // 消息基础长度需求
    thingAssert(bufferLength >= baseLengthRequired, `[Parser][parse] - 数据错误，长度至少需要${baseLengthRequired}个字节，当前数据长度: ${bufferLength}`, 401);

    // 获取操作码信息
    const operationCode = buffer.readUInt8(hasMsgId ? this[THING_MSGID_LENGTH] + this[THING_VERSION_LENGTH] : this[THING_VERSION_LENGTH]); // 获取取操作码
    const operations = this.getOperationInfo(operationCode);
    const isDirectSystemOperation = operations.target === 'system' && operations.type === 'device';
    const lengthRequired = operations.operation === 'response' || isDirectSystemOperation ? baseLengthRequired : baseLengthRequired + 2;
    thingAssert(bufferLength >= lengthRequired, `[Parser][parse] - 数据错误，长度至少需要${lengthRequired}个字节，当前数据长度: ${bufferLength}`, 401);

    // CRC校验
    const crcPayload = buffer.readUInt16BE(bufferLength - this[THING_CRC_LENGTH]);
    const payload = buffer.slice(0, bufferLength - this[THING_CRC_LENGTH]);
    const crcCode = this.app.thing.crc.getCrc16(payload);
    thingAssert(crcCode === crcPayload, `[Parser][parse] - 数据错误, CRC校验失败, 预期:${crcPayload}, 实际:${crcCode}`, 402);

    if (hasMsgId) id = buffer.readUInt32BE(this[THING_VERSION_LENGTH]); // 获取合法的消息id
    try {
      let code = null;
      let params = null;
      const version = !hasMsgId ? versionMsgIdValue : versionMsgIdValue - 128; // 获取版本号
      const isResponseOperation = operations.operation === 'response';
      if (isResponseOperation) {
        code = buffer.readUInt8(hasMsgId ? this[THING_MSGID_LENGTH] + this[THING_VERSION_LENGTH] + this[THING_METHOD_LENGTH] : this[THING_VERSION_LENGTH] + this[THING_METHOD_LENGTH]); // 获取响应值
      }
      const index = 0; // 解析索引
      const functionPayload = buffer.slice(
        this[THING_VERSION_LENGTH] +
        this[THING_METHOD_LENGTH] +
        (hasMsgId ? this[THING_MSGID_LENGTH] : 0) + (isResponseOperation ? this[THING_RESP_CODE_LENGTH] : 0),
        bufferLength - this[THING_CRC_LENGTH]
      );
      params = operations.type === 'device' ? this.getFunctionPayloadInfo(index, functionPayload) : this.getSubDeviceInfo(operations.code, index, functionPayload); // 获取功能点及功能点值信息
      return this.getUnifiedResponse({
        version,
        id,
        code,
        operations,
        params,
      });
    } catch (error) {
      error.msgId = id;
      error.operationCode = operationCode;
      throw error;
    }
  }

  /**
   * 获取功能点值长度信息
   *
   * @param {Number} index  - 索引
   * @param {Buffer} buffer - payload buffer
   * @return {Object} 功能点值信息
   * @memberof Parser
   */
  getValueLength(index, buffer) {
    let valuePrefixLength = null;
    let valueLength = null;
    const bigLength = buffer.readUInt8(index); // 获取第一个字节大小
    if (bigLength > 63 && bigLength <= 127) {
      valuePrefixLength = 2;
      valueLength = buffer.readUInt16BE(index) - 16384; // 截取最高位01
    } else if (bigLength > 127 && bigLength <= 191) {
      valuePrefixLength = 3;
      valueLength = buffer.readUIntBE(index, 3) - 8388608; // 截取最高位10
    } else if (bigLength > 191) {
      valuePrefixLength = 4;
      valueLength = buffer.readUInt32BE(index) - 3221225472; // 截取最高位10
    } else {
      valueLength = bigLength;
      valuePrefixLength = 1;
    }
    return {
      valueLength,
      valuePrefixLength,
    };
  }

  /**
   * buffer转换 - 平级拆分及嵌套拆分
   *
   * @param {Number} index       - 索引
   * @param {Buffer} buffer      - buffer
   * @param {Array} [params=[]]  - 参数
   * @return {Array}  转换结果
   * @memberof Parser
   */
  getFunctionPayloadInfo(index, buffer, params = []) {
    const bufferLength = buffer.length;
    while (index + this[THING_FIXED_PAYLOAD_LENGTH] <= bufferLength) {
      const functionBuffer = buffer.slice(index, index + this[THING_FUNCTION_LENGTH]);
      const functionInfo = this.getFunctionInfo(functionBuffer);
      let value = null;
      let valueBuffer = null;
      let valueLength = functionInfo.valueLength;
      index += this[THING_FUNCTION_LENGTH];
      // 判断是否包含功能点值
      if (bufferLength > 2) {
        if (!valueLength) {
          const valueLengthInfo = this.getValueLength(index, buffer);
          valueLength = valueLengthInfo.valueLength;
          index += valueLengthInfo.valuePrefixLength;
        }
        if (index + valueLength <= bufferLength) {
          valueBuffer = buffer.slice(index, index + valueLength); // 功能点值buffer
          index += valueLength;
          value = this.transformTlvToObject(functionInfo, valueBuffer);
        }
      }
      const param = Object.assign({}, functionInfo, {
        value,
      });
      if (functionInfo.resourceType === 'combine') {
        param.value = this.getFunctionPayloadInfo(0, valueBuffer);
      }
      params.push(param);
    }
    return params;
  }

  /**
   * 获取网关子设备数据分割标识
   *
   * @param {Number} code - 操作码
   * @memberof Parser
   */
  getSubDeviceDivisionNumber(code) {
    let number = null;
    if ([ 0x7f, 0x7e, 0x64, 0x65 ].includes(code)) number = 2;
    if ([ 0x62, 0x63, 0x41, 0xc2 ].includes(code)) number = 3;
    return number;
  }

  /**
   * 子设备功能点数据信息
   *
   * @param {Number} code                - 子设备操作码
   * @param {Number} index               - 索引
   * @param {Buffer} buffer              - buffer
   * @return {Array}  转换结果
   * @memberof Parser
   */
  getSubDeviceInfo(code, index, buffer) {
    const number = this.getSubDeviceDivisionNumber(code);
    if (number) return this.getSubDeviceCustomPayloadInfo(index, buffer, number, code);
    return this.getSubDevicePayloadInfo(index, buffer);
  }

  /**
   * 子设备普通及自定义功能点信息
   *
   * @param {Number} index     - 索引
   * @param {Buffer} buffer    - payload buffer
   * @memberof Parser
   */
  getSubDevicePayloadInfo(index, buffer) {
    const params = this.getFunctionPayloadInfo(index, buffer);
    const dividedParams = [];
    let newGroup = {};
    const paramsLength = params.length;
    const defaultTime = Date.now().toString();
    params.forEach((item, index) => {
      const {
        functionId,
      } = item;
      item.time = defaultTime;
      const isLastItem = index + 1 === paramsLength;
      const isPidLabel = functionId === 0xe801 && index !== 0;
      const isTimeLabel = functionId === 0xe803;
      if (isPidLabel) {
        dividedParams.push(newGroup);
        newGroup = {};
      }
      newGroup[functionId] = item;
      if (isTimeLabel) {
        const lastFunctionId = params[index - 1].functionId;
        newGroup[lastFunctionId].time = item.value;
        delete newGroup[functionId];
      }
      if (isLastItem) dividedParams.push(newGroup);
    });
    return dividedParams;
  }

  /**
   * 子设备自定义功能点信息
   *
   * @param {Number} index       - 索引
   * @param {Buffer} buffer      - buffer
   * @param {Number} number      - 分割标识
   * @param {Number} code        - 操作码
   * @return {Array}  转换结果
   * @memberof Parser
   */
  getSubDeviceCustomPayloadInfo(index, buffer, number, code) {
    const bufferLength = buffer.length;
    const params = [];
    let subDeviceInfo = {};
    let count = 0;
    while (index + this[THING_FIXED_PAYLOAD_LENGTH] <= bufferLength) {
      count++;
      let value = null;
      let valueBuffer = null;
      let valueLength = null;
      const isSubDeviceRequest = count === number && [ 0x41, 0xc2 ].includes(code);
      const functionId = buffer.slice(index, index + this[THING_FUNCTION_LENGTH]).readUInt16BE();
      index += this[THING_FUNCTION_LENGTH];
      if (!isSubDeviceRequest) {
        const valueLengthInfo = this.getValueLength(index, buffer);
        valueLength = valueLengthInfo.valueLength;
        index += valueLengthInfo.valuePrefixLength;
        if (index + valueLength <= bufferLength) {
          valueBuffer = buffer.slice(index, index + valueLength);
          index += valueLength;
          value = this.transformTlvToObject({
            dataType: 'string',
          }, valueBuffer);
        }
      }
      subDeviceInfo[functionId] = value;
      if (count === number) {
        params.push(subDeviceInfo);
        count = 0;
        subDeviceInfo = {};
      }
    }
    return params;
  }
  /**
   * method值转操作码
   *
   * @param {Number} data - method值
   * @return {String} code
   * @memberof Parser
   */
  getOperationInfo(data) {
    const operation = data > 127 ? 'response' : 'request';
    const type = (data & 0x40) > 0 ? 'subDevice' : 'device'; // eslint-disable-line
    const target = (data & 0x20) > 0 ? 'system' : 'resource'; // eslint-disable-line
    const methodCode = data & 0x1f; // eslint-disable-line
    const method = target === 'system' ? this.getSystemMethod(methodCode) : this.getResourceMethod(methodCode);
    return {
      code: data,
      method,
      target,
      type,
      operation,
    };
  }

  /**
   * 获取资源操作的操作码
   *
   * @param {Number} methodCode - 操作码
   * @return {String} - 操作值
   * @memberof Parser
   */
  getResourceMethod(methodCode) {
    let method = null;
    switch (methodCode) {
      case 0x01:
        method = 'read';
        break;
      case 0x02:
        method = 'write';
        break;
      default:
        method = 'notify';
        break;
    }
    return method;
  }

  /**
   * 获取系统操作的操作码
   *
   * @param {Number} methodCode - 操作码
   * @return {String} - 操作值
   * @memberof Parser
   */
  getSystemMethod(methodCode) {
    let method = null;
    switch (methodCode) {
      case 0x00:
        method = 'reset';
        break;
      case 0x01:
        method = 'recovery';
        break;
      case 0x03:
        method = 'deregister';
        break;
      case 0x04:
        method = 'enable';
        break;
      case 0x05:
        method = 'disable';
        break;
      case 0x06:
        method = 'label';
        break;
      case 0x07:
        method = 'upgrade';
        break;
      case 0x1f:
        method = 'online';
        break;
      case 0x1e:
        method = 'offline';
        break;
      case 0x1d:
        method = 'deleteTopology';
        break;
      default:
        method = 'register';
        break;
    }
    return method;
  }

  /**
   * 获取功能点信息
   *
   * @param {Buffer} buffer - 功能点buffer
   * @return {Object} 解析结果
   * @memberof Parser
   */
  getFunctionInfo(buffer) {
    const functionId = buffer.readUInt16BE();
    const dataType = this.getDataType((functionId >> 13) & 7); // eslint-disable-line
    const messageType = this.getFunctionType((functionId >> 11) & 3); // eslint-disable-line
    // 0000011111111111 => 2047
    const resourceId = functionId & 2047; // eslint-disable-line
    let resourceType = null;
    if ([ 'property', 'event', 'reserve' ].includes(messageType)) {
      if (resourceId >= 0x500 && resourceId <= 0x6ff) {
        resourceType = 'combine';
      } else if (resourceId >= 0x700 && resourceId <= 0x7ff) {
        resourceType = 'static';
      } else {
        resourceType = 'common';
      }
    }

    return {
      ...dataType,
      messageType,
      resourceId,
      resourceType,
      functionId,
    };
  }

  /**
   * 功能点值转换
   *
   * @param {Object} functionInfo        - 功能点信息
   * @param {Buffer} functionValueBuffer - 功能点值buffer
   * @return {Object} - 功能点值对象
   * @memberof Parser
   */
  transformTlvToObject(functionInfo, functionValueBuffer) {
    let {
      dataType,
      messageType,
    } = functionInfo;
    if (messageType === 'event' && dataType === 'string') dataType = 'json';
    return this.app.thing.tlv.transfer[dataType].binaryToType(
      functionValueBuffer
    );
  }

  /**
   * type值转类型码
   *
   * @param {Number} dataTypeCode - type number
   * @return {String} 类型值
   * @memberof Parser
   */
  getDataType(dataTypeCode) {
    thingAssert(dataTypeCode !== 0, '[Parser][getDataType] - 数据错误，类型不能为0', 400);
    let dataType = null;
    let valueLength = null;
    switch (dataTypeCode) {
      case 1:
        dataType = 'boolean';
        valueLength = 1;
        break;
      case 2:
        dataType = 'enum';
        valueLength = 1;
        break;
      case 3:
        dataType = 'integer';
        valueLength = 4;
        break;
      case 4:
        dataType = 'float';
        valueLength = 4;
        break;
      case 5:
        dataType = 'buffer';
        break;
      case 6:
        dataType = 'exception';
        valueLength = 4;
        break;
      case 7:
        dataType = 'string';
        break;
      default:
        dataType = 'reserve';
    }
    return {
      dataType,
      valueLength,
    };
  }

  /**
   * 功能点类型解析
   *
   * @param {Number} functionTypeCode - 功能点类型码
   * @return {String} - 功能点类型
   * @memberof Parser
   */
  getFunctionType(functionTypeCode) {
    let code;
    switch (functionTypeCode) {
      case 0:
        code = 'reserve';
        break;
      case 1:
        code = 'custom';
        break;
      case 3:
        code = 'event';
        break;
      default:
        code = 'property';
        break;
    }
    return code;
  }

  /**
   * 输出标注解析结果
   *
   * @param {Object} data - 解析后的原始数据
   * @return {Object} - 解析后的标准数据
   * @memberof Parser
   */
  getUnifiedResponse(data) {
    const {
      code,
      id,
      operations,
      params: paramsList,
      version,
    } = data;
    const isSubDevice = operations.type === 'subDevice';
    let groupId = null;
    let params = isSubDevice ? paramsList : {};
    if (paramsList.length && !isSubDevice) {
      paramsList.forEach(param => {
        let targetValue = {};
        const {
          resourceType,
          dataType,
          messageType,
          resourceId,
          functionId,
          value,
        } = param;
        if (resourceType === 'combine') {
          groupId = functionId;
          value && value.forEach(item => {
            targetValue[item.functionId] = {
              value: item.value,
              type: item.dataType,
              message: item.messageType,
              resource: item.resourceType,
              resourceId: item.resourceId,
            };
          });
        } else targetValue = value;
        params[functionId] = {
          value: targetValue,
          type: dataType,
          message: messageType,
          ...(resourceType ? {
            resource: resourceType,
          } :
            null),
          resourceId,
        };
      });
    }
    if ([ 0x43, 0xc1 ].includes(operations.code)) {
      params = paramsList.map(param => {
        Reflect.ownKeys(param).forEach(key => {
          let targetValue = {};
          const {
            resourceType,
            value,
          } = param[key];
          if (resourceType === 'combine') {
            value && value.forEach(item => {
              targetValue[item.functionId] = item;
            });
          } else targetValue = value;
          param[key].value = targetValue;
        });
        return param;
      });
    }
    return {
      version: `${version}.0.0`,
      ...(id ? {
        id,
      } : null),
      operations,
      ...(code >= 0 ? {
        code,
      } : null),
      time: Date.now(),
      data: {
        ...(groupId ? {
          groupId,
        } : null),
        ...(!_.isEmpty(params) ? {
          params,
        } : null),
      },
    };
  }
}

module.exports = Parser;
