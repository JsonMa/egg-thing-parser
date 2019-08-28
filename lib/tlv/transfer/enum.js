'use strict';

const BaseTransfer = require('./baseTransfer');
const assert = require('assert');

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
    assert(Buffer.isBuffer(binary), `[EnumParse][binaryToType] - 类型错误binary: ${binary}`);
    assert(binary.length === 1, `[EnumParse][binaryToType] - 长度非1字节，binary length: ${binary.length}`);

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
    assert(typeof value === 'number', `[EnumParse][typeToBinary] - 数据类型错误，需要为"number"，实际为：${typeof value}`);
    assert(value >= 0 && value <= 255, `[EnumParse][typeToBinary] - 数值错误，需要在"0~255"范围内，实际：${value}`);

    const valueBuffer = Buffer.alloc(1);
    valueBuffer.writeUInt8(value);
    return valueBuffer;
  }
}

module.exports = EnumParse;
