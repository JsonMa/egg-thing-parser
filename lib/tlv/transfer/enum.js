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

    const value = binary.readUIntLE(0, 1);
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
    assert(typeof value === 'number' || Buffer.isBuffer(value), `[EnumParse][typeToBinary] - 类型错误value: ${value}`);

    // Enum,索引为2，长度为1字节
    if (Buffer.isBuffer(value)) {
      assert(value.length === 1, `[EnumParse][typeToBinary] - 长度非1字节，value.length: ${value.length}`);
    }

    let valueBuffer = value;
    if (typeof value === 'number') {
      assert(value >= 0 && value <= 255, `[EnumParse][typeToBinary] - 数值超出限制，value: ${value}`);
      valueBuffer = Buffer.alloc(1);
      valueBuffer.writeUIntLE(value, 0, 1);
    }

    return this.tlvPackage({
      index: this.index,
      value: valueBuffer,
    });
  }
}

module.exports = EnumParse;
