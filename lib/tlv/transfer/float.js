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
    assert(Buffer.isBuffer(binary), `[FloatParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`);
    assert(binary.length === 4, `[FloatParse][binaryToType] - 数据错误，长度需为4字节，实际为: ${binary.length}`);

    const value = binary.readFloatBE();
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
    assert(typeof value === 'number', `[FloatParse][typeToBinary] - 数据类型错误，需要为"number"，实际为：${typeof value}`);

    const valueBuffer = Buffer.alloc(4);
    valueBuffer.writeFloatBE(value);
    return valueBuffer;
  }
}
module.exports = FloatParse;
