'use strict';

const BaseTransfer = require('./baseTransfer');
const assert = require('assert');

/**
 * Float类型解析
 *
 * @class FloatParse
 * @extends {BaseTransfer}
 */
class FloatParse extends BaseTransfer {
  /**
   *Creates an instance of FloatParse.
   * @memberof FloatParse
   */
  constructor() {
    super('FLOAT');
  }

  /**
   * 二进制转Type
   *
   * @param {Buffer} binary - 二进制输入
   * @return {Buffer} 转换后的值
   * @memberof FloatParse
   */
  binaryToType(binary) {
    assert(Buffer.isBuffer(binary), `[FloatParse][binaryToType] - 类型错误binary: ${binary}`);
    assert(binary.length === 8, `[FloatParse][binaryToType] - 长度非8字节，binary length: ${binary.length}`);

    const value = binary.readDoubleLE();
    return value;
  }

  /**
   * float转TLV
   *
   * @param {Number|Buffer} value - float输入
   * @return {Binary} Float TLV
   * @memberof FloatParse
   */
  typeToBinary(value) {
    assert(typeof value === 'number' || Buffer.isBuffer(value), `[FloatParse][typeToBinary] - 类型错误value: ${value}`);
    if (Buffer.isBuffer(value)) {
      assert(value.length === 8, `[FloatParse][typeToBinary] - 长度非8字节，value length: ${value.length}`);
    }

    let valueBuffer = value;
    if (typeof value === 'number') {
      valueBuffer = Buffer.alloc(8);
      valueBuffer.writeDoubleLE(value);
    }
    return this.tlvPackage({
      index: this.index,
      value: valueBuffer,
    });
  }
}
module.exports = FloatParse;
