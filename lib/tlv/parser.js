'use strict';

const assert = require('assert');
const DATA_TYPES = [ 'boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string', 'json' ];
const TLV_METHOD_LENGTH = Symbol('TLV#MethodLength');
const TLV_FUNCTION_LENGTH = Symbol('TLV#FunctionLength');
const TLV_VALUE_PREFIX_LENGTH = Symbol('TLV#ValuePrefixLength');
const TLV_CRC_LENGTH = Symbol('TLV#CRCLength');
const TLV_FIXED_LENGTH = Symbol('TLV#FixedLength');
const TLV_VERSION_LENGTH = Symbol('TLV#VersionLength');

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
    this[TLV_METHOD_LENGTH] = 1; // 1字节操作码
    this[TLV_FUNCTION_LENGTH] = 2; // 2字节功能点
    this[TLV_VALUE_PREFIX_LENGTH] = 2; // 2字节功能值前缀
    this[TLV_CRC_LENGTH] = 2; // 2字节校验位
    this[TLV_FIXED_LENGTH] = this[TLV_FUNCTION_LENGTH]; // 2字节固定长度数据
    this[TLV_VERSION_LENGTH] = 1; // 1字节版本号
  }

  /**
   * tlv数据解析为json：TLV => [{ type: 1, value: buffer value } ...]
   *
   * @param {Buffer} data      - Buffer data
   * @return {Array} buffer数组 - [{type:1, value: buffer value} ...]
   */
  parse(data) {
    assert(Buffer.isBuffer(data), `[Parser][parse] - tlv数据解析错误：data非buffer类型: ${data}`);

    // TODO crc校验
    return this.packageSplit(data);
  }

  /**
   * [{type: 1, value: buffer value}] => [{type: 1, value: true value}]
   *
   * @param {Array} data - [{type: number, value: array buffer} ...]
   * @return {Array}  [{type: number, value: true value} ...]
   */
  binaryConvert(data) {
    assert(Array.isArray(data), `[Parser][binaryConvert] - 参数类型错误：data: ${data}`);
    return data.map(item => {
      assert(item.type && item.value, `[Parser][binaryConvert] - 参数错误，item：${item}`);
      assert(item.type <= DATA_TYPES.length, `[Parser][binaryConvert] - 数据类型错误：type：${item.type}`);

      return this.app.tlv.transfer[DATA_TYPES[item.type - 1]].binaryToType(item.value);
    });
  }

  /**
   * 通用数据解析array => tlv
   *
   * @param {array} data - [{type: BOOLEAN, value: JSON.stringify(true)}]
   * @return {buffer}  二进制数据
   */
  arrayConvert(data) {
    let bufferArr = Buffer.alloc(0);
    let length = 0;

    bufferArr = data.map(item => {
      assert(item.type && typeof item.value !== 'undefined', `[Parser][arrayConvert] - 参数错误: type: ${item.type}, value: ${item.value}`);
      const type = item.type.toLowerCase();
      assert(DATA_TYPES.includes(type), `[Parser][arrayConvert] - 数据类型错误：type: ${type}`);
      const unit = this.app.tlv.parser[type].typeToBinary(item.value);
      length += unit.length;
      return unit;
    });

    return Buffer.concat(bufferArr, length);
  }

  /**
   * tv二进制包拆分,生成tv数组
   *
   * @param {Buffer} buffer - Buffer数据
   * @return {Array} --[Buffer, Buffer]
   */
  packageSplit(buffer) {
    const version = buffer.readUIntBE(0, this[TLV_VERSION_LENGTH]); // 获取取操作码
    const methodValue = buffer.readUIntBE(this[TLV_METHOD_LENGTH], this[TLV_METHOD_LENGTH]); // 获取取操作码
    const method = this.methodConvert(methodValue);
    const bufferLength = buffer.length;
    buffer = buffer.slice(this[TLV_METHOD_LENGTH] + this[TLV_VERSION_LENGTH], bufferLength - 2); // 获取buffer payload
    const index = 0; // 解析索引
    const params = this.bufferConvert(index, buffer);
    // jsonArray处理
    return this.unifyResponse({
      version,
      method,
      params,
    });
  }

  /**
   * buffer转换 - 平级拆分及嵌套拆分
   *
   * @param {Number} index       - 索引
   * @param {Buffer} buffer      - buffer
   * @param {Array} [params=[]]  - 参数
   * @param {Boolean} isCombine  - 是否为组合数据
   * @return {Array}  转换结果
   * @memberof Parser
   */
  bufferConvert(index, buffer, params = [], isCombine = false) {
    const bufferLength = buffer.length;
    let combine = null;
    while (index + this[TLV_FIXED_LENGTH] <= bufferLength) {
      const functionBuffer = buffer.slice(index, index + this[TLV_FUNCTION_LENGTH]);
      const functionInfo = this.functionConvert(functionBuffer);
      const valueLength = functionInfo.valueLength || buffer.readUIntBE(index + this[TLV_FIXED_LENGTH], this[TLV_VALUE_PREFIX_LENGTH]);
      let valueBuffer = null;
      index += functionInfo.valueLength ? this[TLV_FIXED_LENGTH] : this[TLV_FIXED_LENGTH] + this[TLV_VALUE_PREFIX_LENGTH];
      if (index + valueLength <= bufferLength) {
        valueBuffer = buffer.slice(index, index + valueLength); // 功能点值buffer
        index += valueLength;
      }
      const value = this.valueConvert(functionInfo, valueBuffer);
      const param = Object.assign({}, functionInfo, {
        value,
      });
      isCombine = functionInfo.resourceType === 'combine';
      if (isCombine) {
        param.value = this.bufferConvert(0, valueBuffer, params);
        combine = param;
      } else {
        params.push(param);
      }
    }
    return isCombine ? combine : params;
  }

  /**
   * method值转操作码
   *
   * @param {Number} number - method值
   * @return {String} code
   * @memberof Parser
   */
  methodConvert(number) {
    assert(number <= 255, `[Parser][methodConvert] - 操作码错误，长度超出1个字节number: ${number}`);
    let code;
    switch (number) {
      case 0x01:
        code = 'read';
        break;
      case 0x02:
        code = 'write';
        break;
      case 0x03:
        code = 'notify';
        break;
      case 0x04:
        code = 'reset';
        break;
      case 0x05:
        code = 'recovery';
        break;
      default:
        code = 'resp';
        break;
    }
    return code;
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
    const dataType = this.dataTypeConvert(functionValue >> 13 & 7); // eslint-disable-line
    const messageType = this.messageTypeConvert(functionValue >> 11 & 3); // eslint-disable-line
    const resourceId = functionValue & parseInt('0000011111111111', 2); // eslint-disable-line
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
    assert(number <= 7, `[Parser][messageTypeConvert] - 数据类型错误，长度超出3位，number: ${number}`);

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
        dataType = 'retain';
        break;
    }
    return {
      dataType,
      valueLength,
    };
  }

  messageTypeConvert(number) {
    assert(number <= 3, `[Parser][messageTypeConvert] - 消息类型错误，长度超出2位，number: ${number}`);
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
    data.params.forEach(param => {
      if (!params[param.messageType]) params[param.messageType] = {};
      params[param.messageType][param.resourceId] = {
        value: param.value,
        time: Date.now(),
        type: param.dataType,
        resource: param.resourceType,
      };
    });
    return {
      version: `${data.version}.0.0`,
      method: data.method,
      params,
    };
  }
}

module.exports = Parser;
