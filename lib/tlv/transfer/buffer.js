'use strict';

const BaseTransfer = require('./baseTransfer');
const thingAssert = require('thing-assert');

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
    thingAssert(Buffer.isBuffer(binary), `[BufferParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`, 400);
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
    thingAssert(typeof value === 'string' || Buffer.isBuffer(value), `[BufferParse][typeToBinary] - 数据类型错误，需要为string或buffer，实际为: ${typeof value}`, 400);
    const valueBuffer = Buffer.isBuffer(value) ? value : Buffer.from(value, 'hex');
    let perfixBuffer = null;
    const bufferLength = valueBuffer.length;
    thingAssert(bufferLength <= 0x3fffffff, `[BufferParse][typeToBinary] - 数值错误，需要<=0x3fffffff字节"，实际为：${value.length}`, 400);
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

module.exports = BufferParse;
