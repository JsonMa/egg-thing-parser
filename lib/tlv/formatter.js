'use strict';

const assert = require('assert');
const TRANSFER = ['boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string', 'json'];
const TLV_METHOD_LENGTH = Symbol('TLV#MethodLength')
const TLV_FUNCTION_LENGTH = Symbol('TLV#FunctionLength')
const TLV_VALUE_PREFIX_LENGTH = Symbol('TLV#ValuePrefixLength')
const TLV_CRC_LENGTH = Symbol('TLV#CRCLength')
const TLV_FIXED_LENGTH = Symbol('TLV#FixedLength')
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
    this[TLV_FIXED_LENGTH] = 5; // 5字节固定长度数据
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
    const jsonArrays = this.packageSplit(data) // 包拆分为独立的tlv包
    const formatedJson = this.jsonFormater(jsonArrays)
    return formatedJson;
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
      assert(item.type <= TRANSFER.length, `[Parser][binaryConvert] - 数据类型错误：type：${item.type}`);

      return this.app.tlv.transfer[TRANSFER[item.type - 1]].binaryToType(item.value);
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
      assert(CONVERT.includes(type), `[Parser][arrayConvert] - 数据类型错误：type: ${type}`);
      const unit = this.app.tlv.parser[type].typeToBinary(item.value);
      length += unit.length;
      return unit;
    });

    return Buffer.concat(bufferArr, length);
  }

  /**
   * tv二进制包拆分,生成tv数组
   *
   * @param {Buffer} data - Buffer数据
   * @return {Array} --[Buffer, Buffer]
   */
  packageSplit(data) {
    let index = 0; // 指针
    const dataLength = data.length;
    const jsonArray = [];
    while (index + this[TLV_FIXED_LENGTH] <= dataLength) {
      const methodValue = data.readUIntBE(index, index + this[TLV_METHOD_LENGTH])
      const functionBuffer = data.slice(index + this[TLV_METHOD_LENGTH], index + this[TLV_METHOD_LENGTH] + this[TLV_FUNCTION_LENGTH])
      const valueLength = data.readUIntBE(index + this[TLV_FIXED_LENGTH], this[TLV_VALUE_PREFIX_LENGTH]);
      let valueBuffer = null
      index += this[TLV_FIXED_LENGTH];
      if (index + valueLength <= size) {
        valueBuffer = data.slice(index, index + valueLength);
        index += valueLength;
      }
      jsonArray.push({
        method: this.methodConvert(methodValue),
        ...functionConvert(functionBuffer)
      })
    }

    const fixedType = data.readIntBE(0, 1);
    assert(fixedType === 2, `[Parser][binarySplit] - OneNET TLV 数据格式错误: data: ${data}`);
    // 固定字段长度
    const fixedLength = data.readIntBE(1, 2);
    // TLV格式字段
    const valueLength = data.readIntBE(3 + fixedLength, 4);
    const valueBuffer = data.slice(7 + fixedLength, 7 + fixedLength + valueLength);
    return this.tlvSplit(valueBuffer);
  }

  /**
   * method值转操作码
   *
   * @param {Number} number
   * @return {String} code
   * @memberof Parser
   */
  methodConvert(number) {
    assert(number <= 255, `[Parser][methodConvert] - 操作码错误，长度超出1个字节number: ${number}`)
    let code
    switch (number) {
      case 0x01:
        code = 'read'
        break;
      case 0x02:
        code = 'write'
        break;
      case 0x03:
        code = 'notify'
        break;
      case 0x04:
        code = 'reset'
        break;
      case 0x05:
        code = 'recovery'
        break;
      default:
        code = 'resp'
        break;
    }
    return code
  }

  /**
   * 功能点buffer解析
   *
   * @param {Buffer} buffer - 功能点buffer
   * @return {Object} 解析结果
   * @memberof Parser
   */
  functionConvert(buffer) {
    const type = this.typeConvert(Buffer.readUIntBE(buffer) & 57344)
  }

  /**
   * type值转类型码
   *
   * @param {Number} number - type number
   * @return {String} 类型值
   * @memberof Parser
   */
  typeConvert(number) {
    assert(number <= 7, `[Parser][typeConvert] - 数据类型错误，长度超出3位，number: ${number}`)

    let code
    switch (number) {
      case 0:
        code = 'boolean'
        break;
      case 1:
        code = 'enum'
        break;
      case 2:
        code = 'integer'
        break;
      case 3:
        code = 'float'
        break;
      case 4:
        code = 'buffer'
        break;
      case 5:
        code = 'exception'
        break;
      case 6:
        code = 'string'
        break;
      default:
        code = 'retain'
        break;
    }
    return code
  }
}

module.exports = Parser;
