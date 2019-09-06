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
    assert(Buffer.isBuffer(binary), `[StringParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`);
    assert(binary.length <= 255, `[StringParse][binaryToType] - 数据错误，长度需<=255字节，实际为: ${binary.length}`);

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
    assert(typeof value === 'string', `[StringParse][typeToBinary] - 数据类型错误，需要为"string"，实际为：${typeof value}`);

    const valueBuffer = Buffer.from(value, encoding);
    let perfixBuffer = null;
    const bufferLength = valueBuffer.length;
    assert(bufferLength <= 255, `[StringParse][typeToBinary] - 数值错误，需要<=255字节"，实际为：${value.length}`);
    if (bufferLength > 127) {
      perfixBuffer = Buffer.allocUnsafe(2);
      perfixBuffer.writeUInt16BE(bufferLength + 32768);
    } else {
      perfixBuffer = Buffer.allocUnsafe(1);
      perfixBuffer.writeUInt8(bufferLength);
    }
    return Buffer.concat([ perfixBuffer, valueBuffer ], bufferLength + perfixBuffer.length);
  }
}

module.exports = StringParse;
