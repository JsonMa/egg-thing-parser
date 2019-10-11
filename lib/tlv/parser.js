'use strict';

const thingAssert = require('thing-assert');
const DATA_TYPES = [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string', 'json' ];
const TLV_METHOD_LENGTH = Symbol('TLV#MethodLength');
const TLV_FUNCTION_LENGTH = Symbol('TLV#FunctionLength');
const TLV_VALUE_FIXED_LENGTH = Symbol('TLV#ValueFixedLength');
const TLV_CRC_LENGTH = Symbol('TLV#CRCLength');
const TLV_FIXED_PAYLOAD_LENGTH = Symbol('TLV#FixedPayloadLength');
const TLV_VERSION_LENGTH = Symbol('TLV#VersionLength');
const TLV_MSGID_LENGTH = Symbol('TLV#MsgIdLength');
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
    this[TLV_VERSION_LENGTH] = 1; // 1字节版本号
    this[TLV_MSGID_LENGTH] = 4; // 4字节消息id
    this[TLV_METHOD_LENGTH] = 1; // 1字节操作码
    this[TLV_FUNCTION_LENGTH] = 2; // 2字节功能点
    this[TLV_VALUE_FIXED_LENGTH] = 1; // 1字节功能值长度
    this[TLV_FIXED_PAYLOAD_LENGTH] = this[TLV_FUNCTION_LENGTH]; // 2字节(功能点+值组合的最小长度)
    this[TLV_CRC_LENGTH] = 2; // 2字节校验位
  }

  /**
   * tlv数据解析为json：TLV => [{ type: 1, value: buffer value } ...]
   *
   * @param {Buffer} data      - Buffer data
   * @return {Array} buffer数组 - [{type:1, value: buffer value} ...]
   */
  parse(data) {
    thingAssert(Buffer.isBuffer(data), `[Parser][parse] - tlv数据解析错误：data非buffer类型: ${data}`, 400);
    return this.packageSplit(data);
  }

  /**
   * [{type: 1, value: buffer value}] => [{type: 1, value: true value}]
   *
   * @param {Array} data - [{type: number, value: array buffer} ...]
   * @return {Array}  [{type: number, value: true value} ...]
   */
  binaryConvert(data) {
    thingAssert(Array.isArray(data), `[Parser][binaryConvert] - 参数类型错误：data: ${data}`, 400);
    return data.map(item => {
      thingAssert(item.type && item.value, `[Parser][binaryConvert] - 参数错误，item：${item}`, 400);
      thingAssert(
        item.type <= DATA_TYPES.length,
        `[Parser][binaryConvert] - 数据类型错误：type：${item.type}`, 400
      );

      return this.app.tlv.transfer[DATA_TYPES[item.type - 1]].binaryToType(item.value);
    });
  }

  /**
   * TV二进制包拆分,生成TV数组
   *
   * @param {Buffer} buffer - Buffer数据
   * @return {Array} --[Buffer, Buffer]
   */
  packageSplit(buffer) {
    let id = 0; // 消息id
    // 数据长度基准校验
    thingAssert(buffer.length, '[Parser][packageSplit] - 数据错误，长度不能为0', 401);

    // 版本号校验
    const versionVal = buffer.readUIntBE(0, this[TLV_VERSION_LENGTH]); // 获取取操作码
    thingAssert(versionVal !== 0 && versionVal !== 128, '[Parser][packageSplit] - 版本号不能为0', 400);

    // 数据长度合法校验
    const hasMsgId = versionVal > 128; // 是否包含消息id
    const methodValue = buffer.readUInt8(hasMsgId ? this[TLV_MSGID_LENGTH] + this[TLV_VERSION_LENGTH] : this[TLV_VERSION_LENGTH]); // 获取取操作码
    const isDwonResp = methodValue >= 0x60;
    const bufferLength = buffer.length;
    let requiredLength = 7; // 不含消息id的长度要求
    if (hasMsgId) requiredLength = isDwonResp ? 6 : 11;
    thingAssert(bufferLength >= requiredLength, `[Parser][packageSplit] - 数据错误，长度至少需要${requiredLength}个字节，当前数据长度: ${bufferLength}`, 401);

    // CRC校验
    const crcPayload = buffer.readUInt16BE(bufferLength - 2);
    const payload = buffer.slice(0, bufferLength - 2);
    const crcCode = this.app.thing.crc.getCrc16(payload);
    thingAssert(crcCode === crcPayload, `[Parser][packageSplit] - 数据错误, CRC校验失败, 预期:${crcPayload}, 实际:${crcCode}`, 402);

    if (hasMsgId) id = buffer.readUInt32BE(this[TLV_VERSION_LENGTH]); // 获取合法的消息id
    try {
      const version = !hasMsgId ? versionVal : versionVal - 128; // 获取真实版本号
      const {
        method,
        code,
      } = this.methodConvert(methodValue); // 获取原始code及对应的method
      buffer = buffer.slice(this[TLV_VERSION_LENGTH] + this[TLV_METHOD_LENGTH] + (hasMsgId ? this[TLV_MSGID_LENGTH] : 0), bufferLength - 2); // 获取buffer payload
      const index = 0; // 解析索引
      const params = buffer.length ? this.bufferConvert(index, buffer) : null;
      return this.unifyResponse({
        version,
        method,
        code,
        params,
        id,
      });
    } catch (error) {
      error.msgId = id;
      throw error;
    }
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
  bufferConvert(index, buffer, params = []) {
    const bufferLength = buffer.length;
    while (index + this[TLV_FIXED_PAYLOAD_LENGTH] <= bufferLength) {
      const functionBuffer = buffer.slice(index, index + this[TLV_FUNCTION_LENGTH]);
      const functionInfo = this.functionConvert(functionBuffer);
      let valueLength = functionInfo.valueLength;
      let valuePrefixLength = null;
      // 获取value 长度
      if (!valueLength) {
        const bigLength = buffer.readUInt8(index + 2); // 获取第一个字节大小
        if (bigLength > 63 && bigLength <= 127) { // eslint-disable-line
          valuePrefixLength = 2;
          valueLength = buffer.readUInt16BE(index + this[TLV_FIXED_PAYLOAD_LENGTH]) - 16384; // 截取最高位01
        } else if (bigLength > 127 && bigLength <= 191) {
          valuePrefixLength = 3;
          valueLength = buffer.readUIntBE(index + 2, 3) - 8388608; // 截取最高位10
        } else if (bigLength > 191) {
          valuePrefixLength = 4;
          valueLength = buffer.readUInt32BE(index + this[TLV_FIXED_PAYLOAD_LENGTH]) - 3221225472; // 截取最高位10
        } else {
          valueLength = bigLength;
          valuePrefixLength = 1;
        }
      }
      let valueBuffer = null;
      index += functionInfo.valueLength ?
        this[TLV_FIXED_PAYLOAD_LENGTH] :
        this[TLV_FIXED_PAYLOAD_LENGTH] + valuePrefixLength;
      if (index + valueLength <= bufferLength) {
        valueBuffer = buffer.slice(index, index + valueLength); // 功能点值buffer
        index += valueLength;
      }
      const value = this.valueConvert(functionInfo, valueBuffer);
      const param = Object.assign({}, functionInfo, {
        value,
      });
      const isCombine = functionInfo.resourceType === 'combine';
      if (isCombine) {
        param.value = this.bufferConvert(0, valueBuffer);
      }
      params.push(param);
    }
    return params;
  }

  /**
   * method值转操作码
   *
   * @param {Number} number - method值
   * @return {String} code
   * @memberof Parser
   */
  methodConvert(number) {
    let method;
    const code = number;
    switch (number) {
      case 0x01:
        method = 'read';
        break;
      case 0x02:
        method = 'write';
        break;
      case 0x03:
        method = 'notify';
        break;
      case 0x04:
        method = 'reset';
        break;
      case 0x05:
        method = 'recovery';
        break;
      default:
        method = 'resp';
        break;
    }
    return {
      method,
      code,
    };
  }

  /**
   * 功能点buffer解析
   *
   * @param {Buffer} buffer - 功能点buffer
   * @return {Object} 解析结果
   * @memberof Parser
   */
  functionConvert(buffer) {
    const functionValue = buffer.readUInt16BE();
    const dataType = this.dataTypeConvert((functionValue >> 13) & 7) // eslint-disable-line
    const messageType = this.messageTypeConvert((functionValue >> 11) & 3) // eslint-disable-line
    const resourceId = functionValue & parseInt('0000011111111111', 2) // eslint-disable-line
    let resourceType = null;
    // 获取resource类型
    if (resourceId >= 0x500 && resourceId <= 0x6ff) {
      resourceType = 'combine';
    } else if (resourceId >= 0x700 && resourceId <= 0x7ff) {
      resourceType = 'static';
    } else {
      resourceType = 'common';
    }
    return {
      ...dataType,
      messageType,
      resourceId,
      resourceType,
      functionValue,
    };
  }

  valueConvert(functionInfo, buffer) {
    const {
      dataType,
    } = functionInfo;
    return this.app.thing.tlv.transfer[dataType].binaryToType(buffer);
  }

  /**
   * type值转类型码
   *
   * @param {Number} number - type number
   * @return {String} 类型值
   * @memberof Parser
   */
  dataTypeConvert(number) {
    let dataType = null;
    let valueLength = null;
    switch (number) {
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
        throw new Error(`[Parser][dataTypeConvert] - 数据类型错误，无法识别的类型：${number}`);
    }
    return {
      dataType,
      valueLength,
    };
  }

  messageTypeConvert(number) {
    thingAssert(
      number <= 3,
      `[Parser][messageTypeConvert] - 消息类型错误，长度超出2位，number: ${number}`,
      400
    );
    let code;
    switch (number) {
      case 1:
        code = 'device';
        break;
      case 2:
        code = 'property';
        break;
      case 3:
        code = 'event';
        break;
      default:
        code = 'system';
        break;
    }
    return code;
  }

  unifyResponse(data) {
    const params = {};
    let groupId = null;
    if (data.params) {
      data.params.forEach(param => {
        let value = {};
        if (param.resourceType === 'combine') {
          groupId = param.functionValue;
          param.value.forEach(item => {
            value[item.functionValue] = {
              value: item.value,
              type: item.dataType,
              messageType: item.messageType,
              resource: item.resourceType,
            };
          });
        } else {
          value = param.value;
        }
        params[param.functionValue] = {
          value,
          type: param.dataType,
          message: param.messageType,
          resource: param.resourceType,
        };
      });
    }
    return {
      version: `${data.version}.0.0`,
      data: {
        method: data.method,
        ...(data.code ? {
          code: data.code,
        } : null),
        ...(groupId ? {
          groupId,
        } : null),
        ...(!_.isEmpty(params) ? {
          params,
        } : null),
        ...(data.id ? {
          id: data.id,
        } : null),
      },
      time: Date.now(),
    };
  }
}

module.exports = Parser;
