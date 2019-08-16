'use strict';

const assert = require('assert');
const CONVERT = ['boolean', 'enum', 'integer', 'float', 'buffer', 'exception', 'string', 'json'];

/**
 * @class Parser
 */
class Parser {
  /**
   *Creates an instance of Formatter.
   *
   * @param {Object} app - egg application
   * @memberof Formatter
   */
  constructor(app) {
    this.app = app;
    this.index = 'FORMARTTER';
  }

  /**
   * TLV buffer => [{ type: 1, value: buffer value } ...]
   *
   * @param {Buffer} data      - Buffer data
   * @param {Number} fixType   - 类型字节数
   * @param {Number} fixLength - 长度字节数
   * @return {Array} buffer数组 - [{type:1, value: buffer value} ...]
   */
  parse(data, fixType = 1, fixLength = 2) {
    const fix = fixType + fixLength;
    const bufferArr = [];
    let offset = 0;

    assert(Buffer.isBuffer(data), `[Formatter][tlvSplit] - 参数错误：data: ${data}`);
    const size = data.length;

    while (offset + fix <= size) {
      const type = data.readUIntLE(offset, fixType);
      assert(type <= CONVERT.length, `[Formatter][tlvSplit] - 数据类型错误：type：${type}`);
      const valueLength = data.readUIntLE(offset + fixType, fixLength);
      // 校验valueLength和实际type规定的length是否一致
      offset += fix;
      if ((offset + valueLength) <= size) {
        const valueBuffer = data.slice(offset, offset + valueLength);
        bufferArr.push({
          type,
          value: valueBuffer,
        });
        offset += valueLength;
      }
    }
    return bufferArr;
  }

  /**
   * [{type: 1, value: buffer value}] => [{type: 1, value: true value}]
   *
   * @param {Array} data - [{type: number, value: array buffer} ...]
   * @return {Array}  [{type: number, value: true value} ...]
   */
  binaryConvert(data) {
    assert(Array.isArray(data), `[Formatter][binaryConvert] - 参数类型错误：data: ${data}`);
    return data.map(item => {
      assert(item.type && item.value, `[Formatter][binaryConvert] - 参数错误，item：${item}`);
      assert(item.type <= CONVERT.length, `[Formatter][binaryConvert] - 数据类型错误：type：${item.type}`);

      return this.app.tlv.parser[CONVERT[item.type - 1]].binaryToType(item.value);
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
      assert(item.type && typeof item.value !== 'undefined', `[Formatter][arrayConvert] - 参数错误: type: ${item.type}, value: ${item.value}`);
      const type = item.type.toLowerCase();
      assert(CONVERT.includes(type), `[Formatter][arrayConvert] - 数据类型错误：type: ${type}`);
      const unit = this.app.tlv.parser[type].typeToBinary(item.value);
      length += unit.length;
      return unit;
    });

    return Buffer.concat(bufferArr, length);
  }

  /**
   * @description onenet二进制数据解析
   * @param {Buffer} data - Buffer数据
   * @return {Array}
   *  --[{type,value}, {type,value}]
   */
  binarySplit(data) {
    assert(Buffer.isBuffer(data), `[Formatter][binarySplit] - 参数类型错误：data: ${data}`);
    const fixedType = data.readIntBE(0, 1);
    assert(fixedType === 2, `[Formatter][binarySplit] - OneNET TLV 数据格式错误: data: ${data}`);
    // 固定字段长度
    const fixedLength = data.readIntBE(1, 2);
    // TLV格式字段
    const valueLength = data.readIntBE(3 + fixedLength, 4);
    const valueBuffer = data.slice(7 + fixedLength, 7 + fixedLength + valueLength);
    return this.tlvSplit(valueBuffer);
  }
}

module.exports = Parser;
