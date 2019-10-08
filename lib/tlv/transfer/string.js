'use strict';

const BaseTransfer = require('./baseTransfer');
const thingAssert = require('thing-assert');

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
    thingAssert(Buffer.isBuffer(binary), `[StringParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`, 400);
    thingAssert(binary.length <= 0x3fffffff, `[StringParse][binaryToType] - 数据错误，长度需<=0x3fffffff字节，实际为: ${binary.length}`, 400);

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
    thingAssert(typeof value === 'string', `[StringParse][typeToBinary] - 数据类型错误，需要为"string"，实际为：${typeof value}`, 400);

    const valueBuffer = Buffer.from(value, encoding);
    let perfixBuffer = null;
    const bufferLength = valueBuffer.length;
    thingAssert(bufferLength <= 0x3fffffff, `[StringParse][typeToBinary] - 数值错误，需要<=0x3fffffff字节"，实际为：${value.length}`, 400);
    if (bufferLength > 63 && bufferLength <= 16383) { // eslint-disable-line
      perfixBuffer = Buffer.allocUnsafe(2);
      perfixBuffer.writeUInt16BE(bufferLength + 16384);
    } else if (bufferLength > 16383 && bufferLength <= 4194303) {
      const totalLength = bufferLength + 8388608;
      const firstByte = (totalLength & 0xff0000) >> 16; // eslint-disable-line
      const lastBytes = totalLength & 0x00ffff; // eslint-disable-line
      perfixBuffer = Buffer.allocUnsafe(3);
      perfixBuffer.writeUInt8(firstByte, 0);
      perfixBuffer.writeUInt16BE(lastBytes, 1);
    } else if (bufferLength > 4194303) {
      perfixBuffer = Buffer.allocUnsafe(4);
      perfixBuffer.writeUInt32BE(bufferLength + 3221225472);
    } else {
      perfixBuffer = Buffer.allocUnsafe(1);
      perfixBuffer.writeUInt8(bufferLength);
    }
    return Buffer.concat([ perfixBuffer, valueBuffer ], bufferLength + perfixBuffer.length);
  }
}

module.exports = StringParse;
