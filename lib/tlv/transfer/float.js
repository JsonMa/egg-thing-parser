'use strict';

const BaseTransfer = require('./baseTransfer');
const thingAssert = require('thing-assert');

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
    thingAssert(Buffer.isBuffer(binary), `[FloatParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`, 400);
    thingAssert(binary.length === 4, `[FloatParse][binaryToType] - 数据错误，长度需为4字节，实际为: ${binary.length}`, 400);

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
    thingAssert(typeof value === 'number', `[FloatParse][typeToBinary] - 数据类型错误，需要为"number"，实际为：${typeof value}`, 400);

    const valueBuffer = Buffer.allocUnsafe(4);
    valueBuffer.writeFloatBE(value);
    return valueBuffer;
  }
}
module.exports = FloatParse;
