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
    assert(Buffer.isBuffer(binary), `[BufferParse][binaryToType] - 类型错误binary: ${binary}`);
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
    assert(Buffer.isBuffer(value) || typeof value === 'string', `[BufferParse][typeToBinary] - 类型错误value: ${value}`);

    if (typeof value === 'string') value = Buffer.from(value, 'hex');
    return this.tlvPackage({
      index: 'BUFFER',
      value,
    });
  }
}

module.exports = BufferParse;
