'use strict';

const BaseTransfer = require('./baseTransfer');
const assert = require('assert');

/**
 * Buffer解析类
 *
 * @class BufferParse
 * @extends {BaseTransfer}
 */
class BufferParse extends BaseTransfer {
  /**
   *Creates an instance of BufferParse.
   * @memberof BufferParse
   */
  constructor() {
    super('BUFFER');
  }

  /**
   * value buffer => buffer
   *
   * @param {Buffer} binary - buffer
   * @return {Buffer}       - buffer
   * @memberof BufferParse
   */
  binaryToType(binary) {
    assert(Buffer.isBuffer(binary), `[BufferParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`);
    return binary.toString('hex');
  }

  /**
   * 类型转二进制
   *
   * @param {Buffer} value - buffer
   * @return {binary} - TLV binary
   * @memberof BufferParse
   */
  typeToBinary(value) {
    assert(typeof value === 'string', `[BufferParse][typeToBinary] - 数据类型错误，需要为"string"，实际为: ${typeof value}`);

    const valueBuffer = Buffer.from(value, 'hex');
    let perfixBuffer = null;
    const bufferLength = valueBuffer.length;
    assert(bufferLength <= 255, `[BufferParse][typeToBinary] - 数值错误，需要<=255字节"，实际为：${value.length}`);
    if (bufferLength > 127) {
      perfixBuffer = Buffer.alloc(2);
      perfixBuffer.writeUInt16BE(bufferLength & 0xff); // eslint-disable-line
    } else {
      perfixBuffer = Buffer.alloc(1);
      perfixBuffer.writeUInt8(bufferLength);
    }
    return Buffer.concat([perfixBuffer, valueBuffer], bufferLength + perfixBuffer.length);
  }
}

module.exports = BufferParse;
