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
    assert(Buffer.isBuffer(binary), `[JsonParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`);
    assert(binary.length <= 255, `[JsonParse][binaryToType] - 数据错误，长度需<=255字节，实际为: ${binary.length}`);

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
    assert(typeof value === 'string' || typeof value === 'object', `[JsonParse][typeToBinary] - 数据类型错误，需要为"string或object"，实际为：${typeof value}`);

    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    const valueBuffer = Buffer.from(value, encoding);
    let perfixBuffer = null;
    const bufferLength = valueBuffer.length;
    assert(bufferLength <= 255, `[JsonParse][typeToBinary] - 数值错误，需要<=255字节"，实际为：${value.length}`);
    if (bufferLength > 127) {
      perfixBuffer = Buffer.allocUnsafe(2);
      perfixBuffer.writeUInt16BE(bufferLength & 0xff); // eslint-disable-line
    } else {
      perfixBuffer = Buffer.allocUnsafe(1);
      perfixBuffer.writeUInt8(bufferLength);
    }
    return Buffer.concat([ perfixBuffer, valueBuffer ], bufferLength + perfixBuffer.length);
  }
}

module.exports = JsonParse;
