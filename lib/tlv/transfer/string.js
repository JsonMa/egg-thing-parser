'use strict';

const BaseTransfer = require('./baseTransfer');
const assert = require('assert');

/**
 * String parser class
 *
 * @class StringParse
 * @extends {BaseTransfer}
 */
class StringParse extends BaseTransfer {
  /**
   *Creates an instance of StringParse.
   * @memberof StringParse
   */
  constructor() {
    super('STRING');
  }

  /**
   * binary转type
   *
   * @param {binary} binary             - 二进制数输入
   * @return {string} 返回字符串
   * @memberof StringParse
   */
  binaryToType(binary) {
    assert(Buffer.isBuffer(binary), `[StringParse][binaryToType] - 类型错误binary: ${binary}`);
    assert(binary.length <= 255, `[StringParse][binaryToType] - 长度超过255字节，binary length: ${binary.length}`);

    return binary.toString();
  }

  /**
   * string value => tlv buffer
   *
   * @param {String|Buffer} value           - string value
   * @param {String} [encoding='utf8']      - encode type
   * @return {Buffer} tlv buffer
   * @memberof StringParse
   */
  typeToBinary(value, encoding = 'utf8') {
    assert(typeof value === 'string' || Buffer.isBuffer(value), `[StringParse][typeToBinary] - 类型错误value: ${value}`);

    let valueBuffer = value;
    if (typeof value === 'string') valueBuffer = Buffer.from(value, encoding);
    assert(valueBuffer.length <= 255, `[StringParse][typeToBinary] - 长度超过255字节，value length: ${value.length}`);

    return this.tlvPackage({
      index: this.index,
      value: valueBuffer,
    });
  }
}

module.exports = StringParse;
