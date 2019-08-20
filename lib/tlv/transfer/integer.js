'use strict';

const BaseTransfer = require('./baseTransfer');
const assert = require('assert');

/**
 * Integer解析
 *
 * @class IntegerParse
 * @extends {BaseTransfer}
 */
class IntegerParse extends BaseTransfer {
  /**
   *Creates an instance of IntegerParse.
   * @memberof IntegerParse
   */
  constructor() {
    super('INTEGER');
  }

  /**
   * Buffer转Integer
   *
   * @param {Binary} binary - Buffer输入
   * @return {Number} Number
   * @memberof IntegerParse
   */
  binaryToType(binary) {
    assert(Buffer.isBuffer(binary), `[IntegerParse][binaryToType] - 类型错误binary: ${binary}`);
    assert(binary.length === 4, `[IntegerParse][binaryToType] - 长度非4字节，binary length: ${binary.length}`);

    const value = binary.readInt32BE();
    return value;
  }

  /**
   * Integer转TLV
   *
   * @param {Number|Buffer} value - number value
   * @return {Binary} tlv buffer
   * @memberof IntegerParse
   */
  typeToBinary(value) {
    assert(typeof value === 'number' || Buffer.isBuffer(value), `[IntegerParse][typeToBinary] - 类型错误value: ${value}`);
    if (Buffer.isBuffer(value)) {
      assert(value.length === 4, `[IntegerParse][typeToBinary] - 长度非4字节，value length: ${value.length}`);
    }

    let valueBuffer = value;
    if (typeof value === 'number') {
      valueBuffer = Buffer.alloc(4);
      valueBuffer.writeInt32LE(value);
    }

    return this.tlvPackage({
      index: this.index,
      value: valueBuffer,
    });
  }
}

module.exports = IntegerParse;
