'use strict';

const BaseTransfer = require('./baseTransfer');
const thingAssert = require('thing-assert');

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
    thingAssert(Buffer.isBuffer(binary), `[IntegerParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`, 400);
    thingAssert(binary.length === 4, `[IntegerParse][binaryToType] - 数据错误，长度需为4字节，实际为: ${binary.length}`, 400);

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
    thingAssert(typeof value === 'number', `[IntegerParse][typeToBinary] - 数据类型错误，需要为"number"，实际为：${typeof value}`, 400);
    thingAssert(value >= -65536 && value <= 65535, `[IntegerParse][typeToBinary] - 数值错误，需要在"-65536 ~ 65535范围"，实际为：${value}`, 400);

    const valueBuffer = Buffer.allocUnsafe(4);
    valueBuffer.writeInt32BE(value);
    return valueBuffer;
  }
}

module.exports = IntegerParse;
