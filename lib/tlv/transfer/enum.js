'use strict';

const BaseTransfer = require('./baseTransfer');
const thingAssert = require('thing-assert');

/**
 * Enum解析类
 *
 * @class EnumParse
 * @extends {BaseTransfer}
 */
class EnumParse extends BaseTransfer {
  /**
   *Creates an instance of EnumParse.
   * @memberof EnumParse
   */
  constructor() {
    super('ENUM');
  }

  /**
   * value buffer => enum value
   *
   * @param {Buffer} binary   - buffer
   * @return {Binary}         - enum value
   * @memberof EnumParse
   */
  binaryToType(binary) {
    thingAssert(Buffer.isBuffer(binary), `[EnumParse][binaryToType] - 数据类型错误，需为二进制: ${binary}`, 400);
    thingAssert(binary.length === 1, `[EnumParse][binaryToType] - 数据错误，长度需为1字节，实际为: ${binary.length}`, 400);

    const value = binary.readUInt8();
    return value;
  }

  /**
   * 类型之转二进制
   *
   * @param {Number|Buffer}  value    - number|buffer输入
   * @return {Binary}                 - tlv buffer
   * @memberof EnumParse
   */
  typeToBinary(value) {
    thingAssert(typeof value === 'number', `[EnumParse][typeToBinary] - 数据类型错误，需要为"number"，实际为：${typeof value}`, 400);
    thingAssert(value >= 0 && value <= 255, `[EnumParse][typeToBinary] - 数值错误，需要在"0~255"范围内，实际：${value}`, 400);

    const valueBuffer = Buffer.allocUnsafe(1);
    valueBuffer.writeUInt8(value);
    return valueBuffer;
  }
}

module.exports = EnumParse;
