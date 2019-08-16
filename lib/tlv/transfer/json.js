'use strict';

const BaseTransfer = require('./baseTransfer');
const assert = require('assert');

/**
 * Json parser class
 *
 * @class JsonParse
 * @extends {BaseTransfer}
 */
class JsonParse extends BaseTransfer {
  /**
   *Creates an instance of JsonParse.
   * @memberof JsonParse
   */
  constructor() {
    super('JSON');
  }

  /**
   * json buffer => json value
   *
   * @param {Buffer} binary             - string buffer
   * @return {string} 字符串输出
   * @memberof JsonParse
   */
  binaryToType(binary) {
    assert(Buffer.isBuffer(binary), `[JsonParse][binaryToType] - 类型错误binary: ${binary}`);
    assert(binary.length <= 255, `[JsonParse][binaryToType] - 长度超过255字节，binary length: ${binary.length}`);

    const str = binary.toString();
    try {
      const a = JSON.parse(str);
      return a;
    } catch (e) {
      throw new Error(`[JsonParse][binaryToType] - 参数错误binary attributes: ${str}`);
    }
  }

  /**
   * string/buffer/json => tlv json
   *
   * @param {string|Object|Buffer} value     - json value
   * @param {string} [encoding='utf8']       - 编码方式
   * @return {binary} tlv buffer
   * @memberof JsonParse
   */
  typeToBinary(value, encoding = 'utf8') {
    assert(typeof value === 'string' || Buffer.isBuffer(value) || typeof value === 'object', `[JsonParse][typeToBinary] - 类型错误value: ${value}`);

    let valueBuffer;
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    if (typeof value === 'string') {
      valueBuffer = Buffer.from(value, encoding);
    }

    return this.tlvPackage({
      index: this.index,
      value: valueBuffer,
    });
  }
}

module.exports = JsonParse;
