'use strict';

const BaseTransfer = require('./baseTransfer');
const thingAssert = require('thing-assert');

/**
 * Boolean解析类
 *
 * @class BooleanParse
 * @extends {BaseTransfer}
 */
class BooleanParse extends BaseTransfer {
  /**
   *Creates an instance of BooleanParse.
   * @memberof BooleanParse
   */
  constructor() {
    super('BOOLEAN');
  }

  /**
   * value buffer => boolean
   *
   * @param {Buffer} binary   - buffer(v => 0/1)
   * @return {Boolean}        - boolean(true/false)
   * @memberof BooleanParse
   */
  binaryToType(binary) {
    thingAssert(Buffer.isBuffer(binary), `[BooleanParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`, 400);
    thingAssert(binary.length === 1, `[BooleanParse][binaryToType] - 数据错误，长度需为1字节，实际为: ${binary.length}`, 400);

    const value = binary.readUInt8();
    thingAssert([ 0, 1 ].includes(value), `[BooleanParse][binaryToType] - 数据错误，需为0/1，实际为: ${value}`, 400);
    return !!value;
  }

  /**
   * boolean => tlv buffer
   *
   * @param {Boolean|Buffer} value - boolean | buffer value（0/1）
   * @return {Binary} - tlv buffer
   * @memberof BooleanParse
   */
  typeToBinary(value) {
    thingAssert(typeof value === 'boolean', `[BooleanParse][typeToBinary] - 数据类型错误，需要为"boolean"，实际为：${typeof value}`, 400);

    const valueBuffer = Buffer.allocUnsafe(1);
    valueBuffer.writeUInt8(Number(value));
    return valueBuffer;
  }
}

module.exports = BooleanParse;
